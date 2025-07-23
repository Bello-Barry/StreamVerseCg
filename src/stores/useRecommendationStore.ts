import { create } from 'zustand'
import { smartRecommendation } from '@/lib/smartChannelRecommendation'
import type { Channel } from '@/types'
import type { SmartRecommendationOptions } from '@/lib/smartChannelRecommendation'

interface RecommendationStore {
  recommendations: Channel[]
  popularChannels: Channel[]
  preferredCategories: { category: string; score: number }[]
  setRecommendations: (channels: Channel[], options?: SmartRecommendationOptions) => void
  updateWatchHistory: (channelId: string, category: string) => void
  refreshPopularChannels: (channels: Channel[]) => void
  refreshPreferredCategories: () => void
}

export const useRecommendationStore = create<RecommendationStore>((set) => ({
  recommendations: [],
  popularChannels: [],
  preferredCategories: [],

  setRecommendations: (channels, options) => {
    const recommendations = smartRecommendation.getSmartRecommendations(channels, options)
    set({ recommendations })
  },

  updateWatchHistory: (channelId, category) => {
    smartRecommendation.updateWatchHistory(channelId, category)
  },

  refreshPopularChannels: (channels) => {
    const popularChannels = smartRecommendation.getPopularChannels(channels)
    set({ popularChannels })
  },

  refreshPreferredCategories: () => {
    const preferredCategories = smartRecommendation.getPreferredCategories()
    set({ preferredCategories })
  }
}))