'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Playlist,
  Channel,
  Category,
  PlaylistManagerState,
  M3UParseResult,
  PlaylistStatus,
  TorrentContent,
  Movie,
  Series,
  PlaylistType,
} from '@/types';
import { parseM3UContent } from '@/lib/m3uParser';
import { parseXtreamContent } from '@/lib/xtreamParser';
import { torrentService } from '@/lib/torrentService';

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
  getTorrents: () => Map<string, (TorrentContent)[]>;
  getTorrentsByPlaylist: (playlistId: string) => (Movie | Series)[];
}

const initialState: PlaylistManagerState = {
  playlists: [],
  channels: [],
  categories: [],
  torrents: new Map(),
  loading: false,
  error: null,
};

const defaultPlaylists: Playlist[] = [
  {
    id: 'schumijo-fr',
    name: 'Chaînes Françaises (Schumijo)',
    url: 'https://schumijo.fr/fr.m3u',
    type: PlaylistType.URL,
    status: PlaylistStatus.ACTIVE,
    lastUpdate: new Date(),
    channelCount: 0,
    isRemovable: false,
    description: 'Une liste de chaînes de télévision françaises gratuites.'
  },
];

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      playlists: defaultPlaylists,

      addPlaylist: async (playlist) => {
        const newPlaylist: Playlist = {
          ...playlist,
          id: `custom-playlist-${Date.now()}`,
          status: PlaylistStatus.LOADING,
          lastUpdate: new Date(),
          channelCount: 0,
          isRemovable: true,
        };
        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        await get().refreshPlaylist(newPlaylist.id);
      },

      updatePlaylist: (id, updates) => {
        set((state) => {
          const playlists = state.playlists.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          );
          return { playlists };
        });
      },

      removePlaylist: (id) => {
        set((state) => {
          const playlists = state.playlists.filter((p) => p.id !== id);
          const channels = state.channels.filter(
            (c) => c.playlistSource !== id
          );
          return {
            playlists,
            channels,
            categories: get().getCategories(),
          };
        });
      },

      togglePlaylistStatus: async (id) => {
        const playlist = get().playlists.find((p) => p.id === id);
        if (!playlist) return;

        if (playlist.status === PlaylistStatus.ACTIVE) {
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === id ? { ...p, status: PlaylistStatus.INACTIVE } : p
            ),
          }));
        } else {
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === id ? { ...p, status: PlaylistStatus.LOADING } : p
            ),
          }));
          await get().refreshPlaylist(id);
        }
      },

      refreshPlaylists: async () => {
        const { playlists } = get();
        get().setLoading(true);
        get().clearError();
        let allChannels: Channel[] = [];
        let allTorrents: Map<string, (TorrentContent)[]> = new Map();

        for (const playlist of playlists) {
          if (playlist.status === PlaylistStatus.ACTIVE) {
            try {
              let result;
              switch (playlist.type) {
                case PlaylistType.URL:
                  const response = await fetch(playlist.url!);
                  const content = await response.text();
                  result = parseM3UContent(content, playlist.id);
                  break;
                case PlaylistType.XTREAM:
                  result = await parseXtreamContent(
                    playlist.xtreamConfig!,
                    playlist.id
                  );
                  break;
                case PlaylistType.TORRENT:
                  result = await torrentService.parseTorrentContent(
                    playlist.url!,
                    playlist.id
                  );
                  if (result) {
                    allTorrents.set(playlist.id, [...result.movies, ...result.series]);
                  }
                  break;
                default:
                  throw new Error(`Type de playlist non supporté: ${playlist.type}`);
              }

              if (result && result.channels) {
                allChannels.push(...result.channels);
              }
              if (result && result.errors.length > 0) {
                result.errors.forEach((err) => get().setError(err));
              }

              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlist.id
                    ? {
                      ...p,
                      status: PlaylistStatus.ACTIVE,
                      channelCount: result.channels?.length || 0,
                      error: null,
                    }
                    : p
                ),
              }));
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
              set((state) => ({
                playlists: state.playlists.map((p) =>
                  p.id === playlist.id
                    ? {
                      ...p,
                      status: PlaylistStatus.ERROR,
                      error: `Erreur: ${errorMessage}`,
                    }
                    : p
                ),
              }));
              get().setError(`Erreur lors du rafraîchissement de ${playlist.name}: ${errorMessage}`);
            }
          }
        }
        
        set({ 
          channels: allChannels,
          categories: get().getCategories(),
          torrents: allTorrents,
          loading: false 
        });
      },

      refreshPlaylist: async (id) => {
        const playlist = get().playlists.find((p) => p.id === id);
        if (!playlist) return;

        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id ? { ...p, status: PlaylistStatus.LOADING } : p
          ),
        }));

        try {
          let result;
          switch (playlist.type) {
            case PlaylistType.URL:
              const response = await fetch(playlist.url!);
              const content = await response.text();
              result = parseM3UContent(content, playlist.id);
              break;
            case PlaylistType.XTREAM:
              result = await parseXtreamContent(
                playlist.xtreamConfig!,
                playlist.id
              );
              break;
            case PlaylistType.TORRENT:
              result = await torrentService.parseTorrentContent(
                playlist.url!,
                playlist.id
              );
              break;
            default:
              throw new Error(`Type de playlist non supporté: ${playlist.type}`);
          }
          
          if (result && result.errors.length > 0) {
            result.errors.forEach((err) => get().setError(err));
          }

          set((state) => {
            const otherChannels = state.channels.filter(c => c.playlistSource !== id);
            const otherTorrents = new Map(state.torrents);
            otherTorrents.delete(id);

            const updatedTorrents = result.movies || result.series ? otherTorrents.set(id, [...(result.movies || []), ...(result.series || [])]) : otherTorrents;
            
            return {
              channels: [...otherChannels, ...(result.channels || [])],
              playlists: state.playlists.map((p) =>
                p.id === id
                  ? {
                    ...p,
                    status: PlaylistStatus.ACTIVE,
                    channelCount: result.channels?.length || 0,
                    error: null,
                    lastUpdate: new Date(),
                  }
                  : p
              ),
              categories: get().getCategories(),
              torrents: updatedTorrents,
            };
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === id
                ? {
                  ...p,
                  status: PlaylistStatus.ERROR,
                  error: `Erreur: ${errorMessage}`,
                }
                : p
            ),
          }));
          get().setError(`Erreur lors du rafraîchissement de ${playlist.name}: ${errorMessage}`);
        }
      },

      getChannelsByCategory: (category) => {
        return get().channels.filter(
          (channel) => (channel.category || channel.group || 'Undefined') === category
        );
      },

      searchChannels: (query) => {
        if (!query) {
          return get().channels;
        }
        const lowerCaseQuery = query.toLowerCase();
        return get().channels.filter((channel) =>
          channel.name.toLowerCase().includes(lowerCaseQuery)
        );
      },

      getCategories: () => {
        const { channels } = get();
        const categoryMap = new Map<string, Channel[]>();

        channels.forEach((channel) => {
          const category = channel.category || channel.group || 'Undefined';
          if (!categoryMap.has(category)) categoryMap.set(category, []);
          categoryMap.get(category)!.push(channel);
        });

        return Array.from(categoryMap.entries())
          .map(([name, channels]) => ({
            name,
            channels,
            count: channels.length,
          }))
          .sort((a, b) => b.count - a.count);
      },

      getCategoryCount: (category) => {
        const { channels } = get();
        return channels.filter(
          (channel) => (channel.category || channel.group || 'Undefined') === category
        ).length;
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      getTorrents: () => get().torrents,

      getTorrentsByPlaylist: (playlistId) => {
        return get().torrents.get(playlistId) || [];
      },

      resetStore: () =>
        set({
          ...initialState,
          playlists: defaultPlaylists,
        }),
    }),
    {
      name: 'streamverse-playlist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlists: state.playlists,
      }),
      onRehydrateStorage: () => (state) => {
        let timeoutId: NodeJS.Timeout;
        if (state && state.playlists.length === 0) {
          state.playlists = defaultPlaylists;
        }
        if (state) {
          timeoutId = setTimeout(() => {
            if (state.refreshPlaylists) {
              state.refreshPlaylists();
            }
          }, 100);
        }
        return () => clearTimeout(timeoutId);
      },
    }
  )
);
