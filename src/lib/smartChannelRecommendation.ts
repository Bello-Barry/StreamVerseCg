'use client'

import { channelValidator } from './channelValidator'
import type { Channel } from '@/types'

export interface RecommendationScore {
  channelId: string
  score: number
  reasons: string[]
}

export interface SmartRecommendationOptions {
  maxRecommendations?: number
  minReliability?: number
  preferredCategories?: string[]
  excludeOfflineChannels?: boolean
  boostPopularChannels?: boolean
}

class SmartChannelRecommendation {
  private watchHistory: Map<string, number> = new Map()
  private categoryPreferences: Map<string, number> = new Map()
  private lastWatchedChannels: string[] = []
  private userPreferences: {
    preferredLanguages: string[]
    preferredCountries: string[]
    favoriteCategories: string[]
  } = {
    preferredLanguages: [],
    preferredCountries: [],
    favoriteCategories: []
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUserData()
    }
  }

  getSmartRecommendations(
    allChannels: Channel[],
    options: SmartRecommendationOptions = {}
  ): Channel[] {
    const {
      maxRecommendations = 20,
      minReliability = 50,
      preferredCategories = [],
      excludeOfflineChannels = true,
      boostPopularChannels = true
    } = options

    let filteredChannels = allChannels.filter(channel => {
      const status = channelValidator.getChannelStatus(channel.id)

      if (excludeOfflineChannels && status?.status === 'offline') {
        return false
      }

      if (status && status.reliability < minReliability) {
        return false
      }

      return true
    })

    const scoredChannels = filteredChannels.map(channel => ({
      channel,
      score: this.calculateRecommendationScore(channel, {
        preferredCategories,
        boostPopularChannels
      })
    }))

    return scoredChannels
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
      .map(item => item.channel)
  }

  getReliableChannelsByCategory(
    allChannels: Channel[],
    category: string,
    limit = 10
  ): Channel[] {
    return allChannels
      .filter(channel => channel.category?.toLowerCase() === category.toLowerCase())
      .map(channel => {
        const status = channelValidator.getChannelStatus(channel.id)
        return {
          channel,
          reliability: status?.reliability || 0,
          isOnline: status?.status === 'online'
        }
      })
      .filter(item => item.reliability > 0)
      .sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        return b.reliability - a.reliability
      })
      .slice(0, limit)
      .map(item => item.channel)
  }

  getChannelAlternatives(
    failedChannel: Channel,
    allChannels: Channel[],
    limit = 5
  ): Channel[] {
    const sameCategory = allChannels.filter(
      channel =>
        channel.id !== failedChannel.id &&
        channel.category === failedChannel.category
    )

    const similarNames = allChannels.filter(
      channel =>
        channel.id !== failedChannel.id &&
        this.calculateNameSimilarity(channel.name, failedChannel.name) > 0.5
    )

    const alternatives = [...new Set([...sameCategory, ...similarNames])]

    return alternatives
      .map(channel => {
        const status = channelValidator.getChannelStatus(channel.id)
        const reliability = status?.reliability || 0
        const isOnline = status?.status === 'online'
        const nameSimilarity = this.calculateNameSimilarity(channel.name, failedChannel.name)

        return {
          channel,
          score: (reliability * 0.6) + (nameSimilarity * 0.3) + (isOnline ? 10 : 0)
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.channel)
  }

  updateWatchHistory(channelId: string, category: string): void {
    const currentCount = this.watchHistory.get(channelId) || 0
    this.watchHistory.set(channelId, currentCount + 1)

    const currentCategoryScore = this.categoryPreferences.get(category) || 0
    this.categoryPreferences.set(category, currentCategoryScore + 1)

    this.lastWatchedChannels = [
      channelId,
      ...this.lastWatchedChannels.filter(id => id !== channelId)
    ].slice(0, 10)

    this.saveUserData()
  }

  getPopularChannels(allChannels: Channel[], limit = 20): Channel[] {
    const channelStats = Array.from(this.watchHistory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    return channelStats
      .map(([channelId]) => allChannels.find(c => c.id === channelId))
      .filter((channel): channel is Channel => channel !== undefined)
  }

  getPreferredCategories(): Array<{ category: string, score: number }> {
    return Array.from(this.categoryPreferences.entries())
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score)
  }

  private calculateRecommendationScore(
    channel: Channel,
    options: {
      preferredCategories?: string[]
      boostPopularChannels?: boolean
    }
  ): number {
    let score = 0
    const status = channelValidator.getChannelStatus(channel.id)

    if (status) {
      score += status.reliability * 0.4

      if (status.status === 'online') {
        score += 20
      }

      if (status.responseTime && status.responseTime < 2000) {
        score += 10
      }
    }

    const watchCount = this.watchHistory.get(channel.id) || 0
    score += Math.min(watchCount * 5, 25)

    const categoryScore = channel.category
  ? this.categoryPreferences.get(channel.category) || 0
  : 0
    score += Math.min(categoryScore * 2, 15)

    if (channel.category && options.preferredCategories?.includes(channel.category)) {
      score += 15
    }

    const recentIndex = this.lastWatchedChannels.indexOf(channel.id)
    if (recentIndex >= 3 && recentIndex <= 7) {
      score += 10
    }

    if (channel.language && this.userPreferences.preferredLanguages.includes(channel.language)) {
      score += 8
    }

    if (channel.country && this.userPreferences.preferredCountries.includes(channel.country)) {
      score += 8
    }

    if (options.boostPopularChannels) {
      const globalPopularity = this.getGlobalPopularityScore(channel.id)
      score += globalPopularity * 0.1
    }

    return Math.round(score)
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, '')

    const n1 = normalize(name1)
    const n2 = normalize(name2)

    if (n1 === n2) return 1
    if (n1.includes(n2) || n2.includes(n1)) return 0.8

    const maxLength = Math.max(n1.length, n2.length)
    if (maxLength === 0) return 1

    let matches = 0
    const minLength = Math.min(n1.length, n2.length)

    for (let i = 0; i < minLength; i++) {
      if (n1[i] === n2[i]) matches++
    }

    return matches / maxLength
  }

  private getGlobalPopularityScore(channelId: string): number {
    const hash = this.simpleHash(channelId)
    return hash % 100
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private saveUserData(): void {
    if (typeof window === 'undefined') return

    try {
      const userData = {
        watchHistory: Array.from(this.watchHistory.entries()),
        categoryPreferences: Array.from(this.categoryPreferences.entries()),
        lastWatchedChannels: this.lastWatchedChannels,
        userPreferences: this.userPreferences
      }

      localStorage.setItem('streamverse_user_recommendations', JSON.stringify(userData))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error)
    }
  }

  private loadUserData(): void {
    if (typeof window === 'undefined') return

    try {
      const userData = localStorage.getItem('streamverse_user_recommendations')
      if (!userData) return

      let data
      try {
        data = JSON.parse(userData)
      } catch (e) {
        console.error('Erreur de parsing JSON :', e)
        return
      }

      this.watchHistory = new Map(data.watchHistory || [])
      this.categoryPreferences = new Map(data.categoryPreferences || [])
      this.lastWatchedChannels = data.lastWatchedChannels || []
      this.userPreferences = { ...this.userPreferences, ...data.userPreferences }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error)
    }
  }
}

export const smartRecommendation = new SmartChannelRecommendation()

export function useSmartRecommendation() {
  return {
    getSmartRecommendations: smartRecommendation.getSmartRecommendations.bind(smartRecommendation),
    getReliableChannelsByCategory: smartRecommendation.getReliableChannelsByCategory.bind(smartRecommendation),
    getChannelAlternatives: smartRecommendation.getChannelAlternatives.bind(smartRecommendation),
    updateWatchHistory: smartRecommendation.updateWatchHistory.bind(smartRecommendation),
    getPopularChannels: smartRecommendation.getPopularChannels.bind(smartRecommendation),
    getPreferredCategories: smartRecommendation.getPreferredCategories.bind(smartRecommendation)
  }
}