'use client';

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import Hls from 'hls.js';
import { useAppStore } from '@/stores/useAppStore';
import { TorrentInfo, Quality } from '@/types';
import { cn } from '@/lib/utils';
import { PlayerControls } from './PlayerControls'; // Assurez-vous que ce composant existe
import { motion, AnimatePresence } from 'framer-motion';

// Définition des props pour le lecteur de torrent
// J'utilise `Omit` pour exclure les propriétés qui pourraient causer des conflits de typage
// avec les attributs HTML natifs, tout en gardant une interface propre.
interface TorrentPlayerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onPlay' | 'onPause' | 'onVolumeChange'> {
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
      onVolumeChange,
      onTimeUpdate,
      onLoadedMetadata,
      onEnded,
      isLoading = false,
      className,
      ...props
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { userPreferences } = useAppStore();
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [localDuration, setLocalDuration] = useState(0);

    // Effet pour gérer le chargement de la vidéo via HLS.js
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !torrent?.magnetURI) {
        return;
      }

      // HLS.js est requis pour le streaming depuis une source dynamique (torrent)
      if (Hls.isSupported()) {
        const hls = new Hls({
          startPosition: currentTime,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          lowLatencyMode: true,
          capLevelOnPlay: true,
        });

        // NOTE: Ici, l'URL de la source HLS doit être générée par votre service backend.
        // Le backend est responsable de prendre la magnet URI et de la streamer
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
            // Logique de récupération en cas d'erreur fatale
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
        // Ceci est une solution de secours et ne gère pas les torrents.
        videoElement.src = `http://votre-backend.com/stream/${torrent.infoHash}/video`;
        setIsPlayerReady(true);
        videoElement.play().catch(console.error);
      }
    }, [torrent?.magnetURI, torrent?.infoHash, currentTime]);

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

      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('ended', handleEnded);

      // Met à jour le volume initial
      videoElement.volume = userPreferences.volume;

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
      onVolumeChange?.(volume);
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
        className={cn('relative w-full h-full bg-black flex items-center justify-center', className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
          {isPlayerReady && (isHovering || !isPlaying || isLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10"
            >
              <PlayerControls
                torrent={torrent} // J'ai ajouté cette prop pour que le titre s'affiche dans les contrôles
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
                  onSeek?.(time); // Appelle la prop onSeek passée par le parent
                }}
                className="absolute bottom-4 left-4 right-4"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

TorrentPlayer.displayName = 'TorrentPlayer';
