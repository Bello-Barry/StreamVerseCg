'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseM3UContent, parseXtreamContent } from '@/lib/parsers';
import { Playlist, PlaylistStatus, Channel, Category } from '@/types';
import { nanoid } from 'nanoid';

type PlaylistManagerState = {
  playlists: Playlist[];
  channels: Channel[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
  refreshPlaylists: () => Promise<void>;
  searchChannels: (term: string) => Channel[];
  resetStore: () => void;
};

const defaultPlaylists: Playlist[] = [
  {
    id: 'schumijo-fr',
    name: '🇫🇷 Schumijo FR',
    url: 'https://raw.githubusercontent.com/schumijo/iptv-fr/main/fr.m3u',
    type: 'url',
    status: 'active',
    lastUpdate: new Date(),
    isDefault: true
  },
  {
    id: 'iptv-org-france',
    name: '🇫🇷 IPTV-org France',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    type: 'url',
    status: 'active',
    lastUpdate: new Date(),
    isDefault: true
  }
];

const initialState: Omit<PlaylistManagerState, keyof ReturnType<typeof create>> = {
  playlists: defaultPlaylists,
  channels: [],
  categories: [],
  loading: false,
  error: null
};

export const usePlaylistStore = create<PlaylistManagerState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addPlaylist: (playlist) =>
        set((state) => {
          const exists = state.playlists.find((p) => p.id === playlist.id);
          if (exists) return state;

          return {
            playlists: [...state.playlists, { ...playlist, lastUpdate: new Date() }]
          };
        }),

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  ...updates,
                  lastUpdate: updates.lastUpdate ?? new Date()
                }
              : playlist
          )
        })),

      removePlaylist: (id) =>
        set((state) => {
          const toRemove = state.playlists.find((p) => p.id === id);
          if (!toRemove || toRemove.isDefault) return state;

          return {
            playlists: state.playlists.filter((p) => p.id !== id)
          };
        }),

      refreshPlaylists: async () => {
        const { playlists } = get();
        set({ loading: true, error: null });

        let allChannels: Channel[] = [];
        let allCategories: Category[] = [];

        try {
          for (const playlist of playlists) {
            try {
              let channels: Channel[] = [];

              if (playlist.type === 'xtream') {
                channels = await parseXtreamContent(playlist);
              } else if (playlist.type === 'url' || playlist.type === 'content') {
                channels = await parseM3UContent(playlist);
              }

              allChannels = [...allChannels, ...channels];
            } catch (err: any) {
              console.error(`Erreur de parsing de la playlist ${playlist.name}`, err);
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlist.id
                    ? { ...p, status: 'error', error: err.message || 'Erreur inconnue' }
                    : p
                )
              }));
            }
          }

          const categoryMap = new Map<string, Category>();
          for (const channel of allChannels) {
            if (channel.groupTitle) {
              categoryMap.set(channel.groupTitle, {
                id: nanoid(),
                name: channel.groupTitle
              });
            }
          }

          set({
            channels: allChannels,
            categories: Array.from(categoryMap.values()),
            loading: false
          });
        } catch (err: any) {
          set({ error: err.message || 'Erreur inconnue', loading: false });
        }
      },

      searchChannels: (term) => {
        const normalized = (str: string) =>
          str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        return get().channels.filter((channel) => {
          const name = normalized(channel.name);
          const query = normalized(term);
          return name.includes(query);
        });
      },

      resetStore: () =>
        set({
          ...initialState,
          playlists: defaultPlaylists
        })
    }),
    {
      name: 'playlist-store',
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hasDefaults =
            state.playlists?.some((p) => p.id === 'schumijo-fr' || p.id === 'iptv-org-france');

          if (!hasDefaults || !Array.isArray(state.playlists) || state.playlists.length === 0) {
            state.playlists = defaultPlaylists;
          }

          // Petit délai pour charger les chaînes après réhydratation
          setTimeout(() => {
            state.refreshPlaylists?.();
          }, 100);
        }
      }
    }
  )
);