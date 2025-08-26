'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useMovieStore } from '@/stores/useMovieStore';
import { useAuth } from '@/hooks/useAuth';
import { Movie, MovieInsert } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { uploadPoster } from '@/lib/uploadPoster';
import { getYoutubeTitle } from '@/lib/getYoutubeTitle';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';
import { toast } from 'sonner';
import { MovieCard } from '@/components/MovieCard';
import { X, Loader2, LogIn, Upload, Film } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types pour les catégories de films
type MovieCategory =
  | 'Action'
  | 'Comédie'
  | 'Drame'
  | 'Horreur'
  | 'Animation'
  | 'Série'
  | 'Documentaire'
  | 'Autre';

// Interface pour les données du formulaire
interface FormData {
  url: string;
  title: string;
  description: string;
  type: 'video' | 'playlist';
  category: MovieCategory;
  posterFile: File | null;
}

// Composant pour l'invite de connexion
const LoginPrompt = () => (
  <Card className="p-6 text-center border-dashed bg-muted">
    <div className="space-y-4">
      <Film className="mx-auto h-12 w-12 text-muted-foreground" />
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

  // États pour le formulaire complet
  const [formData, setFormData] = useState<FormData>({
    url: '',
    title: '',
    description: '',
    type: 'video',
    category: 'Autre',
    posterFile: null
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState<MovieCategory | 'All'>('All');
  const [autoFilling, setAutoFilling] = useState(false);

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

  // Fonction pour auto-remplir le titre quand l'URL change
  const handleUrlChange = useCallback(async (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    
    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      setAutoFilling(true);
      try {
        const title = await getYoutubeTitle(url);
        if (title) {
          setFormData(prev => ({ 
            ...prev, 
            title: prev.title || title, // Ne remplace que si le titre est vide
            type: url.includes('list=') ? 'playlist' : 'video'
          }));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du titre:', error);
      } finally {
        setAutoFilling(false);
      }
    }
  }, []);

  // ...
const handleAdd = useCallback(async () => {
  if (!user) {
    toast.error('Connexion requise', { description: 'Vous devez être connecté pour ajouter un film.' });
    return;
  }

  if (!formData.url || !formData.title || isAdding) {
    toast.error('Champs requis', { description: 'L\'URL et le titre sont obligatoires.' });
    return;
  }

  setIsAdding(true);
  toast.info('Ajout en cours...', { id: 'add-movie-toast' });

  try {
    const videoMatch = formData.url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|e\/|watch\?v=|embed\/|user\/[^/]+\/)\??)([^"&?\/\s]{11})/);
    const playlistMatch = formData.url.match(/(?:youtube\.com\/(?:playlist\?list=))([^&]+)/);
    const isVideo = !!videoMatch;
    const isPlaylist = !!playlistMatch;

    if (!isVideo && !isPlaylist) {
      toast.error('Lien YouTube invalide', { id: 'add-movie-toast', description: 'Le lien doit être une URL de vidéo ou de playlist YouTube valide.' });
      setIsAdding(false);
      return;
    }

    const youtubeid = isVideo ? videoMatch![1] : null;
    const playlistid = isPlaylist ? playlistMatch![1] : null;

    // Construction des données pour Supabase
    const movieData: MovieInsert = {
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      category: formData.category,
      youtubeid,
      playlistid,
      poster: string, // sera rempli après upload ou fallback
    };

    // Upload de l'image si fournie
    if (formData.posterFile) {
      try {
        const posterUrl = await uploadPoster(formData.posterFile);
        if (posterUrl) movieData.poster = posterUrl;
      } catch {
        toast.warning('Image non uploadée, la miniature YouTube sera utilisée.');
      }
    }

    // Fallback miniature YouTube si pas d'image personnalisée
    if (!movieData.poster && youtubeid) {
      movieData.poster = getYoutubeThumbnail(youtubeid) || '';
    }

    // Ajout via le store
    await addMovie(movieData);

    toast.success(`"${formData.title}" ajouté avec succès !`, { id: 'add-movie-toast' });

    // Réinitialisation du formulaire
    setFormData({
      url: '',
      title: '',
      description: '',
      type: 'video',
      category: 'Autre',
      posterFile: null
    });
  } catch (error) {
    console.error('Erreur ajout film:', error);
    toast.error('Une erreur est survenue lors de l\'ajout.', { id: 'add-movie-toast' });
  } finally {
    setIsAdding(false);
  }
}, [formData, addMovie, isAdding, user]);

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
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Ajouter un nouveau contenu
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* URL YouTube */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      URL YouTube <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=... ou https://www.youtube.com/playlist?list=..."
                      value={formData.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="h-12 text-base"
                      disabled={autoFilling}
                    />
                    {autoFilling && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Récupération des informations...
                      </p>
                    )}
                  </div>

                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Titre du film/série"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: 'video' | 'playlist') => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vidéo</SelectItem>
                        <SelectItem value="playlist">Playlist/Série</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Catégorie</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: MovieCategory) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Action">Action</SelectItem>
                        <SelectItem value="Comédie">Comédie</SelectItem>
                        <SelectItem value="Drame">Drame</SelectItem>
                        <SelectItem value="Horreur">Horreur</SelectItem>
                        <SelectItem value="Animation">Animation</SelectItem>
                        <SelectItem value="Série">Série</SelectItem>
                        <SelectItem value="Documentaire">Documentaire</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image personnalisée */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Image personnalisée (optionnel)</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        posterFile: e.target.files?.[0] || null 
                      }))}
                      className="p-2 cursor-pointer file:text-blue-500 file:bg-transparent file:border-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Si aucune image n'est fournie, la miniature YouTube sera utilisée
                    </p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                    <Textarea
                      placeholder="Description du contenu..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAdd}
                  disabled={!formData.url || !formData.title || isAdding}
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

      {/* Filtres par catégorie */}
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

      {/* Grille des films */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => setCurrentMovie(movie)}
          />
        ))}
      </div>

      {/* Modal de lecture */}
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
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{currentMovie.title}</h2>
                  {currentMovie.description && (
                    <p className="text-muted-foreground mt-2">{currentMovie.description}</p>
                  )}
                </div>
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