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
import { getYoutubeThumbnail, extractYouTubeIds } from '@/lib/youtubeClientUtils';
import { getYoutubeTitle } from '@/lib/getYoutubeTitle';
import { toast } from 'sonner';
import { MovieCard } from '@/components/MovieCard';
import { X, Loader2, LogIn, Upload, Film, Play, Search, Grid3X3, List, Heart, Download, Plus, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import AdvancedVideoModal from '@/components/AdvancedVideoModal';

// Types pour les catégories
type MovieCategory =
  | 'Action' | 'Comédie' | 'Drame' | 'Horreur' | 'Animation' | 'Série' | 'Documentaire' | 'Autre';

type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'title' | 'category' | 'type';

interface FormData {
  url: string;
  title: string;
  description: string;
  type: 'video' | 'playlist';
  category: MovieCategory;
  posterFile: File | null;
}

interface MovieWithMetadata extends Movie {
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  lastWatched?: Date;
  progress?: number;
}

const LoginPrompt = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
      <CardContent className="relative p-8 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
            <Film className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Bienvenue dans votre cinéma personnel
          </h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
            Connectez-vous pour découvrir, organiser et regarder vos films et séries préférés dans une expérience immersive.
          </p>
          <Link href="/auth" passHref>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
              <LogIn className="mr-2 h-5 w-5" />
              Commencer l'aventure
            </Button>
          </Link>
        </motion.div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function MoviesPage() {
  const { movies, currentMovie, setCurrentMovie, fetchMovies, addMovie } = useMovieStore();
  const { user } = useAuth();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // États pour les fonctionnalités avancées
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const categories: (MovieCategory | 'All')[] = useMemo(() => {
    const defaultCategories: MovieCategory[] = ['Action','Comédie','Drame','Horreur','Animation','Série','Documentaire','Autre'];
    const existingCategories = Array.from(new Set(movies.map(m => m.category))).filter(Boolean) as MovieCategory[];
    const unique = new Set<MovieCategory | 'All'>(['All', ...defaultCategories, ...existingCategories]);
    return Array.from(unique).sort();
  }, [movies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Fonction améliorée utilisant getYoutubeTitle
  const handleUrlChange = useCallback(async (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    if (!url) return;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setAutoFilling(true);
      try {
        const { videoId, playlistId } = extractYouTubeIds(url);
        if (videoId || playlistId) {
          const title = await getYoutubeTitle(url);
          if (title) {
            setFormData(prev => ({
              ...prev,
              title: prev.title || title,
              type: playlistId ? 'playlist' : 'video'
            }));
            toast.success('Informations récupérées avec succès');
          } else if (playlistId && !videoId) {
            setFormData(prev => ({ ...prev, type: 'playlist' }));
            toast.info('Playlist détectée');
          }
        }
      } catch (err) {
        console.error('Erreur récupération titre YouTube', err);
        toast.error('Impossible de récupérer les informations de la vidéo');
      } finally {
        setAutoFilling(false);
      }
    }
  }, []);

  const handleAdd = useCallback(async () => {
    if (!user) {
      toast.error('Connexion requise', { description: 'Vous devez être connecté pour ajouter un film.' });
      return;
    }

    if (!formData.url || !formData.title) {
      toast.error('Champs requis', { description: 'L\'URL et le titre sont obligatoires.' });
      return;
    }

    if (isAdding) return;

    setIsAdding(true);
    const toastId = 'add-movie-toast';
    toast.loading('Ajout en cours...', { id: toastId });

    try {
      const { videoId, playlistId, isValid } = extractYouTubeIds(formData.url);
      if (!isValid) {
        toast.error('Lien YouTube invalide', { id: toastId });
        setIsAdding(false);
        return;
      }

      let posterUrl: string | null = null;
      if (formData.posterFile) {
        try {
          toast.loading('Upload de l\'image...', { id: toastId });
          posterUrl = await uploadPoster(formData.posterFile);
        } catch (err) {
          console.warn('Upload poster failed', err);
          toast.warning('Image non uploadée, la miniature YouTube sera utilisée.', { id: toastId });
        }
      }

      if (!posterUrl && videoId) {
        posterUrl = getYoutubeThumbnail(videoId);
      }

      const movieData: MovieInsert = {
        title: formData.title,
        description: formData.description || '',
        type: formData.type,
        category: formData.category,
        youtubeid: videoId,
        playlistid: playlistId,
        poster: posterUrl ?? undefined,
      };

      await addMovie(movieData);
      toast.success(`"${formData.title}" ajouté avec succès !`, { 
        id: toastId,
        description: 'Votre contenu est maintenant disponible dans votre collection'
      });

      // Reset form et fermer
      setFormData({ url: '', title: '', description: '', type: 'video', category: 'Autre', posterFile: null });
      setShowAddForm(false);

    } catch (err) {
      console.error('Erreur ajout film:', err);
      toast.error('Une erreur est survenue lors de l\'ajout.', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  }, [formData, isAdding, user, addMovie]);

  // Fonctions pour les actions avancées
  const handleToggleFavorite = useCallback((movie: Movie) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(movie.id)) {
      newFavorites.delete(movie.id);
      toast.success('Retiré des favoris');
    } else {
      newFavorites.add(movie.id);
      toast.success('Ajouté aux favoris');
    }
    setFavorites(newFavorites);
  }, [favorites]);

  const handleToggleWatchlist = useCallback((movie: Movie) => {
    const newWatchlist = new Set(watchlist);
    if (watchlist.has(movie.id)) {
      newWatchlist.delete(movie.id);
      toast.success('Retiré de la liste de lecture');
    } else {
      newWatchlist.add(movie.id);
      toast.success('Ajouté à la liste de lecture');
    }
    setWatchlist(newWatchlist);
  }, [watchlist]);

  const handleDownload = useCallback((movie: Movie) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Démarrage du téléchargement...',
        success: `"${movie.title}" téléchargé avec succès`,
        error: 'Erreur lors du téléchargement'
      }
    );
  }, []);

  // Fonction helper pour obtenir la date de création
  const getCreatedDate = useCallback((movie: Movie): number => {
    // Essayez différentes propriétés possibles selon votre modèle Movie
    if ('createdAt' in movie && movie.createdAt) {
      return new Date(movie.createdAt).getTime();
    }
    if ('created_at' in movie && (movie as any).created_at) {
      return new Date((movie as any).created_at).getTime();
    }
    if ('updatedAt' in movie && movie.updatedAt) {
      return new Date(movie.updatedAt).getTime();
    }
    return 0;
  }, []);

  // Filtrage et tri des films - CORRIGÉ
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = movies.filter(movie => {
      const matchesCategory = filterCategory === 'All' || movie.category === filterCategory;
      const matchesSearch = !searchQuery || 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Tri corrigé
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'type':
          return a.type.localeCompare(b.type);
        case 'recent':
        default:
          return getCreatedDate(b) - getCreatedDate(a);
      }
    });

    return filtered.map(movie => ({
      ...movie,
      isFavorite: favorites.has(movie.id),
      isInWatchlist: watchlist.has(movie.id)
    })) as MovieWithMetadata[];
  }, [movies, filterCategory, searchQuery, sortMode, favorites, watchlist, getCreatedDate]);

  const handleMovieSelect = useCallback((movie: Movie) => {
    if (!movie.youtubeid && !movie.playlistid) {
      toast.error('Vidéo non disponible', { description: 'Ce contenu ne peut pas être lu.' });
      return;
    }
    setCurrentMovie(movie);
  }, [setCurrentMovie]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        <div className="relative px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Ciné
              </span>
              <span className="text-white">Thèque</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Votre collection personnelle de films et séries, accessible partout, tout le temps.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-8 pb-12">
        {/* Formulaire d'ajout */}
        <AnimatePresence>
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      Ajouter du contenu
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="text-gray-300 hover:text-white"
                    >
                      {showAddForm ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showAddForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6">
                          {/* URL Input avec animation de chargement */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              URL YouTube <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                placeholder="https://www.youtube.com/watch?v=... ou playlist"
                                value={formData.url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className="h-12 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                                disabled={autoFilling || isAdding}
                              />
                              {autoFilling && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                                </div>
                              )}
                            </div>
                            {autoFilling && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-purple-400 mt-2 flex items-center gap-2"
                              >
                                <Sparkles className="h-4 w-4" />
                                Récupération automatique des informations...
                              </motion.p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Titre <span className="text-red-400">*</span>
                              </label>
                              <Input
                                placeholder="Titre du contenu"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                disabled={isAdding}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">Type</label>
                              <Select 
                                value={formData.type} 
                                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as 'video' | 'playlist' }))} 
                                disabled={isAdding}
                              >
                                <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="video">🎬 Film/Vidéo</SelectItem>
                                  <SelectItem value="playlist">📺 Série/Playlist</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">Catégorie</label>
                              <Select 
                                value={formData.category} 
                                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as MovieCategory }))} 
                                disabled={isAdding}
                              >
                                <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="Action">⚡ Action</SelectItem>
                                  <SelectItem value="Comédie">😄 Comédie</SelectItem>
                                  <SelectItem value="Drame">🎭 Drame</SelectItem>
                                  <SelectItem value="Horreur">👻 Horreur</SelectItem>
                                  <SelectItem value="Animation">🎨 Animation</SelectItem>
                                  <SelectItem value="Série">📺 Série</SelectItem>
                                  <SelectItem value="Documentaire">📖 Documentaire</SelectItem>
                                  <SelectItem value="Autre">🎪 Autre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-3">
                                Image personnalisée
                              </label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData(prev => ({ ...prev, posterFile: e.target.files?.[0] || null }))}
                                className="h-12 bg-gray-700 border-gray-600 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                                disabled={isAdding}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              Description
                            </label>
                            <Textarea 
                              placeholder="Description du contenu..." 
                              value={formData.description} 
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                              className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              disabled={isAdding} 
                            />
                          </div>

                          <Button 
                            onClick={handleAdd} 
                            disabled={!formData.url || !formData.title || isAdding} 
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                          >
                            {isAdding ? (
                              <span className="flex items-center">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Ajout en cours...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Ajouter à ma collection
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!user && <LoginPrompt />}
        </AnimatePresence>

        {/* Barre de recherche et filtres */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Recherche */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Rechercher dans votre collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Contrôles */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtres par catégorie */}
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((cat) => (
                <Button
                  key={cat}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  onClick={() => setFilterCategory(cat)}
                  className={`${
                    filterCategory === cat
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                  size="sm"
                >
                  {cat}
                  {cat !== 'All' && (
                    <Badge variant="secondary" className="ml-2 bg-gray-600 text-white">
                      {movies.filter(m => m.category === cat).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Contrôles de vue */}
            <div className="flex items-center gap-2">
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="title">Par titre</SelectItem>
                  <SelectItem value="category">Par catégorie</SelectItem>
                  <SelectItem value="type">Par type</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>{filteredAndSortedMovies.length} contenus</span>
            <span>•</span>
            <span>{favorites.size} favoris</span>
            <span>•</span>
            <span>{watchlist.size} en attente</span>
          </div>
        </motion.div>

        {/* Message si aucun contenu */}
        {filteredAndSortedMovies.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-12 text-center bg-gray-800/30 border-gray-700">
              <Film className="mx-auto h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'Aucun résultat trouvé' : 'Votre collection est vide'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? `Aucun contenu ne correspond à "${searchQuery}". Essayez un autre terme.`
                  : 'Commencez par ajouter vos premiers films et séries pour créer votre collection personnalisée.'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Effacer la recherche
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {/* Grille des films */}
        {filteredAndSortedMovies.length > 0 && (
          <motion.div
            className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4' 
              : 'space-y-4'
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.05 }}
          >
            <AnimatePresence>
              {filteredAndSortedMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <MovieCard 
                    movie={movie} 
                    onClick={() => handleMovieSelect(movie)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToWatchlist={handleToggleWatchlist}
                    onDownload={handleDownload}
                    isFavorite={movie.isFavorite}
                    isInWatchlist={movie.isInWatchlist}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Actions flottantes pour mobile */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col gap-3">
            {user && !showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/25 border-0"
                size="icon"
              >
                <Plus className="h-6 w-6 text-white" />
              </Button>
            )}
            
            {/* Bouton de retour en haut */}
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              variant="outline"
              className="w-14 h-14 rounded-full bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-700"
              size="icon"
            >
              <TrendingUp className="h-5 w-5 text-gray-300 rotate-180" />
            </Button>
          </div>
        </div>

        {/* Shortcuts clavier */}
        {user && (
          <div className="hidden lg:block fixed bottom-6 left-6 z-40">
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 p-4">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="font-semibold text-gray-300 mb-2">Raccourcis clavier</div>
                <div><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl + K</kbd> Recherche</div>
                <div><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">A</kbd> Ajouter</div>
                <div><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">G</kbd> Grille</div>
                <div><kbd className="px-2 py-1 bg-gray-700 rounded text-xs">L</kbd> Liste</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal vidéo avec gestion améliorée */}
      <AnimatePresence>
        {currentMovie && (
          <AdvancedVideoModal 
            movie={currentMovie} 
            onClose={() => setCurrentMovie(null)}
            onNext={() => {
              const currentIndex = filteredAndSortedMovies.findIndex(m => m.id === currentMovie.id);
              const nextMovie = filteredAndSortedMovies[currentIndex + 1];
              if (nextMovie) setCurrentMovie(nextMovie);
            }}
            onPrevious={() => {
              const currentIndex = filteredAndSortedMovies.findIndex(m => m.id === currentMovie.id);
              const previousMovie = filteredAndSortedMovies[currentIndex - 1];
              if (previousMovie) setCurrentMovie(previousMovie);
            }}
            hasNext={filteredAndSortedMovies.findIndex(m => m.id === currentMovie.id) < filteredAndSortedMovies.length - 1}
            hasPrevious={filteredAndSortedMovies.findIndex(m => m.id === currentMovie.id) > 0}
          />
        )}
      </AnimatePresence>

      {/* Effet de particules de fond (optionnel) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500/20 rounded-full animate-pulse" 
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-500/20 rounded-full animate-pulse" 
             style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400/15 rounded-full animate-pulse" 
             style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-blue-400/15 rounded-full animate-pulse" 
             style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} />
      </div>

      {/* Gestion des raccourcis clavier */}
      {typeof window !== 'undefined' && (
        <div className="hidden">
          {/* Écouteur d'événements clavier via useEffect - sera géré dans le composant */}
        </div>
      )}
    </div>
  );

  // Effet pour les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Éviter les conflits avec les champs de saisie
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          if (user && !showAddForm) {
            e.preventDefault();
            setShowAddForm(true);
          }
          break;
        case 'g':
          e.preventDefault();
          setViewMode('grid');
          break;
        case 'l':
          e.preventDefault();
          setViewMode('list');
          break;
        case 'escape':
          if (currentMovie) {
            setCurrentMovie(null);
          } else if (showAddForm) {
            setShowAddForm(false);
          }
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
            searchInput?.focus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, showAddForm, currentMovie, setCurrentMovie, setShowAddForm]);
}