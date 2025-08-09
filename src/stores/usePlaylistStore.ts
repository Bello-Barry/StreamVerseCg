'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Playlist,
  Channel,
  Category,
  PlaylistManagerState,
  M3UParseResult,
  PlaylistStatus
} from '@/types';
import { parseM3UContent } from '@/lib/m3uParser';
import { parseXtreamContent } from '@/lib/xtreamParser';

interface PlaylistStore extends PlaylistManagerState {
  addPlaylist: (playlist: Omit<Playlist, 'id'>) => Promise<void>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
  togglePlaylistStatus: (id: string) => void;
  refreshPlaylists: () => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;
  getChannelsByCategory: (category: string) => Channel[];
  searchChannels: (query: string) => Channel[];
  getCategories: () => Category[];
  getCategoryCount: (category: string) => number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

const initialState: PlaylistManagerState = {
  playlists: [],
  channels: [],
  categories: [],
  torrents: new Map(), // Correction : Ajout de la propriété 'torrents' pour correspondre à l'interface
  loading: false,
  error: null
};

const defaultPlaylists: Playlist[] = [
  {
    id: 'schumijo-fr',
    name: 'Chaînes Françaises (Schumijo)',
    url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
    type: PlaylistType.URL,
    status: PlaylistStatus.ACTIVE,
    description: 'Playlist française de Schumijo avec chaînes françaises',
    isRemovable: false,
    channelCount: 0
  },
  {
    id: 'iptv-org-france',
    name: 'IPTV-Org (France)',
    url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
    type: PlaylistType.URL,
    status: PlaylistStatus.ACTIVE,
    description: 'Chaînes françaises de IPTV-Org',
    isRemovable: false,
    channelCount: 0
  }
];

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialisation avec les playlists par défaut si le store est vide
      playlists: defaultPlaylists,
      
      addPlaylist: async (playlistData) => {
        const newPlaylist: Playlist = {
          ...playlistData,
          id: `playlist-${Date.now()}`,
          lastUpdate: new Date(),
          status: PlaylistStatus.ACTIVE,
          isRemovable: true,
          channelCount: 0 // Assurer que le nombre de chaînes est initialisé
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist]
        }));

        await get().refreshPlaylist(newPlaylist.id);
      },

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? { ...playlist, ...updates, lastUpdate: new Date() }
              : playlist
          )
        })),

      removePlaylist: (id) => {
        const { playlists } = get();
        const playlist = playlists.find((p) => p.id === id);
        if (playlist && playlist.isRemovable === false) {
          console.warn(`Impossible de supprimer la playlist "${playlist.name}" car elle est protégée.`);
          return;
        }

        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== id),
          channels: state.channels.filter((channel) => channel.playlistSource !== id),
          torrents: new Map(
            Array.from(state.torrents.entries()).filter(([key, _]) => key !== id)
          )
        }));
      },

      togglePlaylistStatus: (id) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  status:
                    playlist.status === PlaylistStatus.ACTIVE
                      ? PlaylistStatus.INACTIVE
                      : PlaylistStatus.ACTIVE,
                  lastUpdate: new Date()
                }
              : playlist
          )
        })),

      refreshPlaylists: async () => {
        const { playlists } = get();
        set({ loading: true, error: null });

        try {
          const activePlaylists = playlists.filter(
            (p) => p.status === PlaylistStatus.ACTIVE
          );
          const allChannels: Channel[] = [];

          for (const playlist of activePlaylists) {
            try {
              let parseResult: M3UParseResult;

              if (
                playlist.type === 'xtream' &&
                playlist.xtreamConfig?.server &&
                playlist.xtreamConfig?.username &&
                playlist.xtreamConfig?.password
              ) {
                parseResult = await parseXtreamContent(
                  playlist.xtreamConfig,
                  playlist.id
                );
              } else if (playlist.type === 'url' && playlist.url) {
                const response = await fetch(playlist.url);
                if (!response.ok)
                  throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                  );
                const content = await response.text();
                parseResult = parseM3UContent(content, playlist.id);
              } else if (playlist.content) {
                parseResult = parseM3UContent(playlist.content, playlist.id);
              } else {
                continue;
              }

              if (parseResult.channels.length > 0) {
                allChannels.push(...parseResult.channels);

                get().updatePlaylist(playlist.id, {
                  channelCount: parseResult.channels.length,
                  status: PlaylistStatus.ACTIVE
                });
              }
            } catch (error) {
              console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
              get().updatePlaylist(playlist.id, {
                status: PlaylistStatus.ERROR
              });
            }
          }

          set({
            channels: allChannels,
            categories: get().getCategories(),
            loading: false
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Erreur inconnue',
            loading: false
          });
        }
      },

      refreshPlaylist: async (id) => {
        const { playlists } = get();
        const playlist = playlists.find((p) => p.id === id);

        if (!playlist || playlist.status !== PlaylistStatus.ACTIVE) return;

        set({ loading: true });

        try {
          let parseResult: M3UParseResult;

          if (
            playlist.type === 'xtream' &&
            playlist.xtreamConfig?.server &&
            playlist.xtreamConfig?.username &&
            playlist.xtreamConfig?.password
          ) {
            parseResult = await parseXtreamContent(
              playlist.xtreamConfig,
              playlist.id
            );
          } else if (playlist.type === 'url' && playlist.url) {
            const response = await fetch(playlist.url);
            if (!response.ok)
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            const content = await response.text();
            parseResult = parseM3UContent(content, playlist.id);
          } else if (playlist.content) {
            parseResult = parseM3UContent(playlist.content, playlist.id);
          } else {
            throw new Error('Configuration de playlist invalide');
          }

          if (parseResult.channels.length > 0) {
            set((state) => ({
              channels: [
                ...state.channels.filter(
                  (c) => c.playlistSource !== playlist.id
                ),
                ...parseResult.channels
              ],
              loading: false
            }));

            get().updatePlaylist(id, {
              channelCount: parseResult.channels.length,
              status: PlaylistStatus.ACTIVE
            });
          } else {
            throw new Error('Aucune chaîne trouvée dans la playlist');
          }
        } catch (error) {
          console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
          get().updatePlaylist(id, { status: PlaylistStatus.ERROR });
          set({ loading: false });
        }
      },

      getChannelsByCategory: (category) => {
        const { channels } = get();
        return channels.filter(
          (channel) => (channel.group || 'Undefined') === category
        );
      },

      searchChannels: (query) => {
        const { channels } = get();
        if (!query.trim()) return channels;
        const searchTerm = query.toLowerCase();

        return channels.filter(
          (channel) =>
            channel.name.toLowerCase().includes(searchTerm) ||
            (channel.group || '').toLowerCase().includes(searchTerm) ||
            (channel.country || '').toLowerCase().includes(searchTerm) ||
            (channel.language || '').toLowerCase().includes(searchTerm)
        );
      },

      getCategories: () => {
        const { channels } = get();
        const categoryMap = new Map<string, Channel[]>();

        channels.forEach((channel) => {
          const category = channel.group || 'Undefined';
          if (!categoryMap.has(category)) categoryMap.set(category, []);
          categoryMap.get(category)!.push(channel);
        });

        return Array.from(categoryMap.entries())
          .map(([name, channels]) => ({
            name,
            channels,
            count: channels.length
          }))
          .sort((a, b) => b.count - a.count);
      },

      getCategoryCount: (category) => {
        const { channels } = get();
        return channels.filter(
          (channel) => (channel.group || 'Undefined') === category
        ).length;
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      resetStore: () =>
        set({
          ...initialState,
          playlists: defaultPlaylists
        })
    }),
    {
      name: 'streamverse-playlist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlists: state.playlists
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.playlists.length === 0) {
          state.playlists = defaultPlaylists;
        }
        if (state) {
          setTimeout(() => state.refreshPlaylists(), 100);
        }
      }
    }
  )
);
