'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { useAppStore } from '@/stores/useAppStore';
import { Play, Pause, Loader2 } from 'lucide-react';

/**
 * Composant de lecteur vidéo pour StreamVerse.
 * Il gère la lecture des flux HLS et des URLs blob de WebTorrent.
 */
export const Player = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Récupérer les informations de l'état global avec Zustand
  const { currentChannel, isPlaying, setIsPlaying } = useAppStore();

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(e => console.error("Erreur de lecture :", e));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentChannel?.url) {
      setIsReady(false);
      return;
    }

    // Nettoyer l'ancienne instance de Hls si elle existe
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Gérer les formats HLS (m3u8) ou d'autres formats (blob:, mp4, etc.)
    if (Hls.isSupported() && currentChannel.url.endsWith('.m3u8')) {
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(currentChannel.url);
      hlsRef.current.attachMedia(video);
      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS Manifest Parsed. Démarrage de la lecture...");
        setIsReady(true);
        video.play().catch(e => console.error("Erreur de lecture HLS:", e));
        setIsPlaying(true);
      });
      hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setIsReady(false);
          setIsPlaying(false);
        }
      });
    } else {
      // Pour les URLs non HLS, comme les URLs blob de WebTorrent
      video.src = currentChannel.url;
      video.load();
      video.oncanplay = () => {
        console.log("Vidéo prête pour la lecture...");
        setIsReady(true);
        video.play().catch(e => console.error("Erreur de lecture de blob:", e));
        setIsPlaying(true);
      };
      video.onerror = () => {
        console.error("Erreur de lecture de la vidéo.");
        setIsReady(false);
        setIsPlaying(false);
      };
    }

    // Gestion des événements de l'élément vidéo
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel, setIsPlaying]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {!currentChannel?.url && (
        <p className="text-white text-lg">Sélectionnez un torrent pour commencer le streaming.</p>
      )}
      {currentChannel?.url && !isReady && (
        <div className="flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin h-10 w-10 text-gray-400" />
          <p className="mt-2">Chargement de la vidéo...</p>
        </div>
      )}
      {currentChannel?.url && (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
        />
      )}
    </div>
  );
};
