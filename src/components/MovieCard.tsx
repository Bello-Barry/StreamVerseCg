'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

/**
 * Composant de carte pour afficher une vignette de film ou de playlist.
 * Utilise l'optimisation d'image de Next.js pour de meilleures performances.
 */
export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Détermine la source de la vignette en cascade.
  // 1. Priorité à l'affiche (poster) si elle existe.
  // 2. Sinon, utilise la vignette YouTube si un ID est présent.
  // 3. Sinon, utilise un placeholder de playlist si un ID de playlist est présent.
  // 4. Enfin, utilise le placeholder par défaut.
  const thumbnailSrc = movie.poster || (
    movie.youtubeid ? getYoutubeThumbnail(movie.youtubeid) : (
      movie.playlistid ? "/playlist-placeholder.png" : "/placeholder.png"
    )
  );

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-xl transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      onClick={onClick}
      tabIndex={0} // Rend la carte navigable au clavier
      role="button"
      aria-label={`Lire ou voir les détails de ${movie.title}`}
    >
      <CardContent className="p-2">
        {/*
          Utilisation de next/image pour l'optimisation :
          - `fill` pour que l'image remplisse son conteneur parent.
          - `sizes` pour optimiser le téléchargement de l'image sur différentes tailles d'écran.
          - `alt` pour l'accessibilité.
        */}
        <div className="relative aspect-video">
          <Image
            src={thumbnailSrc}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            priority={false}
            className="rounded-xl object-cover transition-transform group-hover:scale-110"
          />
        </div>
        <p className="mt-2 text-sm font-medium truncate text-foreground/90 group-hover:text-foreground">{movie.title}</p>
      </CardContent>
    </Card>
  );
};
