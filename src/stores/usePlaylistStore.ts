'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Movie } from '@/types';
import { toast } from 'sonner';

// Interfaces minimales pour contourner les problèmes de typage de la librairie.
interface TorrentFile {
  name: string;
  getBlobURL(callback: (err: Error | null, url?: string) => void): void;
}

interface TorrentInstance {
  files: TorrentFile[];
  destroy(): void;
}

interface WebTorrentClient {
  torrents: TorrentInstance[];
  add(torrentId: string, callback?: (torrent: TorrentInstance) => void): void;
  on(event: string, callback: (error?: any) => void): void;
  destroy(): void;
}

/**
 * Hook personnalisé pour gérer la lecture de contenu en P2P via WebTorrent.
 * @returns {object} Un objet contenant les fonctions de lecture et l'état du lecteur.
 */
export const useTorrentPlayer = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<WebTorrentClient | null>(null);
  const setCurrentChannel = useAppStore(state => state.setCurrentChannel);

  /**
   * Initialise le client WebTorrent s'il n'existe pas.
   * Utilise un import dynamique pour éviter les problèmes de rendu côté serveur.
   * @returns {Promise<WebTorrentClient>} Le client WebTorrent.
   */
  const getClient = useCallback(async (): Promise<WebTorrentClient> => {
    if (clientRef.current) {
      return clientRef.current;
    }

    // Le dynamic import gère déjà le cas où window n'est pas défini,
    // mais cette vérification explicite est une bonne pratique de sécurité.
    if (typeof window === 'undefined') {
      throw new Error('WebTorrent ne peut être utilisé que côté client');
    }

    console.log("Initialisation du client WebTorrent...");
    
    try {
      // Import dynamique pour s'assurer que le code ne s'exécute que côté client.
      const { default: WebTorrent } = await import('webtorrent');
      
      // Utiliser l'assertion de type 'unknown' pour forcer TypeScript à accepter la conversion.
      const client = new WebTorrent() as unknown as WebTorrentClient;
      
      client.on('error', (err) => {
        console.error('WebTorrent Client Error:', err);
        setError('Erreur du client WebTorrent. Veuillez réessayer.');
        toast.error('Erreur de lecture du torrent', {
          description: "Le client de streaming a rencontré une erreur.",
        });
      });
      
      clientRef.current = client;
      return client;
    } catch (importError) {
      console.error('Erreur lors de l\'import de WebTorrent:', importError);
      throw new Error('Impossible de charger WebTorrent');
    }
  }, []);

  /**
   * Commence la lecture d'un torrent.
   * @param {Movie} movie Le film à lire.
   */
  const playTorrent = useCallback(async (movie: Movie) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const client = await getClient();
      
      // Si un torrent est déjà en cours, on le détruit pour en lancer un nouveau.
      if (client.torrents.length > 0) {
        client.torrents.forEach(t => t.destroy());
      }
  
      toast.info('Démarrage du torrent...', {
        description: `Préparation de la lecture de "${movie.name}".`,
      });
  
      client.add(movie.magnetURI || movie.infoHash, (torrent: TorrentInstance) => {
        console.log('Torrent ready!', torrent);
        
        const file = torrent.files.find(f => 
          f.name.endsWith('.mp4') || 
          f.name.endsWith('.mkv') || 
          f.name.endsWith('.avi') ||
          f.name.endsWith('.webm') ||
          f.name.endsWith('.mov')
        );
        
        if (file) {
          file.getBlobURL((err: Error | null, url?: string) => {
            // Vérification cruciale : on s'assure que l'URL est valide
            if (err || !url) {
              console.error('Erreur lors de la création de l\'URL blob:', err);
              setError('Impossible de créer l\'URL de lecture.');
              toast.error('Erreur de lecture', {
                description: "Impossible de créer l'URL pour la vidéo.",
              });
              setIsLoading(false);
              return;
            }
            
            const fakeChannel = {
              id: movie.id,
              name: movie.name,
              url: url,
              tvgLogo: movie.poster,
              group: 'Torrents',
              playlistSource: movie.playlistSource,
            };
            
            setCurrentChannel(fakeChannel);
            setIsLoading(false);
            toast.success('Lecture en cours', {
              description: `Démarrage de la lecture de "${movie.name}".`,
            });
          });
        } else {
          setError('Aucun fichier vidéo trouvé dans ce torrent.');
          toast.error('Aucun fichier vidéo', {
            description: "Le torrent ne contient pas de fichier vidéo lisible.",
          });
          setIsLoading(false);
          torrent.destroy();
        }
      });
    } catch (e) {
      console.error('Failed to get client or add torrent:', e);
      setError('Impossible d\'ajouter le torrent.');
      toast.error('Erreur', {
        description: "Impossible de démarrer le torrent.",
      });
      setIsLoading(false);
    }
  }, [getClient, setCurrentChannel]);

  /**
   * Fonction de nettoyage pour détruire le client WebTorrent et libérer les ressources.
   * C'est essentiel pour éviter les fuites de mémoire.
   */
  const cleanup = useCallback(() => {
    if (clientRef.current) {
      console.log("Nettoyage du client WebTorrent...");
      clientRef.current.destroy();
      clientRef.current = null;
    }
  }, []);

  // Le useEffect s'exécute quand le composant est monté et retourne une fonction
  // qui sera appelée au démontage pour faire le nettoyage.
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { playTorrent, isLoading, error, cleanup };
};
