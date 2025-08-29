'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';
import { useMovieStore } from '@/stores/useMovieStore';

type MovieCardProps = {
  movie: Movie;
};

export default function MovieCard({ movie }: MovieCardProps) {
  const { setSelectedMovie } = useMovieStore();

  const handlePlay = () => {
    setSelectedMovie(movie); // ouvre le VideoModal
  };

  return (
    <Card className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition">
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={
            movie.poster
              ? movie.poster
              : getYoutubeThumbnail(movie.youtubeid || '')
          }
          alt={movie.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />

        {/* Bouton Play au centre */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
          <Button
            size="icon"
            className="rounded-full bg-white/90 hover:bg-white text-black"
            onClick={handlePlay}
          >
            <Play className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="text-base font-semibold line-clamp-1">{movie.title}</h3>
        {movie.year && (
          <p className="text-xs text-gray-400">{movie.year}</p>
        )}
      </CardContent>
    </Card>
  );
}