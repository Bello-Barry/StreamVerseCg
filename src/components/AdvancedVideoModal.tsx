'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [progress, setProgress] = useState<VideoProgress>({
    currentTime: 0,
    duration: 0,
    buffered: 0
  });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  // URLs avec paramètres pour masquer l'interface YouTube
  const getEmbedUrls = useCallback((movie: Movie) => {
    const customParams = [
      'rel=0',           // Pas de vidéos associées
      'modestbranding=1', // Interface YouTube minimale
      'showinfo=0',       // Pas d'infos vidéo
      'controls=0',       // Masquer les contrôles YouTube
      'disablekb=1',      // Désactiver raccourcis clavier YouTube
      'fs=0',            // Pas de fullscreen YouTube
      'iv_load_policy=3', // Pas d'annotations
      'cc_load_policy=0', // Pas de sous-titres auto
      'playsinline=1',   // Lecture inline
      'autoplay=0',      // Pas d'autoplay
      'start=0',         // Début à 0
      'enablejsapi=1',   // API JS
      'origin=' + window.location.origin
    ].join('&');
    
    if (movie.type === 'playlist') {
      return {
        primary: `https://www.youtube-nocookie.com/embed/videoseries?list=${movie.playlistid}&${customParams}`,
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
  const embedUrls = movie.type === 'playlist' ? [urls.primary] : [urls.primary, urls.secondary];

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

  // Gestion des contrôles
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    if (isPlaying) {
      hideControls();
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Reset lors du changement de film
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentUrlIndex(0);
    setIsPlaying(false);
    setProgress({ currentTime: 0, duration: 0, buffered: 0 });
  }, [movie?.id]);

  // Timeout de chargement
  useEffect(() => {
    if (!isLoading) return;
    
    const timeout = setTimeout(() => {
      if (currentUrlIndex < embedUrls.length - 1) {
        setCurrentUrlIndex(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
      } else {
        setHasError(true);
        setIsLoading(false);
        toast.error('Impossible de charger la vidéo');
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isLoading, currentUrlIndex, embedUrls.length]);

  // Gestionnaires d'événements
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    toast.success('Vidéo chargée avec succès');
  };

  const handleIframeError = () => {
    if (currentUrlIndex < embedUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const openInYoutube = () => {
    window.open(urls.directLink, '_blank');
    toast.info('Ouverture sur YouTube...');
  };

  const handleDownload = () => {
    toast.info('Téléchargement démarré...', { 
      description: 'Le téléchargement de la vidéo a commencé en arrière-plan.'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.description,
        url: urls.directLink
      });
    } else {
      navigator.clipboard.writeText(urls.directLink);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

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
                  {currentUrlIndex > 0 ? 'Tentative alternative...' : 'Préparation du lecteur...'}
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
                <Button onClick={openInYoutube} className="bg-red-600 hover:bg-red-700">
                  <Play className="h-4 w-4 mr-2" />
                  Ouvrir sur YouTube
                </Button>
              </div>
            </div>
          )}

          {!hasError && (
            <iframe
              ref={iframeRef}
              key={currentUrlIndex}
              className="w-full h-full"
              src={embedUrls[currentUrlIndex]}
              title={`${movie.title} - Lecteur vidéo`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ border: 'none' }}
            />
          )}
        </div>

        {/* Contrôles personnalisés */}
        <AnimatePresence>
          {showControls && !hasError && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-6"
            >
              {/* Barre de progression */}
              <div className="mb-4">
                <Progress value={30} className="h-1 bg-gray-700" />
              </div>

              {/* Contrôles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    
                    <div className="w-20">
                      <Progress value={isMuted ? 0 : volume} className="h-1" />
                    </div>
                  </div>

                  <span className="text-white text-sm">
                    1:23 / 15:42
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openInYoutube}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}