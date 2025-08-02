'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Heart,
  Share2,
  Signal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { ViewType, Channel } from '@/types';
import { toast } from 'sonner';

interface HlsErrorData {
  type: string;
  details: string;
  fatal: boolean;
}
type PlayerPageProps = {
  onPlaybackError?: (channel: Channel) => void;
};

const PlayerPage: React.FC<PlayerPageProps> = ({ onPlaybackError }) => {
  const {
    currentChannel,
    setCurrentChannel,
    setCurrentView,
    userPreferences,
  } = useAppStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchStartTimeRef = useRef<number>(Date.now());

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(userPreferences.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number | null>(null);

  const initializePlayer = useCallback(async () => {
    if (!currentChannel || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const Hls = (await import('hls.js')).default;

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.attachMedia(video);
        hls.loadSource(currentChannel.url);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          const qualities = hls.levels.map((level, i) => {
            return `${level.height}p`;
          });
          setAvailableQualities(qualities);
          setCurrentQualityIndex(hls.currentLevel);

          if (userPreferences.autoplay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (_event: string, data: HlsErrorData) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            setError('Erreur de lecture du flux. Veuillez réessayer.');
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erreur d'initialisation du lecteur:", err);
      setError("Erreur d'initialisation du lecteur.");
      setIsLoading(false);
    }
  }, [currentChannel, userPreferences.autoplay]);

  useEffect(() => {
    initializePlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const hideControls = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && showControls) {
      hideControls();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, hideControls]);

  useEffect(() => {
    const startTime = Date.now();
    watchStartTimeRef.current = startTime;

    return () => {
      if (currentChannel) {
        const watchDuration = Math.floor((Date.now() - startTime) / 1000);
        if (watchDuration > 5) {
          addToHistory(currentChannel, watchDuration);
        }
      }
    };
  }, [currentChannel, addToHistory]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    isPlaying ? video.pause() : video.play().catch(console.error);
  }, [isPlaying]);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = newVolume[0];
    video.volume = vol;
    setVolume(vol);
    video.muted = vol === 0;
  }, []);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handleClose = useCallback(() => {
    setCurrentChannel(null);
    setCurrentView(ViewType.HOME);
  }, [setCurrentChannel, setCurrentView]);

  const handleToggleFavorite = useCallback(() => {
    if (!currentChannel) return;
    const currentlyFavorite = isFavorite(currentChannel.id);
    toggleFavorite(currentChannel.id);
    toast.success(currentlyFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  }, [currentChannel, isFavorite, toggleFavorite]);

  const handleShare = useCallback(() => {
    if (!currentChannel) return;
    navigator.clipboard.writeText(`${currentChannel.name} - ${window.location.href}`);
    toast.success('Lien copié dans le presse-papiers');
  }, [currentChannel]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControls();
  }, [hideControls]);

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQualityIndex(index);
      toast.success(`Qualité changée : ${availableQualities[index]}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'm':
          handleMuteToggle();
          break;
        case 'f':
          handleFullscreenToggle();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleMuteToggle, handleFullscreenToggle, handleClose]);

  if (!currentChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <p className="text-muted-foreground">Aucune chaîne sélectionnée.</p>
        <Button onClick={() => setCurrentView(ViewType.HOME)} className="mt-4">
          Retour à l&apos;accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={playerContainerRef}
        className="relative bg-black rounded-lg overflow-hidden aspect-video group"
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseMove}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={currentChannel.tvgLogo}
          onClick={handlePlayPause}
          playsInline
        />

        {(isLoading || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Chargement du flux...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4">{error}</p>
                <Button onClick={initializePlayer}>Réessayer</Button>
              </div>
            )}
          </div>
        )}

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
            showControls && !error ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">🔴 LIVE</Badge>
              <h3 className="text-white font-semibold">{currentChannel.name}</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="text-white hover:bg-white/20"
                aria-label="Favoris"
                tabIndex={0}
              >
                <Heart className={`h-5 w-5 ${isFavorite(currentChannel.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-white hover:bg-white/20" aria-label="Partager" tabIndex={0}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20" aria-label="Fermer" tabIndex={0}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/20" aria-label="Lire/Pause" tabIndex={0} autoFocus>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleMuteToggle} className="text-white hover:bg-white/20" aria-label="Son" tabIndex={0}>
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider value={[isMuted ? 0 : volume]} onValueChange={handleVolumeChange} max={1} step={0.1} className="w-24" />

            {availableQualities.length > 0 && (
              <div className="flex items-center space-x-2 ml-auto">
                <Signal className="text-white h-4 w-4" />
                <select
                  className="bg-black text-white text-sm rounded px-2 py-1 border border-white/30"
                  onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                  value={currentQualityIndex ?? -1}
                >
                  {availableQualities.map((q, i) => (
                    <option key={i} value={i}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button variant="ghost" size="icon" onClick={handleFullscreenToggle} className="text-white hover:bg-white/20" aria-label="Fullscreen" tabIndex={0}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentChannel.name}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentChannel.group && <Badge variant="secondary">{currentChannel.group}</Badge>}
                {currentChannel.language && <Badge variant="outline">{currentChannel.language}</Badge>}
                {currentChannel.country && <Badge variant="outline">{currentChannel.country}</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Source: {currentChannel.playlistSource}</p>
                {currentChannel.tvgId && <p>ID: {currentChannel.tvgId}</p>}
              </div>
            </div>
            {currentChannel.tvgLogo && (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={currentChannel.tvgLogo}
                  alt={`Logo de ${currentChannel.name}`}
                  fill
                  className="object-contain rounded"
                  sizes="64px"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerPage;