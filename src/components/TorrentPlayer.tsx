import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TorrentPlayerProps {
  torrent: TorrentInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const TorrentPlayer: React.FC<TorrentPlayerProps> = ({
  torrent,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden aspect-video group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Lecteur vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={() => isPlaying ? onPause() : onPlay()}
      />

      {/* Placeholder quand pas de contenu */}
      {!torrent && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
              <Play className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-slate-400 text-lg">Sélectionnez un contenu à lire</p>
          </div>
        </div>
      )}

      {/* Overlay de contrôles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
          >
            {/* Informations du contenu */}
            {torrent && (
              <div className="absolute top-4 left-4 right-4">
                <h3 className="text-white text-xl font-semibold mb-2">
                  {torrent.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-slate-300">
                  <span>Peers: {torrent.numPeers}</span>
                  <span>↓ {torrent.downloadSpeed} MB/s</span>
                  <span>↑ {torrent.uploadSpeed} MB/s</span>
                  <span>{Math.round(torrent.progress * 100)}% téléchargé</span>
                </div>
              </div>
            )}

            {/* Contrôles principaux */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Barre de progression */}
              <div className="mb-4">
                <div className="relative">
                  <div className="w-full h-1 bg-slate-600 rounded-full">
                    <div
                      className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Boutons de contrôle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={isPlaying ? onPause : onPlay}
                    className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                    >
                      {volume > 0 ? (
                        <Volume2 className="w-5 h-5 text-white" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
