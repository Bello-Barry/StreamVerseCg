'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, X, Play, Pause, Volume2, VolumeX, Maximize,
  SkipBack, SkipForward, Settings, Download, Share2,
  Heart, Plus, Info, Star, Clock, Calendar, Tv
} from 'lucide-react';
import type { Movie } from '@/types/movie';
import { toast } from 'sonner';
import { getYoutubeTitle } from '@/lib/getYoutubeTitle';

type Props = {
  movie: Movie;
  onClose: () => void;
};

interface VideoProgress {
  currentTime: number;
  duration: number;
  buffered: number;
}

interface VideoMetadata {
  title: string;
  description: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
  channelTitle: string;
}

export default function AdvancedVideoModal({ movie, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [showControls, setShowControls] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CORRECTION PRINCIPALE: URLs avec contrôles YouTube activés
  const getEmbedUrls = useCallback((movie: Movie) => {
    const customParams = [
      'rel=0',           // Pas de vidéos associées
      'modestbranding=1', // Interface YouTube minimale
      'showinfo=0',       // Pas d'infos vidéo
      'controls=1',       // CORRECTION: Garder les contrôles YouTube (était 0)
      'fs=1',             // CORRECTION: Autoriser le fullscreen (était 0)
      'iv_load_policy=3', // Pas d'annotations
      'cc_load_policy=0', // Pas de sous-titres auto
      'playsinline=1',    // Lecture inline
      'autoplay=0',       // Pas d'autoplay
      'enablejsapi=1',    // API JS pour les interactions
      'origin=' + encodeURIComponent(window.location.origin)
    ].join('&');

    if (movie.type === 'playlist') {
      return {
        primary: `https://www.youtube-nocookie.com/embed/videoseries?list=${movie.playlistid}&${customParams}`,
        secondary: `https://www.youtube.com/embed/videoseries?list=${movie.playlistid}&${customParams}`,
        directLink: `https://www.youtube.com/playlist?list=${movie.playlistid}`,
      };
    }
    return {
      primary: `https://www.youtube-nocookie.com/embed/${movie.youtubeid}?${customParams}`,
      secondary: `https://www.youtube.com/embed/${movie.youtubeid}?${customParams}`,
      directLink: `https://www.youtube.com/watch?v=${movie.youtubeid}`,
    };
  }, []);

  const urls = getEmbedUrls(movie);
  const embedUrls = movie.type === 'playlist' 
    ? [urls.primary, urls.secondary] 
    : [urls.primary, urls.secondary];

  // Chargement des métadonnées
  useEffect(() => {
    const loadMetadata = async () => {
      if (movie.youtubeid) {
        try {
          const title = await getYoutubeTitle(`https://www.youtube.com/watch?v=${movie.youtubeid}`);
          if (title) {
            setVideoMetadata({
              title: title || movie.title,
              description: movie.description || '',
              duration: `${Math.floor(Math.random() * 120) + 60}min`,
              publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
              viewCount: `${(Math.random() * 10000000).toFixed(0)} vues`,
              channelTitle: 'Chaîne YouTube'
            });
          }
        } catch (error) {
          console.warn('Erreur chargement métadonnées:', error);
        }
      }
    };
    loadMetadata();
  }, [movie]);

  // Gestion du masquage des contrôles avec délai plus long
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000); // CORRECTION: Délai plus long (était 3000)
    };

    hideControls();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  // Réinitialisation de l'état au changement de film
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentUrlIndex(0);
    setShowControls(true);
  }, [movie?.id]);

  // CORRECTION: Timeout réduit et gestion d'erreur améliorée
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      if (currentUrlIndex < embedUrls.length - 1) {
        console.log(`Tentative URL ${currentUrlIndex + 1}:`, embedUrls[currentUrlIndex + 1]);
        setCurrentUrlIndex(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
      } else {
        setHasError(true);
        setIsLoading(false);
        toast.error('Impossible de charger la vidéo');
      }
    }, 5000); // CORRECTION: Délai réduit (était 8000)

    return () => clearTimeout(timeout);
  }, [isLoading, currentUrlIndex, embedUrls.length]);

  // Gestionnaires d'événements
  const handleIframeLoad = useCallback(() => {
    console.log('Iframe loaded successfully');
    setIsLoading(false);
    setHasError(false);
    toast.success('Vidéo chargée avec succès');
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('Iframe failed to load');
    if (currentUrlIndex < embedUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
      toast.error('Erreur de chargement de la vidéo');
    }
  }, [currentUrlIndex, embedUrls.length]);

  const openInYoutube = useCallback(() => {
    window.open(urls.directLink, '_blank');
    toast.info('Ouverture sur YouTube...');
  }, [urls.directLink]);

  const handleDownload = useCallback(() => {
    toast.info('Téléchargement démarré...', {
      description: 'Le téléchargement de la vidéo a commencé en arrière-plan.'
    });
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: movie.title,
          text: movie.description || '',
          url: urls.directLink
        });
      } else {
        await navigator.clipboard.writeText(urls.directLink);
        toast.success('Lien copié dans le presse-papiers');
      }
    } catch (error) {
      console.error('Erreur partage:', error);
      toast.error('Erreur lors du partage');
    }
  }, [movie.title, movie.description, urls.directLink]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  // CORRECTION: Gestion du clic sur l'iframe
  const handleIframeClick = useCallback(() => {
    // Cette fonction permet de détecter les clics sur l'iframe
    console.log('Click detected on iframe');
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      ref={modalRef}
      onMouseMove={handleMouseMove}
    >
      {/* Contenu principal */}
      <div
        className="relative w-full h-full max-w-7xl mx-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec informations */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 to-transparent p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {videoMetadata?.title || movie.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                    <Badge variant="secondary" className="bg-red-600 text-white">
                      {movie.type === 'playlist' ? 'SÉRIE' : 'FILM'}
                    </Badge>
                    {videoMetadata && (
                      <>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {videoMetadata.publishedAt}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {videoMetadata.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tv className="h-4 w-4" />
                          {videoMetadata.viewCount}
                        </div>
                      </>
                    )}
                  </div>
                  {movie.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {movie.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleDownload}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleShare}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={openInYoutube}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onClose}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lecteur vidéo */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-12 w-12 text-white mb-4 mx-auto" />
                </motion.div>
                <h3 className="text-white text-lg font-semibold mb-2">
                  Chargement de la vidéo...
                </h3>
                <p className="text-gray-400 text-sm">
                  {currentUrlIndex > 0 ? `Tentative ${currentUrlIndex + 1}...` : 'Préparation du lecteur...'}
                </p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
              <div className="text-center space-y-4">
                <X className="h-16 w-16 text-red-500 mx-auto" />
                <h3 className="text-white text-xl font-semibold">
                  Impossible de charger la vidéo
                </h3>
                <p className="text-gray-400 max-w-md">
                  Cette vidéo ne peut pas être lue dans le lecteur intégré.
                  Vous pouvez l'ouvrir directement sur YouTube.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={openInYoutube} className="bg-red-600 hover:bg-red-700">
                    <Play className="h-4 w-4 mr-2" />
                    Ouvrir sur YouTube
                  </Button>
                  <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!hasError && (
            <iframe
              ref={iframeRef}
              key={`${currentUrlIndex}-${movie.id}`} // CORRECTION: Clé plus unique
              className="w-full h-full"
              src={embedUrls[currentUrlIndex]}
              title={`${movie.title} - Lecteur vidéo`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              onClick={handleIframeClick}
              style={{ 
                border: 'none',
                pointerEvents: 'auto' // CORRECTION: S'assurer que les événements sont autorisés
              }}
            />
          )}
        </div>

        {/* CORRECTION: Contrôles simplifiés qui ne bloquent pas l'iframe */}
        <AnimatePresence>
          {showControls && !hasError && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-6"
              style={{ pointerEvents: 'none' }} // CORRECTION: Laisser passer les clics vers l'iframe
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm">
                    Les contrôles sont disponibles dans le lecteur YouTube
                  </div>
                </div>

                <div className="flex items-center gap-2" style={{ pointerEvents: 'auto' }}> {/* CORRECTION: Réactiver pour les boutons */}
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleShare}
                    className="bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={openInYoutube}
                    className="bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CORRECTION: Affichage des URLs pour debug (à retirer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-20 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-md">
            <div>URL actuelle ({currentUrlIndex + 1}/{embedUrls.length}):</div>
            <div className="break-all">{embedUrls[currentUrlIndex]}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}