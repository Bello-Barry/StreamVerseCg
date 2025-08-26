'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const thumbnail =
    movie.poster ||
    (movie.youtubeId
      ? getYoutubeThumbnail(movie.youtubeId)
      : movie.playlistId
        ? "/playlist-placeholder.png" // ✅ placeholder pour playlists
        : "/placeholder.png");

  return (
    <Card
      className="cursor-pointer overflow-hidden rounded-xl transition-transform hover:scale-105 hover:shadow-xl"
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="relative aspect-video">
          <img
            src={thumbnail || "/placeholder.png"}
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