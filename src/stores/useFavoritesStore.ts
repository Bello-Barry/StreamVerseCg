import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FavoritesState, Channel } from '@/types';

interface FavoritesStore extends FavoritesState {
  // Actions étendues
  addMultipleFavorites: (channelIds: string[]) => void;
  removeMultipleFavorites: (channelIds: string[]) => void;
  clearAllFavorites: () => void;
  getFavoriteChannels: (allChannels: Channel[]) => Channel[];
  getFavoritesByCategory: (allChannels: Channel[]) => Record<string, Channel[]>;
  getFavoritesCount: () => number;
  exportFavorites: () => string[];
  importFavorites: (favoriteIds: string[]) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      // Actions de base
      toggleFavorite: (channelId) => set((state) => ({
        favorites: state.favorites.includes(channelId)
          ? state.favorites.filter(id => id !== channelId)
          : [...state.favorites, channelId]
      })),
      
      addFavorite: (channelId) => set((state) => ({
        favorites: state.favorites.includes(channelId)
          ? state.favorites
          : [...state.favorites, channelId]
      })),
      
      removeFavorite: (channelId) => set((state) => ({
        favorites: state.favorites.filter(id => id !== channelId)
      })),
      
      isFavorite: (channelId) => {
        return get().favorites.includes(channelId);
      },
      
      // Actions étendues
      addMultipleFavorites: (channelIds) => set((state) => {
        const newFavorites = channelIds.filter(id => !state.favorites.includes(id));
        return {
          favorites: [...state.favorites, ...newFavorites]
        };
      }),
      
      removeMultipleFavorites: (channelIds) => set((state) => ({
        favorites: state.favorites.filter(id => !channelIds.includes(id))
      })),
      
      clearAllFavorites: () => set({ favorites: [] }),
      
      getFavoriteChannels: (allChannels) => {
        const { favorites } = get();
        return allChannels.filter(channel => favorites.includes(channel.id));
      },
      
      getFavoritesByCategory: (allChannels) => {
        const favoriteChannels = get().getFavoriteChannels(allChannels);
        const categoryMap: Record<string, Channel[]> = {};
        
        favoriteChannels.forEach(channel => {
          const category = channel.group || 'Undefined';
          if (!categoryMap[category]) {
            categoryMap[category] = [];
          }
          categoryMap[category].push(channel);
        });
        
        return categoryMap;
      },
      
      getFavoritesCount: () => get().favorites.length,
      
      exportFavorites: () => get().favorites,
      
      importFavorites: (favoriteIds) => set({ favorites: favoriteIds })
    }),
    {
      name: 'streamverse-favorites-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

