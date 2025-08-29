'use client';

import { useEffect } from 'react';
import { useMovieStore } from '@/stores/useMovieStore';
import { useAuth } from '@/hooks/useAuth';
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';
import MovieCard from '@/components/MovieCard';
import VideoModal from '@/components/movies/VideoModal';

export default function MoviesPage() {
  const { user } = useAuth();
  const {
    movies,
    fetchMovies,
    selectedMovie,
    setSelectedMovie,
  } = useMovieStore();

  // Charger les films au montage
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-4 text-lg font-medium">
          Connecte-toi pour voir les films 🎬
        </p>
        <Button asChild>
          <a href="/login">Se connecter</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">🎥 Films et Séries</h1>

      {movies.length === 0 ? (
        <p className="text-gray-400">Aucun film disponible pour l’instant.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((movie: Movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {/* Modal vidéo */}
      {selectedMovie && (
        <VideoModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
}