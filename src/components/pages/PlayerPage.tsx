'use client';

import {
  ArrowLeft,
  BadgeInfo,
  Fullscreen,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import Hls from 'hls.js';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useChannelStore } from '@/stores/useChannelStore';
import { useUserPreferencesStore } from '@/stores/useUserPreferencesStore';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const PlayerPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<Hls.Level[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number | 'auto'>('auto');

  const { currentChannel } = useChannelStore();
  const { userPreferences } = useUserPreferencesStore();
  const { onPlaybackError } = useRecommendationStore();
  const router = useRouter();

  const handleClose = () => router.back();

  const initializePlayer = useCallback(async () => {
    if (!currentChannel || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    try {
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
          setQualityLevels(hls.levels);
          if (userPreferences.autoplay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            setError("Erreur de lecture du flux. Veuillez réessayer.");
            setIsLoading(false);
            if (onPlaybackError && currentChannel) {
              onPlaybackError(currentChannel);
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentChannel.url;
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Erreur de lecture:', err);
      setError('Échec de l\'initialisation du lecteur');
      setIsLoading(false);
    }
  }, [currentChannel, userPreferences.autoplay, onPlaybackError]);

  useEffect(() => {
    initializePlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    isPlaying ? video.pause() : video.play();
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleFullscreenToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen().catch(console.error);
    }
  };

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
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSelectQuality = (index: number | 'auto') => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index === 'auto' ? -1 : index;
    setSelectedQuality(index);
    toast.success(`Qualité sélectionnée : ${index === 'auto' ? 'Auto' : `${hlsRef.current.levels[index].height}p`}`);
  };

  if (!currentChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center text-white">
        <BadgeInfo className="w-8 h-8 mb-2" />
        <p>Aucune chaîne sélectionnée.</p>
        <Button onClick={handleClose} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        controls={false}
        autoPlay
        tabIndex={0}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Retour"
            tabIndex={0}
          >
            <ArrowLeft />
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Lecture'}
              autoFocus
              tabIndex={0}
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMuteToggle}
              aria-label="Muet"
              tabIndex={0}
            >
              {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
            </Button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-[120px]"
              tabIndex={0}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreenToggle}
              aria-label="Plein écran"
              tabIndex={0}
            >
              <Fullscreen />
            </Button>
          </div>
        </div>
        {qualityLevels.length > 0 && (
          <div className="flex gap-2 flex-wrap text-sm">
            <Badge
              variant={selectedQuality === 'auto' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleSelectQuality('auto')}
            >
              Auto
            </Badge>
            {qualityLevels.map((q, i) => (
              <Badge
                key={i}
                variant={selectedQuality === i ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleSelectQuality(i)}
              >
                {q.height}p
              </Badge>
            ))}
          </div>
        )}
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <Loader2 className="animate-spin w-8 h-8 text-white" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 text-white space-y-4">
          <Zap className="w-8 h-8" />
          <p>{error}</p>
          <Button onClick={initializePlayer}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlayerPage;