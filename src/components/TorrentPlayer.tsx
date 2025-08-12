import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TorrentInfo {
  name: string;
  magnetURI?: string;
  files?: string[];
}

interface TorrentPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  torrent?: TorrentInfo | null;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export const TorrentPlayer: React.FC<TorrentPlayerProps> = ({
  torrent = null,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  volume = 1,
  onPlay = () => {},
  onPause = () => {},
  onSeek = () => {},
  onVolumeChange = () => {},
  className,
  ...rest
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => setShowControls(false), 3000);
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
      className={`relative bg-black rounded-lg overflow-hidden aspect-video group ${className ?? ''}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      {...rest}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={torrent?.magnetURI || ''}
        onTimeUpdate={(e) => onSeek((e.target as HTMLVideoElement).currentTime)}
        onPlay={onPlay}
        onPause={onPause}
      />

      {/* Contrôles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 to-transparent"
          >
            {/* Haut */}
            <div className="text-white font-semibold">{torrent?.name || 'Aucune vidéo'}</div>

            {/* Bas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white cursor-pointer" onClick={onPause} />
                ) : (
                  <Play className="w-6 h-6 text-white cursor-pointer" onClick={onPlay} />
                )}
                {volume > 0 ? (
                  <Volume2
                    className="w-6 h-6 text-white cursor-pointer"
                    onClick={() => onVolumeChange(0)}
                  />
                ) : (
                  <VolumeX
                    className="w-6 h-6 text-white cursor-pointer"
                    onClick={() => onVolumeChange(1)}
                  />
                )}
                <span className="text-white text-sm">{formatTime(currentTime)}</span>
                <span className="text-white text-sm">/ {formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-white cursor-pointer" />
                <Maximize
                  className="w-6 h-6 text-white cursor-pointer"
                  onClick={toggleFullscreen}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};