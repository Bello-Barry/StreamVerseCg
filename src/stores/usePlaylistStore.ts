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
  PlaylistType,
  Movie,
  Series
} from '@/types';
import { parseM3UContent } from '@/lib/m3uParser';
import { parseXtreamContent } from '@/lib/xtreamParser';
import { parseTorrentContentImproved } from '@/lib/torrentService';

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
  // Nouvelles méthodes pour les torrents
  getTorrentsByPlaylist: (playlistId: string) => (Movie | Series)[];
  getAllTorrents: () => (Movie | Series)[];
}

const initialState: PlaylistManagerState = {
  playlists: [],
  channels: [],
  categories: [],
  torrents: new Map(),
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
    channelCount: 0,
    lastUpdate: new Date(),
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
    lastUpdate: new Date(),
  }
];

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      playlists: defaultPlaylists,
      
      addPlaylist: async (playlistData) => {
        const newPlaylist: Playlist = {
          ...playlistData,
          id: `playlist-${Date.now()}`,
          lastUpdate: new Date(),
          status: PlaylistStatus.ACTIVE,
          isRemovable: true,
          channelCount: 0
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
          
          // Récupérer tous les channels existants pour éviter de perdre ceux des autres playlists
          const { channels: existingChannels } = get();
          
          // Supprimer les channels des playlists actives pour les recharger
          const activePlaylistIds = activePlaylists.map(p => p.id);
          const channelsFromInactivePlaylists = existingChannels.filter(
            channel => !activePlaylistIds.includes(channel.playlistSource)
          );
          
          const allChannels: Channel[] = [...channelsFromInactivePlaylists];

          for (const playlist of activePlaylists) {
            try {
              if (playlist.type === PlaylistType.TORRENT) {
                // Traitement spécial pour les torrents - on utilise refreshPlaylist
                await get().refreshPlaylist(playlist.id);
              } else {
                // Traitement normal pour les autres types (M3U, XTREAM)
                let parseResult: M3UParseResult;

                if (
                  playlist.type === PlaylistType.XTREAM &&
                  playlist.xtreamConfig?.server &&
                  playlist.xtreamConfig?.username &&
                  playlist.xtreamConfig?.password
                ) {
                  parseResult = await parseXtreamContent(
                    playlist.xtreamConfig,
                    playlist.id
                  );
                } else if (playlist.type === PlaylistType.URL && playlist.url) {
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
                  // Ajouter les nouvelles chaînes au tableau
                  allChannels.push(...parseResult.channels);

                  get().updatePlaylist(playlist.id, {
                    channelCount: parseResult.channels.length,
                    status: PlaylistStatus.ACTIVE
                  });
                } else {
                  console.warn(`Aucune chaîne trouvée dans la playlist ${playlist.name}`);
                }
              }
            } catch (error) {
              console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
              get().updatePlaylist(playlist.id, {
                status: PlaylistStatus.ERROR
              });
            }
          }

          // Mettre à jour les channels et categories
          set((state) => ({
            channels: allChannels,
            categories: get().getCategories(),
            loading: false
          }));

        } catch (error) {
          console.error('Erreur globale lors du rafraîchissement des playlists:', error);
          set({
            error: error instanceof Error ? error.message : 'Erreur inconnue',
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
          if (playlist.type === PlaylistType.TORRENT) {
            // Traitement spécial pour les torrents
            const source = playlist.url || playlist.content;
            let torrentSource: string | File;

            if (playlist.url && playlist.url.startsWith('magnet:')) {
              torrentSource = playlist.url;
            } else if (playlist.content) {
              // Si le contenu est un fichier, on le traite comme tel
              torrentSource = new File([playlist.content], playlist.url || 'torrent_file.torrent', { 
                type: 'application/x-bittorrent' 
              });
            } else {
              throw new Error('Aucune source torrent valide configurée (magnet URI ou fichier)');
            }

            const torrentResult = await parseTorrentContentImproved(torrentSource, playlist.id);
            
            if (torrentResult.errors.length > 0) {
              console.error('Erreurs lors du parsing du torrent:', torrentResult.errors);
              throw new Error(torrentResult.errors[0]);
            }

            // Stocker les torrents dans la Map
            const allTorrents = [...torrentResult.movies, ...torrentResult.series];
            set((state) => {
              const newTorrents = new Map(state.torrents);
              newTorrents.set(playlist.id, allTorrents);
              return { torrents: newTorrents };
            });

            get().updatePlaylist(id, {
              channelCount: allTorrents.length,
              status: PlaylistStatus.ACTIVE
            });

          } else {
            // Traitement normal pour les autres types (M3U, XTREAM)
            let parseResult: M3UParseResult;

            if (
              playlist.type === PlaylistType.XTREAM &&
              playlist.xtreamConfig?.server &&
              playlist.xtreamConfig?.username &&
              playlist.xtreamConfig?.password
            ) {
              parseResult = await parseXtreamContent(
                playlist.xtreamConfig,
                playlist.id
              );
            } else if (playlist.type === PlaylistType.URL && playlist.url) {
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
              // Remplacer les channels de cette playlist spécifique
              set((state) => ({
                channels: [
                  ...state.channels.filter(
                    (c) => c.playlistSource !== playlist.id
                  ),
                  ...parseResult.channels
                ],
                categories: get().getCategories()
              }));

              get().updatePlaylist(id, {
                channelCount: parseResult.channels.length,
                status: PlaylistStatus.ACTIVE
              });
            } else {
              throw new Error('Aucune chaîne trouvée dans la playlist');
            }
          }

          set({ loading: false });
        } catch (error) {
          console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
          get().updatePlaylist(id, { status: PlaylistStatus.ERROR });
          set({ 
            loading: false,
            error: error instanceof Error ? error.message : 'Erreur de chargement'
          });
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

      // Nouvelles méthodes pour les torrents
      getTorrentsByPlaylist: (playlistId) => {
        const { torrents } = get();
        return torrents.get(playlistId) || [];
      },

      getAllTorrents: () => {
        const { torrents } = get();
        const allTorrents: (Movie | Series)[] = [];
        torrents.forEach(playlistTorrents => {
          allTorrents.push(...playlistTorrents);
        });
        return allTorrents;
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
        playlists: state.playlists,
        torrents: Array.from(state.torrents.entries()) // Sérialiser la Map
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restaurer la Map depuis le stockage
          if (Array.isArray((state as any).torrents)) {
            state.torrents = new Map((state as any).torrents);
          }
          
          if (state.playlists.length === 0) {
            state.playlists = defaultPlaylists;
          }
          
          // Rafraîchir les playlists après la réhydratation
          setTimeout(() => state.refreshPlaylists(), 100);
        }
      }
    }
  )
);