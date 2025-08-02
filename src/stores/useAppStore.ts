import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppState,
  ViewType,
  UserPreferences,
  Channel,
  Theme,
  Quality
} from '@/types';

interface AppStore extends AppState {
  // Actions navigation
  setCurrentView: (view: ViewType) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setIsPlaying: (playing: boolean) => void;

  // Préférences utilisateur
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: string) => void;
  setAutoplay: (autoplay: boolean) => void;
  setQuality: (quality: Quality) => void;
  setVolume: (volume: number) => void;

  // Réinitialisation
  resetApp: () => void;
}

const defaultUserPreferences: UserPreferences = {
  theme: Theme.SYSTEM,
  language: 'fr',
  autoplay: false,
  quality: Quality.AUTO,
  volume: 0.8
};

const initialState: AppState = {
  currentView: ViewType.HOME,
  currentChannel: null,
  searchQuery: '',
  selectedCategory: null,
  isPlaying: false,
  userPreferences: defaultUserPreferences
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setCurrentView: (view) => set({ currentView: view }),

      setCurrentChannel: (channel) =>
        set({
          currentChannel: channel,
          currentView: channel ? ViewType.PLAYER : get().currentView
        }),

      setSearchQuery: (query) =>
        set({
          searchQuery: query,
          currentView: query ? ViewType.SEARCH : ViewType.HOME
        }),

      setSelectedCategory: (category) =>
        set({
          selectedCategory: category,
          currentView: category ? ViewType.CATEGORIES : ViewType.HOME
        }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      // Préférences utilisateur
      updateUserPreferences: (preferences) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences }
        })),

      setTheme: (theme) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, theme }
        })),

      setLanguage: (language) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, language }
        })),

      setAutoplay: (autoplay) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, autoplay }
        })),

      setQuality: (quality) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, quality }
        })),

      setVolume: (volume) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, volume }
        })),

      // Reset
      resetApp: () => set(initialState)
    }),
    {
      name: 'streamverse-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userPreferences: state.userPreferences
      })
    }
  )
);