'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner'; // Utilisation de sonner pour les notifications
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

/**
 * Interface pour le store global de playlists.
 * @interface PlaylistStore
 * @extends PlaylistManagerState
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

const initialState: PlaylistManagerState = {
  playlists: [],
  channels: [],
  categories: [],
  loading: false,
  error: null
};

// Playlists par défaut, non modifiables par l'utilisateur
const defaultPlaylists: Playlist[] = [
  {
    id: 'schumijo-fr',
    name: 'Chaînes Françaises (Schumijo)',
    url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
    type: 'url',
    status: PlaylistStatus.ACTIVE,
    description: 'Playlist française de Schumijo avec chaînes françaises',
    isRemovable: false,
    channelCount: 0,
    lastUpdate: new Date(0)
  },
  {
    id: 'iptv-org-france',
    name: 'IPTV-Org (France)',
    url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
    type: 'url',
    status: PlaylistStatus.ACTIVE,
    description: 'Chaînes françaises de IPTV-Org',
    isRemovable: false,
    channelCount: 0,
    lastUpdate: new Date(0)
  }
];

/**
 * Fonction utilitaire pour fetch et parser une playlist.
 * Refactorisation pour éviter la duplication de code.
 */
const fetchAndParsePlaylist = async (playlist: Playlist): Promise<M3UParseResult> => {
  if (playlist.status !== PlaylistStatus.ACTIVE) {
    throw new Error('La playlist est inactive.');
  }

  if (playlist.type === 'xtream' && playlist.xtreamConfig) {
    const { server, username, password } = playlist.xtreamConfig;
    if (!server || !username || !password) {
      throw new Error('Configuration Xtream invalide.');
    }
    return parseXtreamContent(playlist.xtreamConfig, playlist.id);
  } else if (playlist.type === 'url' && playlist.url) {
    const response = await fetch(playlist.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const content = await response.text();
    return parseM3UContent(content, playlist.id);
  } else if (playlist.type === 'content' && playlist.content) {
    return parseM3UContent(playlist.content, playlist.id);
  } else {
    // TODO: Gérer le type 'torrent' ici, avec une fonction de parsing dédiée.
    if (playlist.type === 'torrent') {
        throw new Error('La fonctionnalité Torrent n\'est pas encore implémentée.');
    }
    throw new Error('Configuration de playlist invalide ou type de playlist inconnu.');
  }
};


export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      ...initialState,

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
        
        if (!playlist || playlist.isRemovable === false) {
          toast.warning(`Impossible de supprimer la playlist "${playlist?.name}" car elle est protégée.`);
          return;
        }

        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          channels: state.channels.filter((c) => c.playlistSource !== id),
        }));

        // Mise à jour des catégories après la suppression
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
                  lastUpdate: new Date()
                }
              : playlist
          );
          return { playlists };
        }),

      refreshPlaylists: async () => {
        const { playlists } = get();
        set({ loading: true, error: null });
        const newChannels: Channel[] = [];
        
        for (const playlist of playlists) {
          if (playlist.status !== PlaylistStatus.ACTIVE) {
              get().updatePlaylist(playlist.id, { status: PlaylistStatus.INACTIVE });
              continue;
          }
          
          try {
            const parseResult = await fetchAndParsePlaylist(playlist);

            if (parseResult.channels.length > 0) {
              newChannels.push(...parseResult.channels);
              get().updatePlaylist(playlist.id, {
                channelCount: parseResult.channels.length,
                status: PlaylistStatus.ACTIVE
              });
            } else {
              throw new Error('Aucune chaîne trouvée dans la playlist.');
            }
          } catch (error) {
            console.error(`Erreur lors du chargement de la playlist ${playlist.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error(`Erreur pour la playlist ${playlist.name}: ${errorMessage}`);
            get().updatePlaylist(playlist.id, {
              status: PlaylistStatus.ERROR,
              error: errorMessage
            });
          }
        }

        set({
          channels: newChannels,
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
          const parseResult = await fetchAndParsePlaylist(playlist);
          
          if (parseResult.channels.length > 0) {
            set((state) => ({
              channels: [
                ...state.channels.filter((c) => c.playlistSource !== playlist.id),
                ...parseResult.channels
              ],
              categories: get().getCategories(),
              loading: false
            }));

            get().updatePlaylist(id, {
              channelCount: parseResult.channels.length,
              status: PlaylistStatus.ACTIVE
            });
            toast.success(`La playlist "${playlist.name}" a été mise à jour !`);
          } else {
            throw new Error('Aucune chaîne trouvée dans la playlist');
          }
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
        playlists: state.playlists.filter(p => p.isRemovable)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Si le store est réhydraté mais ne contient aucune playlist (c'est-à-dire
          // c'est la première fois ou l'utilisateur a tout supprimé), on ajoute les playlists par défaut.
          if (!state.playlists || state.playlists.length === 0) {
              state.playlists = defaultPlaylists;
          } else {
              // Ajout des playlists par défaut si elles ne sont pas déjà présentes.
              const existingDefaultIds = new Set(state.playlists.map(p => p.id));
              const mergedPlaylists = [
                  ...state.playlists,
                  ...defaultPlaylists.filter(dp => !existingDefaultIds.has(dp.id))
              ];
              state.playlists = mergedPlaylists;
          }
          // On lance le rafraîchissement des playlists pour charger les chaînes
          // directement après la réhydratation.
          state.refreshPlaylists();
        }
      }
    }
  )
);
