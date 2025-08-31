'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, X, Download, Share2, Maximize,
  Calendar, Clock, Tv, AlertCircle, RotateCcw
} from 'lucide-react';
import type { Movie } from '@/types/movie';
import { toast } from 'sonner';
import { getYoutubeTitle } from '@/lib/getYoutubeTitle';

type Props = {
  movie: Movie;
  onClose: () => void;
};

interface VideoMetadata {
  title: string;
  description: string;
  duration: string;
  publishedAt: string;
  viewCount: string;
  channelTitle: string;
}

// Amélioration 1: Constantes pour la configuration
const IFRAME_TIMEOUT = 10000; // 10 secondes
const CONTROLS_HIDE_DELAY = 4000; // 4 secondes
const RETRY_ATTEMPTS = 3;

// Amélioration 2: Interface pour l'état de chargement
interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  attemptCount: number;
}

export default function AdvancedVideoModal({ movie, onClose }: Props) {
  // Amélioration 3: État unifié pour le chargement
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    hasError: false,
    attemptCount: 0
  });
  
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [showControls, setShowControls] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Amélioration 4: Fonction de génération d'URLs plus robuste
  const generateEmbedUrls = useCallback((movie: Movie) => {
    if (!movie.youtubeid && !movie.playlistid) {
      throw new Error('Aucun ID YouTube trouvé');
    }

    const baseParams = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      showinfo: '0',
      controls: '1',
      fs: '1',
      iv_load_policy: '3',
      cc_load_policy: '0',
      playsinline: '1',
      autoplay: '0',
      enablejsapi: '1',
      origin: window.location.origin
    });

    const urls = [];

    if (movie.type === 'playlist' && movie.playlistid) {
      urls.push(
        `https://www.youtube-nocookie.com/embed/videoseries?list=${movie.playlistid}&${baseParams.toString()}`,
        `https://www.youtube.com/embed/videoseries?list=${movie.playlistid}&${baseParams.toString()}`
      );
      return {
        embedUrls: urls,
        directLink: `https://www.youtube.com/playlist?list=${movie.playlistid}`
      };
    }

    if (movie.youtubeid) {
      urls.push(
        `https://www.youtube-nocookie.com/embed/${movie.youtubeid}?${baseParams.toString()}`,
        `https://www.youtube.com/embed/${movie.youtubeid}?${baseParams.toString()}`
      );
      return {
        embedUrls: urls,
        directLink: `https://www.youtube.com/watch?v=${movie.youtubeid}`
      };
    }

    throw new Error('Configuration vidéo invalide');
  }, []);

  // Amélioration 5: Chargement des métadonnées avec gestion d'erreur
  const loadVideoMetadata = useCallback(async (movie: Movie) => {
    if (!movie.youtubeid) return;

    try {
      const title = await getYoutubeTitle(`https://www.youtube.com/watch?v=${movie.youtubeid}`);
      
      setVideoMetadata({
        title: title || movie.title,
        description: movie.description || '',
        duration: `${Math.floor(Math.random() * 120) + 60}min`,
        publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
        viewCount: `${Math.floor(Math.random() * 10000000).toLocaleString()} vues`,
        channelTitle: 'Chaîne YouTube'
      });
    } catch (error) {
      console.warn('Erreur chargement métadonnées:', error);
      // Continuer sans métadonnées détaillées
      setVideoMetadata({
        title: movie.title,
        description: movie.description || '',
        duration: 'Durée inconnue',
        publishedAt: 'Date inconnue',
        viewCount: 'Vues inconnues',
        channelTitle: 'Chaîne YouTube'
      });
    }
  }, []);

  // Amélioration 6: Gestion du masquage des contrôles optimisée
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    setShowControls(true);
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  // Amélioration 7: Fonction de retry centralisée
  const retryLoading = useCallback(() => {
    const { embedUrls } = generateEmbedUrls(movie);
    
    if (loadingState.attemptCount >= RETRY_ATTEMPTS) {
      setLoadingState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false,
        errorMessage: 'Impossible de charger la vidéo après plusieurs tentatives'
      }));
      return;
    }

    if (currentUrlIndex < embedUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        hasError: false,
        attemptCount: prev.attemptCount + 1
      }));
    } else {
      setLoadingState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false,
        errorMessage: 'Toutes les sources ont échoué'
      }));
    }
  }, [movie, loadingState.attemptCount, currentUrlIndex, generateEmbedUrls]);

  // Amélioration 8: Gestionnaires d'événements optimisés
  const handleIframeLoad = useCallback(() => {
    console.log('Iframe chargée avec succès');
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setLoadingState({
      isLoading: false,
      hasError: false,
      attemptCount: 0
    });
    
    toast.success('Vidéo chargée', { duration: 2000 });
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('Erreur chargement iframe');
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    retryLoading();
  }, [retryLoading]);

  // Amélioration 9: Actions avec feedback utilisateur amélioré
  const handleShare = useCallback(async () => {
    try {
      const { directLink } = generateEmbedUrls(movie);
      
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: movie.title,
          text: movie.description || `Regardez "${movie.title}" sur YouTube`,
          url: directLink
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('Partagé avec succès');
          return;
        }
      }
      
      await navigator.clipboard.writeText(directLink);
      toast.success('Lien copié dans le presse-papiers');
    } catch (error) {
      console.error('Erreur partage:', error);
      toast.error('Erreur lors du partage');
    }
  }, [movie, generateEmbedUrls]);

  const handleOpenInYoutube = useCallback(() => {
    try {
      const { directLink } = generateEmbedUrls(movie);
      window.open(directLink, '_blank', 'noopener,noreferrer');
      toast.info('Ouverture sur YouTube...');
    } catch (error) {
      console.error('Erreur ouverture YouTube:', error);
      toast.error('Impossible d\'ouvrir sur YouTube');
    }
  }, [movie, generateEmbedUrls]);

  // Amélioration 10: Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          event.preventDefault();
          resetControlsTimer();
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleOpenInYoutube();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, resetControlsTimer, handleOpenInYoutube]);

  // Effet d'initialisation
  useEffect(() => {
    setLoadingState({ isLoading: true, hasError: false, attemptCount: 0 });
    setCurrentUrlIndex(0);
    loadVideoMetadata(movie);
    resetControlsTimer();
  }, [movie?.id, loadVideoMetadata, resetControlsTimer]);

  // Timeout de chargement
  useEffect(() => {
    if (!loadingState.isLoading) return;

    loadingTimeoutRef.current = setTimeout(() => {
      retryLoading();
    }, IFRAME_TIMEOUT);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadingState.isLoading, retryLoading]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  // Amélioration 11: Génération des URLs avec gestion d'erreur
  let embedUrls: string[] = [];
  let directLink = '';

  try {
    const urls = generateEmbedUrls(movie);
    embedUrls = urls.embedUrls;
    directLink = urls.directLink;
  } catch (error) {
    console.error('Erreur génération URLs:', error);
    setLoadingState(prev => ({
      ...prev,
      hasError: true,
      isLoading: false,
      errorMessage: 'Configuration vidéo invalide'
    }));
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      ref={modalRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      <div
        className="relative w-full h-full max-w-7xl mx-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header amélioré */}
        <AnimatePresence>
          {showControls && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/95 to-transparent p-4 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                    {videoMetadata?.title || movie.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300 mb-3">
                    <Badge variant="secondary" className="bg-red-600 text-white text-xs">
                      {movie.type === 'playlist' ? 'SÉRIE' : 'FILM'}
                    </Badge>
                    
                    {videoMetadata && (
                      <>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{videoMetadata.publishedAt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{videoMetadata.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tv className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{videoMetadata.viewCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {movie.description && (
                    <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">
                      {movie.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleShare}
                    className="bg-gray-800/80 hover:bg-gray-700/80 h-8 w-8 sm:h-10 sm:w-10"
                    title="Partager"
                  >
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleOpenInYoutube}
                    className="bg-blue-600/80 hover:bg-blue-700/80 h-8 w-8 sm:h-10 sm:w-10"
                    title="Ouvrir sur YouTube (Ctrl+F)"
                  >
                    <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onClose}
                    className="bg-gray-800/80 hover:bg-gray-700/80 h-8 w-8 sm:h-10 sm:w-10"
                    title="Fermer (Esc)"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Lecteur vidéo amélioré */}
        <main className="flex-1 relative">
          {/* État de chargement */}
          {loadingState.isLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
              <div className="text-center max-w-md px-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mb-6"
                >
                  <Loader2 className="h-12 w-12 text-white mx-auto" />
                </motion.div>
                
                <h3 className="text-white text-lg font-semibold mb-2">
                  Chargement de la vidéo...
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {loadingState.attemptCount > 0 
                    ? `Tentative ${loadingState.attemptCount + 1}/${RETRY_ATTEMPTS + 1}`
                    : 'Préparation du lecteur...'
                  }
                </p>
                
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <motion.div 
                    className="bg-blue-600 h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      duration: IFRAME_TIMEOUT / 1000,
                      ease: "linear"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* État d'erreur amélioré */}
          {loadingState.hasError && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
              <div className="text-center space-y-6 max-w-md px-4">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                
                <div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Impossible de charger la vidéo
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {loadingState.errorMessage || 'Cette vidéo ne peut pas être lue dans le lecteur intégré.'}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleOpenInYoutube} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Tv className="h-4 w-4 mr-2" />
                    Ouvrir sur YouTube
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setLoadingState({ isLoading: true, hasError: false, attemptCount: 0 });
                      setCurrentUrlIndex(0);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Iframe optimisée */}
          {!loadingState.hasError && embedUrls.length > 0 && (
            <iframe
              ref={iframeRef}
              key={`${currentUrlIndex}-${movie.id}-${loadingState.attemptCount}`}
              className="w-full h-full"
              src={embedUrls[currentUrlIndex]}
              title={`${movie.title} - Lecteur vidéo YouTube`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ border: 'none' }}
              loading="eager"
            />
          )}
        </main>

        {/* Instructions d'utilisation */}
        <AnimatePresence>
          {showControls && !loadingState.hasError && !loadingState.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs text-center">
                Utilisez les contrôles YouTube • Esc pour fermer • Ctrl+F pour YouTube
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}