'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';
import { Play, List } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

/**
 * Composant de carte pour afficher une vignette de film ou de playlist.
 * Utilise l'optimisation d'image de Next.js pour de meilleures performances.
 */
export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Détermine la source de la vignette en cascade, en garantissant un fallback non-null.
  const thumbnailSrc = 
    movie.poster || 
    (movie.youtubeid ? getYoutubeThumbnail(movie.youtubeid) : null) || 
    (movie.playlistid ? "/playlist-placeholder.png" : null) || 
    "/placeholder.png";

  // Gestion du clic sur la carte
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  // Gestion de la touche Entrée pour l'accessibilité
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Lire ou voir les détails de ${movie.title}`}
    >
      <CardContent className="p-2">
        <div className="relative aspect-video">
          <Image
            src={thumbnailSrc}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            priority={false}
            className="rounded-xl object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Overlay avec icône de lecture */}
          <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              {movie.type === 'playlist' ? (
                <List className="h-6 w-6 text-black" />
              ) : (
                <Play className="h-6 w-6 text-black ml-1" />
              )}
            </div>
          </div>

          {/* Badge du type de contenu */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {movie.type === 'playlist' ? 'Playlist' : 'Vidéo'}
          </div>
        </div>
        
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium truncate text-foreground/90 group-hover:text-foreground">
            {movie.title}
          </p>
          {movie.category && (
            <p className="text-xs text-muted-foreground truncate">
              {movie.category}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};