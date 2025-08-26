'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
import { X, Loader2, LogIn } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types pour les catégories de films. Utiliser un type pour éviter les erreurs de frappe.
type MovieCategory =
  | 'Action'
  | 'Comédie'
  | 'Drame'
  | 'Horreur'
  | 'Animation'
  | 'Série'
  | 'Documentaire'
  | 'Autre';

// Composant pour l'invite de connexion
const LoginPrompt = () => (
  <Card className="p-6 text-center border-dashed bg-muted">
    <div className="space-y-4">
      <p className="text-muted-foreground font-semibold">
        Connectez-vous pour ajouter de nouveaux films et séries.
      </p>
      <Link href="/auth" passHref>
        <Button variant="outline" className="group">
          <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
          Se connecter
        </Button>
      </Link>
    </div>
  </Card>
);

export default function MoviesPage() {
  const { movies, currentMovie, setCurrentMovie, fetchMovies, addMovie } = useMovieStore();
  const { user } = useAuth();

  const [newUrl, setNewUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<MovieCategory | 'All'>('All');

  // Gérer la liste des catégories de manière optimisée
  const categories: (MovieCategory | 'All')[] = useMemo(() => {
    const defaultCategories: MovieCategory[] = ['Action', 'Comédie', 'Drame', 'Horreur', 'Animation', 'Série', 'Documentaire', 'Autre'];
    const existingCategories = Array.from(new Set(movies.map(m => m.category))).filter(Boolean) as MovieCategory[];
    
    const uniqueCategories = new Set<MovieCategory | 'All'>(['All', ...defaultCategories, ...existingCategories]);
    return Array.from(uniqueCategories).sort();
  }, [movies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleAdd = useCallback(async () => {
    if (!user) {
      toast.error('Connexion requise', { description: 'Vous devez être connecté pour ajouter un film.' });
      return;
    }

    if (!newUrl || isAdding) return;
    setIsAdding(true);
    toast.info('Ajout en cours...', { id: 'add-movie-toast' });

    try {
      const videoMatch = newUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|e\/|watch\?v=|embed\/|user\/[^/]+\/)\??)([^"&?\/\s]{11})/);
      const playlistMatch = newUrl.match(/(?:youtube\.com\/(?:playlist\?list=))([^&]+)/);
      const isVideo = !!videoMatch;
      const isPlaylist = !!playlistMatch;

      if (!isVideo && !isPlaylist) {
        toast.error('Lien YouTube invalide', { id: 'add-movie-toast', description: 'Le lien doit être une URL de vidéo ou de playlist YouTube valide.' });
        setIsAdding(false);
        return;
      }

      const youtubeId = isVideo ? videoMatch![1] : undefined;
      const playlistId = isPlaylist ? playlistMatch![1] : undefined;
      const title = (await getYoutubeTitle(newUrl)) || (isVideo ? 'Vidéo YouTube' : 'Playlist YouTube');

      let movieData: Partial<Movie> = {
        title,
        type: isVideo ? 'video' : 'playlist',
        youtubeId,
        playlistId,
        poster: getYoutubeThumbnail(youtubeId) || undefined,
      };

      if (posterFile) {
        const posterUrl = await uploadPoster(posterFile);
        if (posterUrl) {
          movieData.poster = posterUrl;
        } else {
          toast.error('Erreur lors de l\'upload de l\'image.', { id: 'add-movie-toast' });
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
    if (filterCategory === 'All') return movies;
    return movies.filter(movie => movie.category === filterCategory);
  }, [movies, filterCategory]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">🎬 Films & Séries</h1>

      <AnimatePresence>
        {user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
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
                  className="p-2 cursor-pointer file:text-blue-500 file:bg-transparent file:border-0"
                />
                <Button
                  onClick={handleAdd}
                  disabled={!newUrl || isAdding}
                  className="w-full h-12 text-lg font-semibold"
                >
                  {isAdding ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Ajout en cours...
                    </span>
                  ) : (
                    'Ajouter le film/la série'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPrompt />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => setCurrentMovie(movie)}
          />
        ))}
      </div>

      <AnimatePresence>
        {currentMovie && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="w-full max-w-4xl p-4 sm:p-6 relative overflow-hidden">
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 rounded-full"
                onClick={() => setCurrentMovie(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-xl sm:text-2xl font-bold truncate">{currentMovie.title}</h2>
                <div className="relative pt-[56.25%] w-full rounded-xl overflow-hidden">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={
                      currentMovie.type === 'playlist'
                        ? `https://www.youtube.com/embed/videoseries?list=${currentMovie.playlistId}`
                        : `https://www.youtube.com/embed/${currentMovie.youtubeId}`
                    }
                    title={`Lecteur vidéo YouTube - ${currentMovie.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
