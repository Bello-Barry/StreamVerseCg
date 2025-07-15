'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward,
  Settings,
  X,
  Heart,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { ViewType } from '@/types';
import { toast } from 'sonner';

const PlayerPage: React.FC = () => {
  const { currentChannel, setCurrentChannel, setCurrentView, userPreferences } = useAppStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(userPreferences.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [watchStartTime] = useState(Date.now());

  // Initialiser HLS.js
  useEffect(() => {
    const initializePlayer = async () => {
      if (!currentChannel || !videoRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Importer HLS.js dynamiquement
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          // Nettoyer l'instance précédente
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          hlsRef.current = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hlsRef.current.loadSource(currentChannel.url);
          hlsRef.current.attachMedia(videoRef.current);

          hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (userPreferences.autoplay) {
              videoRef.current?.play();
            }
          });

          hlsRef.current.on(Hls.Events.ERROR, (event: any, data: any) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
              setError('Erreur de lecture du stream');
              setIsLoading(false);
            }
          });

        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Support natif HLS (Safari)
          videoRef.current.src = currentChannel.url;
          setIsLoading(false);
        } else {
          setError('Format de stream non supporté');
          setIsLoading(false);
        }

      } catch (error) {
        console.error('Erreur d\'initialisation du lecteur:', error);
        setError('Erreur d\'initialisation du lecteur');
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel, userPreferences.autoplay]);

  // Gestionnaires d'événements vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Masquer les contrôles automatiquement
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Enregistrer dans l'historique à la fermeture
  useEffect(() => {
    return () => {
      if (currentChannel) {
        const watchDuration = Math.floor((Date.now() - watchStartTime) / 1000);
        if (watchDuration > 5) { // Au moins 5 secondes
          addToHistory(currentChannel, watchDuration);
        }
      }
    };
  }, [currentChannel, addToHistory, watchStartTime]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    if (!videoRef.current) return;
    
    const vol = newVolume[0];
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreenToggle = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    setCurrentChannel(null);
    setCurrentView(ViewType.HOME);
  };

  const handleToggleFavorite = () => {
    if (currentChannel) {
      toggleFavorite(currentChannel.id);
      toast.success(
        isFavorite(currentChannel.id) 
          ? 'Retiré des favoris' 
          : 'Ajouté aux favoris'
      );
    }
  };

  const handleShare = () => {
    if (currentChannel) {
      navigator.clipboard.writeText(`${currentChannel.name} - ${window.location.href}`);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentChannel) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune chaîne sélectionnée</p>
        <Button onClick={() => setCurrentView(ViewType.HOME)} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lecteur vidéo */}
      <div 
        className="relative bg-black rounded-lg overflow-hidden aspect-video"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={currentChannel.tvgLogo}
          onClick={handlePlayPause}
        />
        
        {/* Overlay de chargement */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Chargement du stream...</p>
            </div>
          </div>
        )}
        
        {/* Overlay d'erreur */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <p className="mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        )}
        
        {/* Contrôles vidéo */}
        {showControls && !error && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50">
            {/* Contrôles du haut */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">🔴 LIVE</Badge>
                <h3 className="text-white font-semibold">{currentChannel.name}</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className="text-white hover:bg-white/20"
                >
                  <Heart 
                    className={`h-5 w-5 ${isFavorite(currentChannel.id) ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Contrôles du bas */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-4">
                {/* Bouton play/pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                {/* Contrôle du volume */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMuteToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={handleVolumeChange}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Temps */}
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {duration ? formatTime(duration) : 'LIVE'}
                </div>
                
                <div className="flex-1" />
                
                {/* Bouton plein écran */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreenToggle}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Informations de la chaîne */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentChannel.name}</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {currentChannel.group && (
                  <Badge variant="secondary">{currentChannel.group}</Badge>
                )}
                {currentChannel.language && (
                  <Badge variant="outline">{currentChannel.language}</Badge>
                )}
                {currentChannel.country && (
                  <Badge variant="outline">{currentChannel.country}</Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Source: {currentChannel.playlistSource}</p>
                {currentChannel.tvgId && <p>ID: {currentChannel.tvgId}</p>}
              </div>
            </div>
            
            {currentChannel.tvgLogo && (
              <img
                src={currentChannel.tvgLogo}
                alt={currentChannel.name}
                className="w-16 h-16 object-contain rounded"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerPage;

