'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMovieStore } from '@/stores/useMovieStore';
import { useAuth } from '@/hooks/useAuth'; 
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { uploadPoster } from '@/lib/uploadPoster';
import { getYoutubeTitle } from '@/lib/getYoutubeTitle';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';
import { toast } from 'sonner';
import { MovieCard } from '@/components/MovieCard';
import { X } from 'lucide-react';

// Types pour les catégories de films (plus robuste)
type MovieCategory = 'Action' | 'Comédie' | 'Drame' | 'Horreur' | 'Animation' | 'Série' | 'Documentaire' | 'Autre';

export default function MoviesPage() {
  const { movies, loading, currentMovie, setCurrentMovie, fetchMovies, addMovie } = useMovieStore();
  const { user } = useAuth(); 

  const [newUrl, setNewUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState<MovieCategory | 'All'>('All');

  const categories: (MovieCategory | 'All')[] = useMemo(() => {
    const existingCategories = Array.from(new Set(movies.map(m => m.category))).filter(Boolean) as MovieCategory[];
    return ['All', 'Action', 'Comédie', 'Drame', 'Horreur', 'Animation', 'Série', 'Documentaire', 'Autre', ...existingCategories];
  }, [movies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleAdd = useCallback(async () => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Vous devez être connecté pour ajouter un film."
      });
      return;
    }

    if (!newUrl || isAdding) return;

    setIsAdding(true);
    toast.info('Ajout en cours...', { id: 'add-movie-toast' });

    try {
      const videoMatch = newUrl.match(/(?:v=|youtu.be\/)([^&]+)/);
      const playlistMatch = newUrl.match(/(?:list=)([^&]+)/);
      const isVideo = !!videoMatch;
      const isPlaylist = !!playlistMatch;

      if (!isVideo && !isPlaylist) {
        toast.error('Lien YouTube invalide', { id: 'add-movie-toast' });
        return;
      }

      const title = (await getYoutubeTitle(newUrl)) || (isVideo ? 'Vidéo YouTube' : 'Playlist YouTube');

      let movieData: Partial<Movie> = { 
        title, 
        type: isVideo ? 'video' : 'playlist',
        youtubeId: isVideo ? videoMatch[1] : undefined,
        playlistId: isPlaylist ? playlistMatch[1] : undefined,
      };

      if (posterFile) {
        const posterUrl = await uploadPoster(posterFile);
        if (posterUrl) {
          movieData.poster = posterUrl;
        } else {
          toast.error("Erreur lors de l'upload de l'image.", { id: 'add-movie-toast' });
        }
      }

      // 🖼️ Nouvelle logique de fallback pour la miniature
      if (!movieData.poster) {
        if (isVideo) {
          movieData.poster = getYoutubeThumbnail(movieData.youtubeId) || undefined;
        } else if (isPlaylist) {
          // Utiliser une miniature générique élégante pour les playlists
          movieData.poster = "https://i.imgur.com/rN1n2tG.png";
        }
      }

      await addMovie(movieData as Omit<Movie, 'id' | 'createdAt'>);
      toast.success(`"${title}" a été ajouté avec succès !`, { id: 'add-movie-toast' });

      setNewUrl('');
      setPosterFile(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du film:', error);
      toast.error('Une erreur est survenue lors de l\'ajout.', { id: 'add-movie-toast' });
    } finally {
      setIsAdding(false);
    }
  }, [newUrl, posterFile, addMovie, isAdding, user]);

  const filteredMovies = useMemo(() => {
    if (filterCategory === 'All') {
      return movies;
    }
    return movies.filter(movie => movie.category === filterCategory);
  }, [movies, filterCategory]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">🎬 Films & Séries</h1>

      {user ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Ajouter un nouveau contenu</h2>
            <Input
              placeholder="Coller un lien YouTube (vidéo ou playlist)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="h-12 text-base"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
              className="p-2"
            />
            <Button 
              onClick={handleAdd} 
              disabled={!newUrl || isAdding}
              className="w-full h-12 text-lg font-semibold"
            >
              {isAdding ? 'Ajout en cours...' : 'Ajouter le film/la série'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-4 text-center border-dashed">
          <p className="text-muted-foreground">
            Connectez-vous pour ajouter de nouveaux films et séries.
          </p>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            onClick={() => setFilterCategory(cat)}
            className="shrink-0"
          >
            {cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 text-muted-foreground">
          Chargement des films...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => setCurrentMovie(movie)}
            />
          ))}
        </div>
      )}

      {currentMovie && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 relative">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setCurrentMovie(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{currentMovie.title}</h2>
              <iframe
                className="w-full aspect-video rounded-xl"
                src={
                  currentMovie.type === "playlist"
                    ? `https://www.youtube.com/embed/videoseries?list=${currentMovie.playlistId}`
                    : `https://www.youtube.com/embed/${currentMovie.youtubeId}`
                }
                title={currentMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
