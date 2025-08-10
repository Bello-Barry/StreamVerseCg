'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Movie, Episode } from '@/types';
import { toast } from 'sonner';

interface TorrentFile {
  name: string;
  length: number;
  getBlobURL(callback: (err: Error | null, url?: string) => void): void;
}

interface TorrentInstance {
  files: TorrentFile[];
  name: string;
  infoHash: string;
  magnetURI: string;
  destroy(): void;
  on(event: string, callback: (data?: any) => void): void;
}

interface WebTorrentClient {
  torrents: TorrentInstance[];
  add(torrentId: string, opts?: any, callback?: (torrent: TorrentInstance) => void): TorrentInstance;
  on(event: string, callback: (error?: any) => void): void;
  destroy(): void;
}

/**
 * Hook pour gérer la lecture de torrents avec WebTorrent
 */
export const useTorrentPlayer = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  
  const clientRef = useRef<WebTorrentClient | null>(null);
  const currentTorrentRef = useRef<TorrentInstance | null>(null);
  const setCurrentChannel = useAppStore(state => state.setCurrentChannel);

  /**
   * Initialise le client WebTorrent
   */
  const getClient = useCallback(async (): Promise<WebTorrentClient> => {
    if (clientRef.current) {
      return clientRef.current;
    }

    if (typeof window === 'undefined') {
      throw new Error('WebTorrent ne peut être utilisé que côté client');
    }

    try {
      const WebTorrent = (await import('webtorrent')).default;
      const client = new WebTorrent({
        // Configuration optimisée pour le streaming
        maxConns: 100,
        dht: true,
        webSeeds: true
      }) as unknown as WebTorrentClient;
      
      client.on('error', (err) => {
        console.error('WebTorrent Client Error:', err);
        setError('Erreur du client WebTorrent');
        setIsLoading(false);
      });
      
      clientRef.current = client;
      return client;
    } catch (importError) {
      console.error('Erreur lors de l\'import de WebTorrent:', importError);
      throw new Error('Impossible de charger WebTorrent');
    }
  }, []);

  /**
   * Lance la lecture d'un film depuis un torrent
   */
  const playTorrent = useCallback(async (movie: Movie) => {
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);
    
    try {
      const client = await getClient();
      
      // Nettoyer le torrent précédent si il existe
      if (currentTorrentRef.current) {
        currentTorrentRef.current.destroy();
        currentTorrentRef.current = null;
      }

      // Vérifier si le torrent est déjà ajouté au client
      const existingTorrent = client.torrents.find(t => 
        t.infoHash === movie.infoHash || t.magnetURI === movie.magnetURI
      );

      if (existingTorrent) {
        console.log('Torrent déjà chargé, utilisation directe');
        handleTorrentReady(existingTorrent, movie);
        return;
      }

      toast.info('Connexion au torrent...', {
        description: `Préparation de "${movie.name}"`,
      });

      // Ajouter le nouveau torrent
      const torrent = client.add(movie.magnetURI || movie.infoHash, {
        path: '/tmp/webtorrent/' // Chemin temporaire
      });

      currentTorrentRef.current = torrent;

      // Gestion des événements du torrent
      torrent.on('ready', () => {
        console.log('Torrent ready:', torrent.name);
        handleTorrentReady(torrent, movie);
      });

      torrent.on('download', () => {
        setDownloadProgress(Math.round((torrent as any).progress * 100));
      });

      torrent.on('error', (err) => {
        console.error('Torrent Error:', err);
        setError(`Erreur du torrent: ${err.message}`);
        setIsLoading(false);
        toast.error('Erreur de torrent', {
          description: err.message,
        });
      });

      // Timeout de sécurité
      setTimeout(() => {
        if (isLoading) {
          setError('Timeout lors du chargement du torrent');
          setIsLoading(false);
          torrent.destroy();
        }
      }, 60000); // 1 minute

    } catch (e) {
      console.error('Erreur lors de la lecture du torrent:', e);
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(errorMessage);
      setIsLoading(false);
      toast.error('Erreur de lecture', {
        description: errorMessage,
      });
    }
  }, [getClient]);

  /**
   * Traite un torrent prêt et trouve le fichier vidéo principal
   */
  const handleTorrentReady = useCallback((torrent: TorrentInstance, movie: Movie) => {
    console.log('Fichiers disponibles:', torrent.files.map(f => f.name));
    
    // Trouver le plus gros fichier vidéo (généralement le film principal)
    const videoFiles = torrent.files.filter(file => {
      const name = file.name.toLowerCase();
      return name.endsWith('.mp4') || 
             name.endsWith('.mkv') || 
             name.endsWith('.avi') || 
             name.endsWith('.webm') || 
             name.endsWith('.mov') ||
             name.endsWith('.m4v');
    });

    if (videoFiles.length === 0) {
      setError('Aucun fichier vidéo trouvé dans ce torrent');
      setIsLoading(false);
      return;
    }

    // Trier par taille pour prendre le plus gros fichier
    const mainVideoFile = videoFiles.sort((a, b) => b.length - a.length)[0];
    
    console.log('Fichier vidéo sélectionné:', mainVideoFile.name);
    
    // Créer l'URL blob pour la lecture
    mainVideoFile.getBlobURL((err: Error | null, url?: string) => {
      if (err || !url) {
        console.error('Erreur lors de la création de l\'URL blob:', err);
        setError('Impossible de créer l\'URL de lecture');
        setIsLoading(false);
        return;
      }
      
      // Créer un faux channel pour le lecteur
      const fakeChannel = {
        id: movie.id,
        name: movie.name,
        url: url,
        tvgLogo: movie.poster,
        group: 'Films Torrent',
        playlistSource: movie.playlistSource,
        country: '',
        language: ''
      };
      
      setCurrentChannel(fakeChannel);
      setIsLoading(false);
      setDownloadProgress(100);
      
      toast.success('Lecture prête!', {
        description: `"${movie.name}" est prêt à être lu.`,
      });
    });
  }, [setCurrentChannel]);

  /**
   * Lance la lecture d'un épisode de série
   */
  const playEpisode = useCallback(async (episode: Episode, seriesName: string) => {
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);
    
    try {
      const client = await getClient();
      
      // Nettoyer le torrent précédent si il existe
      if (currentTorrentRef.current) {
        currentTorrentRef.current.destroy();
        currentTorrentRef.current = null;
      }

      toast.info('Chargement de l\'épisode...', {
        description: `${seriesName} - ${episode.name}`,
      });

      const torrent = client.add(episode.magnetURI || episode.infoHash);
      currentTorrentRef.current = torrent;

      torrent.on('ready', () => {
        if (episode.torrentFile) {
          // Si on a déjà une référence au fichier spécifique
          episode.torrentFile.getBlobURL((err: Error | null, url?: string) => {
            if (err || !url) {
              setError('Impossible de créer l\'URL de lecture pour l\'épisode');
              setIsLoading(false);
              return;
            }
            
            const fakeChannel = {
              id: episode.id,
              name: `${seriesName} - ${episode.name}`,
              url: url,
              tvgLogo: '', // Pas de poster pour les épisodes
              group: 'Séries Torrent',
              playlistSource: episode.infoHash,
              country: '',
              language: ''
            };
            
            setCurrentChannel(fakeChannel);
            setIsLoading(false);
          });
        } else {
          // Chercher le fichier vidéo dans le torrent
          const videoFile = torrent.files.find(f => {
            const name = f.name.toLowerCase();
            return name.includes(`s${episode.season.toString().padStart(2, '0')}e${episode.episode.toString().padStart(2, '0')}`) ||
                   name.includes(`${episode.season}x${episode.episode.toString().padStart(2, '0')}`);
          });

          if (!videoFile) {
            setError('Fichier d\'épisode non trouvé');
            setIsLoading(false);
            return;
          }

          videoFile.getBlobURL((err: Error | null, url?: string) => {
            if (err || !url) {
              setError('Impossible de créer l\'URL de lecture pour l\'épisode');
              setIsLoading(false);
              return;
            }
            
            const fakeChannel = {
              id: episode.id,
              name: `${seriesName} - ${episode.name}`,
              url: url,
              tvgLogo: '',
              group: 'Séries Torrent',
              playlistSource: episode.infoHash,
              country: '',
              language: ''
            };
            
            setCurrentChannel(fakeChannel);
            setIsLoading(false);
          });
        }
      });

      torrent.on('error', (err) => {
        setError(`Erreur lors du chargement de l'épisode: ${err.message}`);
        setIsLoading(false);
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [getClient, setCurrentChannel]);

  /**
   * Nettoie les ressources WebTorrent
   */
  const cleanup = useCallback(() => {
    if (currentTorrentRef.current) {
      currentTorrentRef.current.destroy();
      currentTorrentRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.destroy();
      clientRef.current = null;
    }
    setIsLoading(false);
    setError(null);
    setDownloadProgress(0);
  }, []);

  /**
   * Arrête le torrent actuel
   */
  const stopTorrent = useCallback(() => {
    if (currentTorrentRef.current) {
      currentTorrentRef.current.destroy();
      currentTorrentRef.current = null;
    }
    setIsLoading(false);
    setDownloadProgress(0);
    toast.info('Lecture arrêtée');
  }, []);

  return { 
    playTorrent, 
    playEpisode, 
    stopTorrent, 
    cleanup, 
    isLoading, 
    error, 
    downloadProgress 
  };
};