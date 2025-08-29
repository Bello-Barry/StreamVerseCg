'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';

type VideoModalProps = {
  movie: Movie;
  onClose: () => void;
};

export default function VideoModal({ movie, onClose }: VideoModalProps) {
  const getEmbedUrl = () => {
    if (movie.youtubeid) {
      return `https://www.youtube.com/embed/${movie.youtubeid}?autoplay=1`;
    }
    if (movie.playlistid) {
      return `https://www.youtube.com/embed/videoseries?list=${movie.playlistid}&autoplay=1`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative bg-black rounded-2xl w-full max-w-5xl aspect-video overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>

        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    </motion.div>
  );
}