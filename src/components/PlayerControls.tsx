'use client';

import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  CircleArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TorrentInfo } from '@/types';

interface PlayerControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  torrent?: TorrentInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleFullscreen?: () => void;
  onDownload?: () => void;
  progress?: number;
  downloadSpeed?: number;
}

/**
 * Composant d'interface utilisateur pour les contrôles du lecteur vidéo.
 * Il est indépendant de la logique de streaming et se contente d'afficher
 * l'état du lecteur et de déclencher des événements.
 */
export const PlayerControls: React.FC<PlayerControlsProps> = ({
  torrent,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onDownload,
  progress,
  downloadSpeed,
  className,
  ...props
}) => {
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    onSeek?.(newTime);
  };

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 to-transparent text-white transition-opacity',
        className
      )}
      {...props}
    >
      {/* Haut - Titre & Boutons d'action */}
      <div className="flex justify-between items-center w-full">
        <h2 className="text-xl font-bold line-clamp-1">{torrent?.name || 'Contenu Inconnu'}</h2>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button onClick={onDownload} aria-label="Télécharger le torrent">
              <CircleArrowDown className="w-6 h-6 hover:text-blue-400 transition-colors" />
            </button>
          )}
          <button aria-label="Paramètres du lecteur">
            <Settings className="w-6 h-6 hover:text-blue-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Centre - Barre de progression du téléchargement */}
      {progress !== undefined && progress >= 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 text-center text-sm font-semibold">
          <div className="text-sm font-semibold mb-1">
            Téléchargement: {Math.round(progress * 100)}%
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          {downloadSpeed !== undefined && downloadSpeed >= 0 && (
            <div className="text-xs text-gray-300 mt-1">
              Vitesse: {(downloadSpeed / 1024 / 1024).toFixed(2)} MB/s
            </div>
          )}
        </div>
      )}

      {/* Bas - Barre de progression et contrôles */}
      <div className="flex flex-col gap-2 w-full">
        {/* Barre de progression */}
        <div
          className="w-full h-2 bg-white/30 rounded-full cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
          {/* Poignée (handle) de la barre de progression */}
          <div
            className="absolute -top-1.5 -translate-x-1/2 w-5 h-5 bg-white rounded-full transition-opacity opacity-0 group-hover:opacity-100"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Boutons Play/Pause */}
            {isPlaying ? (
              <button onClick={onPause} aria-label="Mettre en pause">
                <Pause className="w-8 h-8 hover:text-blue-400 transition-colors" />
              </button>
            ) : (
              <button onClick={onPlay} aria-label="Lire la vidéo">
                <Play className="w-8 h-8 hover:text-blue-400 transition-colors" />
              </button>
            )}

            {/* Contrôle du volume */}
            <div className="flex items-center gap-2">
              <button onClick={() => onVolumeChange?.(volume === 0 ? 0.8 : 0)} aria-label="Couper le son">
                {volume > 0 ? (
                  <Volume2 className="w-6 h-6 hover:text-blue-400 transition-colors" />
                ) : (
                  <VolumeX className="w-6 h-6 hover:text-blue-400 transition-colors" />
                )}
              </button>
              {/* Barre de volume */}
              <div className="w-20 h-2 bg-white/30 rounded-full cursor-pointer relative group">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${volume * 100}%` }}
                ></div>
                {/* La poignée du volume peut être ajoutée ici si vous avez un composant Slider */}
              </div>
            </div>

            {/* Temps */}
            <span className="text-sm font-mono select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Plein écran */}
          <button onClick={onToggleFullscreen} aria-label="Passer en plein écran">
            <Maximize className="w-6 h-6 hover:text-blue-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
