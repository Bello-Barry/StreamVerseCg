'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

/**
 * Composant pour afficher une carte de film ou de série.
 * Encapsule la logique d'affichage et gère le clic pour la lecture.
 */
export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const thumbnail = movie.poster || getYoutubeThumbnail(movie.youtubeId, movie.playlistId) || "/placeholder.png";

  return (
    <Card
      className="cursor-pointer overflow-hidden rounded-xl transition-transform hover:scale-105 hover:shadow-xl"
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="relative aspect-video">
          <img
            src={thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover rounded-xl"
            loading="lazy"
          />
        </div>
        <p className="mt-2 text-sm font-medium truncate">{movie.title}</p>
      </CardContent>
    </Card>
  );
};
