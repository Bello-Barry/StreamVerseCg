'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import {
  Playlist,
  Channel,
  Category,
  PlaylistManagerState,
  M3UParseResult,
  PlaylistStatus,
  PlaylistType,
  Movie,
  Series,
  TorrentParserResult,
} from '@/types';
import { parseM3UContent } from '@/lib/m3uParser';
import { parseXtreamContent } from '@/lib/xtreamParser';
import { parseTorrentContent } from '@/lib/torrentParser';

/**
 * Interface pour le store global de playlists, étendue pour supporter les torrents.
 * @interface PlaylistStore
 */
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

// État initial du store
const initialState: PlaylistManagerState = {
  playlists: [],
  channels: [],
  categories: [],
  torrents: new Map<string, (Movie | Series)[]>(), // Initialise la Map des torrents
  loading: false,
  error: null,
};

// Playlists par défaut, non modifiables par l'utilisateur
const defaultPlaylists: Playlist[] = [
  {
    id: 'schumijo-fr',
    name: 'Chaînes Françaises (Schumijo)',
    url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
    type: PlaylistType.URL,
    status: PlaylistStatus.ACTIVE,
    description: 'Playlist française de Schumijo avec chaînes françaises',
    isRemovable: false,
    channelCount: 0,
    lastUpdate: new Date(0),
  },
  {
    id: 'iptv-org-france',
    name: 'IPTV-Org (France)',
    url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
    type: PlaylistType.URL,
    status: PlaylistStatus.ACTIVE,
    description: 'Chaînes françaises de IPTV-Org',
    isRemovable: false,
    channelCount: 0,
    lastUpdate: new Date(0),
  },
];

/**
 * Fonction utilitaire pour fetch et parser une playlist de manière générique.
 * @param {Playlist} playlist La playlist à traiter.
 * @returns {Promise<M3UParseResult | TorrentParserResult>}
 */
const fetchAndProcessPlaylist = async (
  playlist: Playlist
): Promise<M3UParseResult | TorrentParserResult> => {
  if (playlist.status !== PlaylistStatus.ACTIVE) {
    throw new Error('La playlist est inactive.');
  }

  switch (playlist.type) {
    case PlaylistType.XTREAM:
      if (!playlist.xtreamConfig) {
        throw new Error('Configuration Xtream invalide.');
      }
      return parseXtreamContent(playlist.xtreamConfig, playlist.id);

    case PlaylistType.URL:
      if (!playlist.url) {
        throw new Error('URL de playlist invalide.');
      }
      const response = await fetch(playlist.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      return parseM3UContent(content, playlist.id);

    case PlaylistType.FILE:
      if (!playlist.content) {
        throw new Error('Contenu de fichier invalide.');
      }
      return parseM3UContent(playlist.content, playlist.id);

    case PlaylistType.TORRENT:
      if (!playlist.url && !playlist.content) {
        throw new Error('Lien ou fichier torrent manquant.');
      }
      return parseTorrentContent(playlist.url || playlist.content!, playlist.id);

    default:
      throw new Error('Type de playlist inconnu.');
  }
};

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      torrents: new Map<string, (Movie | Series)[]>(),

      addPlaylist: async (playlistData) => {
        const newPlaylist: Playlist = {
          ...playlistData,
          id: `playlist-${Date.now()}`,
          lastUpdate: new Date(),
          status: PlaylistStatus.ACTIVE,
          isRemovable: true,
          channelCount: 0,
        };

        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));

        await get().refreshPlaylist(newPlaylist.id);
      },

      updatePlaylist: (id, updates) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? { ...playlist, ...updates, lastUpdate: new Date() }
              : playlist
          ),
        })),

      removePlaylist: (id) => {
        const { playlists } = get();
        const playlist = playlists.find((p) => p.id === id);

        if (!playlist || playlist.isRemovable === false) {
          toast.warning(
            `Impossible de supprimer la playlist "${playlist?.name}" car elle est protégée.`
          );
          return;
        }

        set((state) => {
          const newTorrents = new Map(state.torrents);
          newTorrents.delete(id); // Supprime les torrents associés
          return {
            playlists: state.playlists.filter((p) => p.id !== id),
            channels: state.channels.filter((c) => c.playlistSource !== id),
            torrents: newTorrents,
          };
        });

        set((state) => ({
          categories: get().getCategories(),
        }));
      },

      togglePlaylistStatus: (id) =>
        set((state) => {
          const playlists = state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  status:
                    playlist.status === PlaylistStatus.ACTIVE
                      ? PlaylistStatus.INACTIVE
                      : PlaylistStatus.ACTIVE,
                  lastUpdate: new Date(),
                }
              : playlist
          );
          return { playlists };
        }),

      refreshPlaylists: async () => {
        const { playlists } = get();
        set({ loading: true, error: null });
        const newChannels: Channel[] = [];
        const newTorrents = new Map<string, (Movie | Series)[]>();

        for (const playlist of playlists) {
          if (playlist.status !== PlaylistStatus.ACTIVE) {
            get().updatePlaylist(playlist.id, { status: PlaylistStatus.INACTIVE });
            continue;
          }

          try {
            const parseResult = await fetchAndProcessPlaylist(playlist);
            let count = 0;

            if ('channels' in parseResult) {
              // Résultat de parsing M3U ou Xtream
              if (parseResult.channels.length > 0) {
                newChannels.push(...parseResult.channels);
                count = parseResult.channels.length;
              } else {
                throw new Error('Aucune chaîne trouvée dans la playlist.');
              }
            } else {
              // Résultat de parsing Torrent
              const resources = [...(parseResult.movies || []), ...(parseResult.series || [])];
              if (resources.length > 0) {
                newTorrents.set(playlist.id, resources);
                count = resources.length;
              } else {
                throw new Error('Aucun film ou série trouvé dans le torrent.');
              }
            }

            get().updatePlaylist(playlist.id, {
              channelCount: count,
              status: PlaylistStatus.ACTIVE,
            });
          } catch (error) {
            console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error(`Erreur pour la playlist ${playlist.name}: ${errorMessage}`);
            get().updatePlaylist(playlist.id, {
              status: PlaylistStatus.ERROR,
              error: errorMessage,
            });
          }
        }

        set({
          channels: newChannels,
          torrents: newTorrents,
          categories: get().getCategories(),
          loading: false,
        });
      },

      refreshPlaylist: async (id) => {
        const { playlists } = get();
        const playlist = playlists.find((p) => p.id === id);

        if (!playlist || playlist.status !== PlaylistStatus.ACTIVE) {
          if (playlist) toast.warning(`La playlist "${playlist.name}" est inactive.`);
          return;
        }

        set({ loading: true, error: null });

        try {
          const parseResult = await fetchAndProcessPlaylist(playlist);
          let count = 0;

          if ('channels' in parseResult) {
            // Résultat de parsing M3U ou Xtream
            if (parseResult.channels.length > 0) {
              set((state) => ({
                channels: [
                  ...state.channels.filter((c) => c.playlistSource !== playlist.id),
                  ...parseResult.channels,
                ],
                categories: get().getCategories(),
                loading: false,
              }));
              count = parseResult.channels.length;
            } else {
              throw new Error('Aucune chaîne trouvée dans la playlist.');
            }
          } else {
            // Résultat de parsing Torrent
            const resources = [...(parseResult.movies || []), ...(parseResult.series || [])];
            if (resources.length > 0) {
              set((state) => {
                const newTorrents = new Map(state.torrents);
                newTorrents.set(playlist.id, resources);
                return {
                  torrents: newTorrents,
                  loading: false,
                };
              });
              count = resources.length;
            } else {
              throw new Error('Aucun film ou série trouvé dans le torrent.');
            }
          }

          get().updatePlaylist(id, {
            channelCount: count,
            status: PlaylistStatus.ACTIVE,
          });
          toast.success(`La playlist "${playlist.name}" a été mise à jour !`);
        } catch (error) {
          console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          toast.error(`Erreur lors du rafraîchissement de "${playlist.name}": ${errorMessage}`);
          get().updatePlaylist(id, { status: PlaylistStatus.ERROR, error: errorMessage });
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
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return channels;

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
            count: channels.length,
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
          playlists: defaultPlaylists,
          torrents: new Map<string, (Movie | Series)[]>(),
        }),
    }),
    {
      name: 'streamverse-playlist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlists: state.playlists.filter((p) => p.isRemovable),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const savedPlaylists = state.playlists || [];
          const defaultPlaylistsIds = new Set(defaultPlaylists.map((p) => p.id));

          const mergedPlaylists = [
            ...defaultPlaylists,
            ...savedPlaylists.filter((p) => !defaultPlaylistsIds.has(p.id)),
          ];
          state.playlists = mergedPlaylists;

          // Assurer que la map de torrents est initialisée
          state.torrents = state.torrents || new Map<string, (Movie | Series)[]>();

          setTimeout(() => state.refreshPlaylists(), 100);
        }
      },
    }
  )
);
