'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Movie } from '@/types';
import WebTorrent from 'webtorrent';
import { toast } from 'sonner';

/**
 * Hook personnalisé pour gérer la lecture de contenu en P2P via WebTorrent.
 * @returns {object} Un objet contenant les fonctions de lecture et l'état du lecteur.
 */
export const useTorrentPlayer = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<WebTorrent.WebTorrent | null>(null);
  const setCurrentChannel = useAppStore(state => state.setCurrentChannel);

  /**
   * Initialise le client WebTorrent s'il n'existe pas.
   * @returns {WebTorrent.WebTorrent} Le client WebTorrent.
   */
  const getClient = useCallback((): WebTorrent.WebTorrent => {
    if (!clientRef.current) {
      console.log("Initialisation du client WebTorrent...");
      clientRef.current = new WebTorrent();
      clientRef.current.on('error', (err) => {
        console.error('WebTorrent Client Error:', err);
        setError('Erreur du client WebTorrent. Veuillez réessayer.');
        toast.error('Erreur de lecture du torrent', {
          description: "Le client de streaming a rencontré une erreur.",
        });
      });
    }
    return clientRef.current;
  }, []);

  /**
   * Commence la lecture d'un torrent.
   * @param {Movie} movie Le film à lire.
   */
  const playTorrent = useCallback((movie: Movie) => {
    setIsLoading(true);
    setError(null);
    const client = getClient();
    
    // Si un torrent est déjà en cours, on le détruit pour en lancer un nouveau.
    if (client.torrents.length > 0) {
        client.torrents.forEach(t => t.destroy());
    }

    toast.info('Démarrage du torrent...', {
      description: `Préparation de la lecture de "${movie.name}".`,
    });

    try {
      const torrent = client.add(movie.magnetURI || movie.infoHash, (torrent) => {
        console.log('Torrent ready!', torrent);
        const file = torrent.files.find(file => file.name.endsWith('.mp4') || file.name.endsWith('.mkv') || file.name.endsWith('.avi'));
        
        if (file) {
          file.getBlobURL((err, url) => {
            if (err) {
              console.error('Erreur lors de la création de l\'URL blob:', err);
              setError('Impossible de créer l\'URL de lecture.');
              toast.error('Erreur de lecture', {
                description: "Impossible de créer l'URL pour la vidéo.",
              });
              setIsLoading(false);
              return;
            }
            if (url) {
              const fakeChannel = {
                id: movie.id,
                name: movie.name,
                url: url, // L'URL du blob
                tvgLogo: movie.poster,
                group: 'Torrents',
                playlistSource: movie.playlistSource,
                // ... autres propriétés optionnelles
              };
              
              // Mettre à jour le store pour que le Player puisse jouer ce "canal"
              setCurrentChannel(fakeChannel);
              setIsLoading(false);
              toast.success('Lecture en cours', {
                description: `Démarrage de la lecture de "${movie.name}".`,
              });
            }
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

      torrent.on('error', (err) => {
        console.error('Torrent error:', err);
        setError('Erreur lors du téléchargement du torrent. Le fichier est peut-être indisponible.');
        toast.error('Erreur de torrent', {
          description: "Le torrent ne peut pas être téléchargé. Essayez-en un autre.",
        });
        setIsLoading(false);
        if (torrent) torrent.destroy();
      });

      torrent.on('warning', (warning) => {
        console.warn('Torrent warning:', warning);
      });
      
    } catch (e) {
      console.error('Failed to add torrent:', e);
      setError('Impossible d\'ajouter le torrent.');
      toast.error('Erreur', {
        description: "Impossible de démarrer le torrent.",
      });
      setIsLoading(false);
    }
  }, [getClient, setCurrentChannel]);

  return { playTorrent, isLoading, error };
};
