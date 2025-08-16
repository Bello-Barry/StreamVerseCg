'use client';

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import Hls from 'hls.js';
import { useAppStore } from '@/stores/useAppStore';
import { TorrentInfo } from '@/types';
import { cn } from '@/lib/utils';
import { PlayerControls } from '@/components/PlayerControls';
import { motion, AnimatePresence } from 'framer-motion';

// Définition des props pour le lecteur de torrent
interface TorrentPlayerProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onPlay' | 'onPause' | 'onVolumeChange' | 'onLoadedMetadata' | 'onTimeUpdate' | 'onEnded'
  > {
  torrent?: TorrentInfo | null;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onEnded?: () => void;
  isLoading?: boolean;
  progress?: number;
  downloadSpeed?: number;
}

// Garde de type améliorée pour vérifier si un objet a les propriétés nécessaires pour le streaming
function isValidTorrentForStreaming(
  torrent: TorrentInfo | null | undefined
): torrent is TorrentInfo & { magnetURI: string; infoHash: string } {
  return (
    torrent !== null &&
    typeof torrent === 'object' &&
    'magnetURI' in torrent &&
    typeof torrent.magnetURI === 'string' &&
    'infoHash' in torrent &&
    typeof torrent.infoHash === 'string'
  );
}

/**
 * Lecteur de contenu en streaming via torrent.
 * Ce composant gère l'affichage de la vidéo, les contrôles, et l'intégration avec HLS.js.
 * Il est conçu pour être contrôlé par l'état global de l'application (Zustand).
 */
export const TorrentPlayer = forwardRef<HTMLDivElement, TorrentPlayerProps>(
  (
    {
      torrent,
      isPlaying,
      currentTime = 0,
      duration = 0,
      onPlay,
      onPause,
      onSeek,
      onVolumeChange,
      onTimeUpdate,
      onLoadedMetadata,
      onEnded,
      isLoading = false,
      progress,
      downloadSpeed,
      className,
      ...props
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { userPreferences, setVolume: setAppVolume } = useAppStore();
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [localDuration, setLocalDuration] = useState(0);

    // Effet pour gérer le chargement de la vidéo via HLS.js
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !isValidTorrentForStreaming(torrent)) {
        // Nettoyer si le torrent est retiré ou si les propriétés requises sont absentes
        setIsPlayerReady(false);
        return;
      }

      // HLS.js est requis pour le streaming depuis une source dynamique (torrent)
      if (Hls.isSupported()) {
        const hls = new Hls({
          startPosition: currentTime,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          lowLatencyMode: true,
          // La propriété 'capLevelOnPlay' a été dépréciée ou retirée
          // des versions récentes de hls.js. Elle est gérée automatiquement
          // par les algorithmes d'ABR plus récents.
        });

        // NOTE: L'URL de la source HLS doit être générée par votre service backend.
        // C'est le backend qui est responsable de prendre la magnet URI et de la streamer
        // sous forme de HLS (m3u8). La ligne ci-dessous est un exemple.
        const url = `http://votre-backend.com/stream/${torrent.infoHash}/playlist.m3u8`;

        hls.loadSource(url);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsPlayerReady(true);
          videoElement.play().catch(console.error);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS.js error:', data.details);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Erreur réseau fatale, tentative de récupération...');
                hls.recoverMediaError();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Erreur média fatale, tentative de récupération...');
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          if (hls) {
            hls.destroy();
          }
        };
      } else {
        // Fallback pour les navigateurs non compatibles (non-HLS)
        videoElement.src = `http://votre-backend.com/stream/${torrent.infoHash}/video`;
        setIsPlayerReady(true);
        videoElement.play().catch(console.error);
      }
    }, [torrent, currentTime]);

    // Effet pour synchroniser l'état de lecture avec les props
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      if (isPlaying) {
        videoElement.play().catch(console.error);
      } else {
        videoElement.pause();
      }
    }, [isPlaying]);

    // Effet pour gérer les événements de la vidéo (mise à jour du temps, fin)
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const handleTimeUpdate = () => {
        onTimeUpdate?.(videoElement.currentTime);
      };

      const handleLoadedMetadata = () => {
        setLocalDuration(videoElement.duration);
        onLoadedMetadata?.(videoElement.duration);
      };

      const handleEnded = () => {
        onEnded?.();
      };

      // Met à jour le volume initial
      videoElement.volume = userPreferences.volume;

      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }, [onTimeUpdate, onLoadedMetadata, onEnded, userPreferences.volume]);

    // Gère le changement de volume via les contrôles
    const handleVolumeChange = (volume: number) => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
      }
      setAppVolume(volume);
      onVolumeChange?.(volume);
    };

    const handleToggleFullscreen = () => {
      const element = ref?.current;
      if (!document.fullscreenElement) {
        element?.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const handleMouseMove = () => {
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full h-full bg-black flex items-center justify-center group',
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
            />
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls={false}
          autoPlay={userPreferences.autoplay}
        />
        <AnimatePresence>
          {(isPlayerReady && (isHovering || !isPlaying)) || isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10"
            >
              <PlayerControls
                torrent={torrent}
                isPlaying={isPlaying || false}
                currentTime={currentTime}
                duration={duration || localDuration}
                volume={userPreferences.volume}
                onPlay={onPlay}
                onPause={onPause}
                onVolumeChange={handleVolumeChange}
                onSeek={(time) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = time;
                  }
                  onSeek?.(time);
                }}
                onToggleFullscreen={handleToggleFullscreen}
                progress={progress}
                downloadSpeed={downloadSpeed}
                className="absolute inset-0"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

TorrentPlayer.displayName = 'TorrentPlayer';
