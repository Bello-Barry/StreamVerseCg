import { create } from 'zustand';
import { Channel } from '@/types';
import { smartRecommendation } from '@/lib/smartChannelRecommendation';

interface RecommendationPreferences {
  preferredCategories?: string[];
  recentChannels?: Channel[];
  mostWatchedChannels?: Channel[];
}

interface RecommendationState {
  recommendations: Channel[];
  setRecommendations: (channels: Channel[], preferences: RecommendationPreferences) => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  recommendations: [],
  setRecommendations: (channels, preferences) => {
    const result = smartRecommendation.getSmartRecommendations(channels, {
      preferredCategories: preferences.preferredCategories
    });
    set({ recommendations: result });
  },
}));