'use client'

import { channelValidator } from './channelValidator'

import type { Channel } from "@/types";

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
  private watchHistory: Map<string, number> = new Map() // channelId -> watch count
  private categoryPreferences: Map<string, number> = new Map() // category -> preference score
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

  /**
   * Obtient des recommandations intelligentes de chaînes
   */
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

    // Filtrer les chaînes selon les critères de base
    let filteredChannels = allChannels.filter(channel => {
      // Exclure les chaînes hors ligne si demandé
      if (excludeOfflineChannels) {
        const status = channelValidator.getChannelStatus(channel.id)
        if (status && status.status === 'offline') {
          return false
        }
      }

      // Vérifier la fiabilité minimale
      const status = channelValidator.getChannelStatus(channel.id)
      if (status && status.reliability < minReliability) {
        return false
      }

      return true
    })

    // Calculer les scores de recommandation
    const scoredChannels = filteredChannels.map(channel => ({
      channel,
      score: this.calculateRecommendationScore(channel, {
        preferredCategories,
        boostPopularChannels
      })
    }))

    // Trier par score et retourner les meilleures recommandations
    return scoredChannels
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
      .map(item => item.channel)
  }

  /**
   * Obtient les chaînes les plus fiables par catégorie
   */
  getReliableChannelsByCategory(
    allChannels: Channel[],
    category: string,
    limit = 10
  ): Channel[] {
    const categoryChannels = allChannels.filter(
      channel => channel.category.toLowerCase() === category.toLowerCase()
    )

    return categoryChannels
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
        // Prioriser les chaînes en ligne
        if (a.isOnline && !b.isOnline) return -1
        if (!a.isOnline && b.isOnline) return 1
        // Puis par fiabilité
        return b.reliability - a.reliability
      })
      .slice(0, limit)
      .map(item => item.channel)
  }

  /**
   * Obtient des alternatives pour une chaîne qui ne fonctionne pas
   */
  getChannelAlternatives(
    failedChannel: Channel,
    allChannels: Channel[],
    limit = 5
  ): Channel[] {
    // Chercher des chaînes similaires dans la même catégorie
    const sameCategory = allChannels.filter(
      channel => 
        channel.id !== failedChannel.id &&
        channel.category === failedChannel.category
    )

    // Chercher des chaînes avec des noms similaires
    const similarNames = allChannels.filter(
      channel =>
        channel.id !== failedChannel.id &&
        this.calculateNameSimilarity(channel.name, failedChannel.name) > 0.5
    )

    // Combiner et scorer les alternatives
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

  /**
   * Met à jour l'historique de visionnage
   */
  updateWatchHistory(channelId: string, category: string): void {
    // Mettre à jour le compteur de visionnage
    const currentCount = this.watchHistory.get(channelId) || 0
    this.watchHistory.set(channelId, currentCount + 1)

    // Mettre à jour les préférences de catégorie
    const currentCategoryScore = this.categoryPreferences.get(category) || 0
    this.categoryPreferences.set(category, currentCategoryScore + 1)

    // Mettre à jour les dernières chaînes regardées
    this.lastWatchedChannels = [
      channelId,
      ...this.lastWatchedChannels.filter(id => id !== channelId)
    ].slice(0, 10) // Garder seulement les 10 dernières

    // Sauvegarder les données
    this.saveUserData()
  }

  /**
   * Obtient les chaînes populaires basées sur l'historique global
   */
  getPopularChannels(allChannels: Channel[], limit = 20): Channel[] {
    const channelStats = Array.from(this.watchHistory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    return channelStats
      .map(([channelId]) => allChannels.find(c => c.id === channelId))
      .filter((channel): channel is Channel => channel !== undefined)
  }

  /**
   * Obtient les catégories préférées de l'utilisateur
   */
  getPreferredCategories(): Array<{category: string, score: number}> {
    return Array.from(this.categoryPreferences.entries())
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Calcule le score de recommandation pour une chaîne
   */
  private calculateRecommendationScore(
    channel: Channel,
    options: {
      preferredCategories?: string[]
      boostPopularChannels?: boolean
    }
  ): number {
    let score = 0

    // Score de base : fiabilité de la chaîne
    const status = channelValidator.getChannelStatus(channel.id)
    if (status) {
      score += status.reliability * 0.4 // 40% du score basé sur la fiabilité
      
      // Bonus pour les chaînes en ligne
      if (status.status === 'online') {
        score += 20
      }
      
      // Bonus pour les temps de réponse rapides
      if (status.responseTime && status.responseTime < 2000) {
        score += 10
      }
    }

    // Score basé sur l'historique de visionnage
    const watchCount = this.watchHistory.get(channel.id) || 0
    score += Math.min(watchCount * 5, 25) // Maximum 25 points pour l'historique

    // Score basé sur les préférences de catégorie
    const categoryScore = this.categoryPreferences.get(channel.category) || 0
    score += Math.min(categoryScore * 2, 15) // Maximum 15 points pour la catégorie

    // Bonus pour les catégories préférées spécifiées
    if (options.preferredCategories?.includes(channel.category)) {
      score += 15
    }

    // Bonus pour les chaînes récemment regardées (mais pas trop récentes)
    const recentIndex = this.lastWatchedChannels.indexOf(channel.id)
    if (recentIndex >= 3 && recentIndex <= 7) { // Entre la 4ème et 8ème position
      score += 10
    }

    // Bonus pour les langues et pays préférés
    if (channel.language && this.userPreferences.preferredLanguages.includes(channel.language)) {
      score += 8
    }
    if (channel.country && this.userPreferences.preferredCountries.includes(channel.country)) {
      score += 8
    }

    // Boost pour les chaînes populaires globalement
    if (options.boostPopularChannels) {
      const globalPopularity = this.getGlobalPopularityScore(channel.id)
      score += globalPopularity * 0.1
    }

    return Math.round(score)
  }

  /**
   * Calcule la similarité entre deux noms de chaînes
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => 
      str.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const n1 = normalize(name1)
    const n2 = normalize(name2)
    
    if (n1 === n2) return 1
    if (n1.includes(n2) || n2.includes(n1)) return 0.8
    
    // Calcul de distance de Levenshtein simplifiée
    const maxLength = Math.max(n1.length, n2.length)
    if (maxLength === 0) return 1
    
    let matches = 0
    const minLength = Math.min(n1.length, n2.length)
    
    for (let i = 0; i < minLength; i++) {
      if (n1[i] === n2[i]) matches++
    }
    
    return matches / maxLength
  }

  /**
   * Obtient le score de popularité global d'une chaîne
   */
  private getGlobalPopularityScore(channelId: string): number {
    // Simuler un score de popularité basé sur des données fictives
    // Dans une vraie application, cela viendrait d'analytics globaux
    const hash = this.simpleHash(channelId)
    return hash % 100 // Score entre 0 et 99
  }

  /**
   * Hash simple pour simuler des données
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convertir en 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Sauvegarde les données utilisateur
   */
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

  /**
   * Charge les données utilisateur
   */
  private loadUserData(): void {
    if (typeof window === 'undefined') return

    try {
      const userData = localStorage.getItem('streamverse_user_recommendations')
      if (!userData) return

      const data = JSON.parse(userData)
      
      this.watchHistory = new Map(data.watchHistory || [])
      this.categoryPreferences = new Map(data.categoryPreferences || [])
      this.lastWatchedChannels = data.lastWatchedChannels || []
      this.userPreferences = { ...this.userPreferences, ...data.userPreferences }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error)
    }
  }
}

// Instance singleton
export const smartRecommendation = new SmartChannelRecommendation()

// Hook React pour utiliser le système de recommandation
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