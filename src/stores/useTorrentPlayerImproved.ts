'use client';

import { create } from 'zustand';
import { Movie, Series, Episode } from '@/types';

interface TorrentPlayerState {
  // État du lecteur
  isLoading: boolean;
  error: string | null;
  downloadProgress: number;
  uploadProgress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  
  // Contenu en cours de lecture
  currentMovie: Movie | null;
  currentEpisode: Episode | null;
  currentSeriesName: string | null;
  
  // Client WebTorrent
  torrentClient: any | null;
  currentTorrent: any | null;
  
  // URL de streaming
  streamingUrl: string | null;
  
  // Métadonnées
  totalSize: number;
  downloaded: number;
  
  // Actions
  playTorrent: (movie: Movie) => Promise<void>;
  playEpisode: (episode: Episode, seriesName: string) => Promise<void>;
  stopPlayback: () => void;
  pauseDownload: () => void;
  resumeDownload: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateProgress: (progress: number) => void;
  updateStats: (stats: any) => void;
}

export const useTorrentPlayerImproved = create<TorrentPlayerState>((set, get) => ({
  // État initial
  isLoading: false,
  error: null,
  downloadProgress: 0,
  uploadProgress: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  numPeers: 0,
  currentMovie: null,
  currentEpisode: null,
  currentSeriesName: null,
  torrentClient: null,
  currentTorrent: null,
  streamingUrl: null,
  totalSize: 0,
  downloaded: 0,

  playTorrent: async (movie: Movie) => {
    const state = get();
    
    try {
      set({ 
        isLoading: true, 
        error: null, 
        currentMovie: movie,
        currentEpisode: null,
        currentSeriesName: null,
        downloadProgress: 0
      });

      // Initialiser WebTorrent si nécessaire
      if (!state.torrentClient) {
        if (typeof window === 'undefined') {
          throw new Error('WebTorrent ne peut être utilisé que côté client');
        }

        const WebTorrent = (await import('webtorrent')).default;
        const client = new WebTorrent({
          maxConns: 100,
          dht: true,
          webSeeds: true
        });
        
        set({ torrentClient: client });
      }

      const client = get().torrentClient;
      
      // Arrêter le torrent précédent s'il existe
      if (state.currentTorrent) {
        state.currentTorrent.destroy();
      }

      // Ajouter le nouveau torrent
      const torrentId = movie.magnetURI || movie.infoHash;
      if (!torrentId) {
        throw new Error('Aucun identifiant de torrent disponible');
      }

      const torrent = client.add(torrentId, {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.webtorrent.dev'
        ]
      });

      set({ currentTorrent: torrent });

      // Gérer les événements du torrent
      torrent.on('ready', () => {
        console.log('Torrent prêt:', torrent.name);
        
        // Trouver le fichier vidéo principal
        const videoFile = torrent.files.find((file: any) => {
          const name = file.name.toLowerCase();
          return name.endsWith('.mp4') || name.endsWith('.mkv') || 
                 name.endsWith('.avi') || name.endsWith('.webm');
        });

        if (videoFile) {
          // Générer l'URL de streaming
          videoFile.getBlobURL((err: Error | null, url?: string) => {
            if (err) {
              set({ error: `Erreur lors de la génération de l'URL: ${err.message}`, isLoading: false });
              return;
            }
            
            set({ 
              streamingUrl: url || null,
              isLoading: false,
              totalSize: torrent.length
            });
          });
        } else {
          set({ error: 'Aucun fichier vidéo trouvé dans ce torrent', isLoading: false });
        }
      });

      torrent.on('download', () => {
        const progress = Math.round((torrent.downloaded / torrent.length) * 100);
        set({
          downloadProgress: progress,
          downloaded: torrent.downloaded,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          numPeers: torrent.numPeers
        });
      });

      torrent.on('error', (err: Error) => {
        console.error('Erreur torrent:', err);
        set({ 
          error: `Erreur lors du chargement du torrent: ${err.message}`,
          isLoading: false 
        });
      });

    } catch (error) {
      console.error('Erreur playTorrent:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        isLoading: false 
      });
    }
  },

  playEpisode: async (episode: Episode, seriesName: string) => {
    const state = get();
    
    try {
      set({ 
        isLoading: true, 
        error: null, 
        currentEpisode: episode,
        currentSeriesName: seriesName,
        currentMovie: null,
        downloadProgress: 0
      });

      // Initialiser WebTorrent si nécessaire
      if (!state.torrentClient) {
        if (typeof window === 'undefined') {
          throw new Error('WebTorrent ne peut être utilisé que côté client');
        }

        const WebTorrent = (await import('webtorrent')).default;
        const client = new WebTorrent({
          maxConns: 100,
          dht: true,
          webSeeds: true
        });
        
        set({ torrentClient: client });
      }

      const client = get().torrentClient;
      
      // Arrêter le torrent précédent s'il existe
      if (state.currentTorrent) {
        state.currentTorrent.destroy();
      }

      // Ajouter le nouveau torrent
      const torrentId = episode.magnetURI || episode.infoHash;
      if (!torrentId) {
        throw new Error('Aucun identifiant de torrent disponible pour cet épisode');
      }

      const torrent = client.add(torrentId, {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.webtorrent.dev'
        ]
      });

      set({ currentTorrent: torrent });

      // Gérer les événements du torrent
      torrent.on('ready', () => {
        console.log('Torrent épisode prêt:', torrent.name);
        
        // Trouver le fichier de l'épisode spécifique
        let targetFile = null;
        
        if (episode.torrentFile) {
          // Utiliser le fichier spécifique de l'épisode
          targetFile = torrent.files.find((file: any) => 
            file.name === episode.torrentFile.name
          );
        }
        
        if (!targetFile) {
          // Fallback: trouver un fichier vidéo
          targetFile = torrent.files.find((file: any) => {
            const name = file.name.toLowerCase();
            return name.endsWith('.mp4') || name.endsWith('.mkv') || 
                   name.endsWith('.avi') || name.endsWith('.webm');
          });
        }

        if (targetFile) {
          // Générer l'URL de streaming
          targetFile.getBlobURL((err: Error | null, url?: string) => {
            if (err) {
              set({ error: `Erreur lors de la génération de l'URL: ${err.message}`, isLoading: false });
              return;
            }
            
            set({ 
              streamingUrl: url || null,
              isLoading: false,
              totalSize: torrent.length
            });
          });
        } else {
          set({ error: 'Fichier de l\'épisode non trouvé dans le torrent', isLoading: false });
        }
      });

      torrent.on('download', () => {
        const progress = Math.round((torrent.downloaded / torrent.length) * 100);
        set({
          downloadProgress: progress,
          downloaded: torrent.downloaded,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          numPeers: torrent.numPeers
        });
      });

      torrent.on('error', (err: Error) => {
        console.error('Erreur torrent épisode:', err);
        set({ 
          error: `Erreur lors du chargement de l'épisode: ${err.message}`,
          isLoading: false 
        });
      });

    } catch (error) {
      console.error('Erreur playEpisode:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        isLoading: false 
      });
    }
  },

  stopPlayback: () => {
    const state = get();
    
    if (state.currentTorrent) {
      state.currentTorrent.destroy();
    }
    
    if (state.streamingUrl) {
      URL.revokeObjectURL(state.streamingUrl);
    }
    
    set({
      currentTorrent: null,
      streamingUrl: null,
      currentMovie: null,
      currentEpisode: null,
      currentSeriesName: null,
      isLoading: false,
      downloadProgress: 0,
      error: null
    });
  },

  pauseDownload: () => {
    const state = get();
    if (state.currentTorrent) {
      state.currentTorrent.pause();
    }
  },

  resumeDownload: () => {
    const state = get();
    if (state.currentTorrent) {
      state.currentTorrent.resume();
    }
  },

  setError: (error: string | null) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  updateProgress: (progress: number) => set({ downloadProgress: progress }),
  
  updateStats: (stats: any) => set({
    downloadSpeed: stats.downloadSpeed || 0,
    uploadSpeed: stats.uploadSpeed || 0,
    numPeers: stats.numPeers || 0
  })
}));