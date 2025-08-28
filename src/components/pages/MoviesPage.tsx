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
import { X, Loader2, LogIn, Upload, Film, Play, Pause } from 'lucide-react';
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

// Composant Modal de lecture amélioré avec gestion d'erreurs
const VideoModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    setEmbedBlocked(true);
  };

  // URLs avec différentes stratégies
  const getEmbedUrls = (movie: Movie) => {
    const baseParams = 'rel=0&modestbranding=1&showinfo=0&controls=1';
    
    if (movie.type === 'playlist') {
      return {
        primary: `https://www.youtube.com/embed/videoseries?list=${movie.playlistid}&${baseParams}`,
        fallback: `https://www.youtube.com/playlist?list=${movie.playlistid}`,
        directLink: `https://www.youtube.com/playlist?list=${movie.playlistid}`
      };
    } else {
      return {
        primary: `https://www.youtube-nocookie.com/embed/${movie.youtubeid}?${baseParams}`,
        secondary: `https://www.youtube.com/embed/${movie.youtubeid}?${baseParams}`,
        fallback: `https://www.youtube.com/watch?v=${movie.youtubeid}`,
        directLink: `https://www.youtube.com/watch?v=${movie.youtubeid}`
      };
    }
  };

  const urls = getEmbedUrls(movie);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const embedUrls = movie.type === 'playlist' 
    ? [urls.primary] 
    : [urls.primary, urls.secondary];

  // Tentative de chargement de l'URL suivante
  const tryNextUrl = () => {
    if (currentUrlIndex < embedUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      setEmbedBlocked(true);
    }
  };

  // Détection du blocage après un délai
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          tryNextUrl();
        }
      }, 5000); // 5 secondes de timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading, currentUrlIndex]);

  const openInYoutube = () => {
    window.open(urls.directLink, '_blank');
  };

  const openInNewTab = () => {
    // Essayer d'ouvrir dans un nouvel onglet avec l'embed
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${movie.title}</title>
          <style>
            body { margin: 0; background: #000; }
            iframe { width: 100vw; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${embedUrls[currentUrlIndex]}" allowfullscreen></iframe>
        </body>
        </html>
      `);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-6xl max-h-[95vh] p-2 sm:p-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-20 rounded-full bg-black/70 hover:bg-black text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="pr-10">
            <h2 className="text-lg sm:text-2xl font-bold truncate">{movie.title}</h2>
            {movie.description && (
              <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{movie.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {movie.category || 'Non classé'}
              </span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                {movie.type === 'playlist' ? 'Playlist' : 'Vidéo'}
              </span>
            </div>
          </div>
          
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            {/* Indicateur de chargement */}
            {isLoading && !embedBlocked && (
              <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Chargement de la vidéo...
                    {currentUrlIndex > 0 && " (Tentative alternative)"}
                  </p>
                </div>
              </div>
            )}
            
            {/* Message d'erreur avec options */}
            {(hasError || embedBlocked) && (
              <div className="absolute inset-0 bg-destructive/10 rounded-xl flex items-center justify-center">
                <div className="text-center p-4 space-y-4">
                  <div>
                    <X className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive font-medium mb-1">
                      Contenu bloqué pour l'intégration
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cette vidéo ne peut pas être lue dans cette application
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openInYoutube}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Ouvrir sur YouTube
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openInNewTab}
                      className="flex items-center gap-2"
                    >
                      <Film className="h-4 w-4" />
                      Nouvel onglet
                    </Button>
                    
                    {currentUrlIndex < embedUrls.length - 1 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={tryNextUrl}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4" />
                        Réessayer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Iframe YouTube */}
            {!embedBlocked && (
              <iframe
                key={currentUrlIndex} // Force le rechargement quand l'URL change
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                src={embedUrls[currentUrlIndex]}
                title={`Lecteur vidéo YouTube - ${movie.title}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ border: 'none' }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            )}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
};


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

  // Fonction pour gérer l'ajout d'un nouveau film/série// Ajout au handleAdd dans MoviesPage.tsx

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
  toast.info('Validation en cours...', { id: 'add-movie-toast' });

  try {
    // Utiliser la nouvelle fonction d'extraction
    const { videoId, playlistId, isValid } = extractYouTubeIds(formData.url);

    if (!isValid) {
      toast.error('Lien YouTube invalide', { 
        id: 'add-movie-toast', 
        description: 'Le lien doit être une URL de vidéo ou de playlist YouTube valide.' 
      });
      setIsAdding(false);
      return;
    }

    // Validation de l'intégrabilité pour les vidéos
    if (videoId) {
      toast.info('Vérification de la disponibilité...', { id: 'add-movie-toast' });
      const validation = await validateYouTubeEmbed(videoId);
      
      if (!validation.canEmbed) {
        toast.warning('Avertissement', {
          id: 'add-movie-toast',
          description: `${validation.reason}. La vidéo sera ajoutée mais pourrait ne pas être lisible dans l'app.`,
          action: {
            label: 'Continuer quand même',
            onClick: () => proceedWithAdd(videoId, playlistId)
          }
        });
        setIsAdding(false);
        return;
      }
    }

    await proceedWithAdd(videoId, playlistId);
  } catch (error) {
    console.error('Erreur ajout film:', error);
    toast.error('Une erreur est survenue lors de l\'ajout.', { id: 'add-movie-toast' });
    setIsAdding(false);
  }
}, [formData, addMovie, isAdding, user]);

// Fonction séparée pour poursuivre l'ajout
const proceedWithAdd = async (videoId?: string, playlistId?: string) => {
  try {
    toast.info('Ajout en cours...', { id: 'add-movie-toast' });

    let posterUrl: string | null = null;

    // Upload de l'image si fournie
    if (formData.posterFile) {
      try {
        posterUrl = await uploadPoster(formData.posterFile);
      } catch {
        toast.warning('Image non uploadée, la miniature YouTube sera utilisée.');
      }
    }

    // Fallback miniature YouTube si pas d'image personnalisée
    if (!posterUrl && videoId) {
      posterUrl = getYoutubeThumbnail(videoId) || null;
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
    // Cette partie a été refactorisée pour utiliser le store de manière optimale
    return movies.filter(movie => {
      const isCategoryMatch = filterCategory === 'All' || movie.category === filterCategory;
      const isSearchMatch = true; // La recherche est gérée par le store dans getFilteredMovies
      return isCategoryMatch && isSearchMatch;
    });
  }, [movies, filterCategory]);

  // Fonction pour gérer la sélection d'un film
  const handleMovieSelect = useCallback((movie: Movie) => {
    // Vérification que le film a bien un ID YouTube ou Playlist
    if (!movie.youtubeid && !movie.playlistid) {
      toast.error('Vidéo non disponible', {
        description: 'Ce contenu ne peut pas être lu car il manque l\'identifiant YouTube.'
      });
      return;
    }
    
    setCurrentMovie(movie);
  }, [setCurrentMovie]);

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
            {cat} {cat !== 'All' && `(${movies.filter(m => m.category === cat).length})`}
          </Button>
        ))}
      </div>

      {/* Message si aucun film */}
      {filteredMovies.length === 0 && (
        <Card className="p-8 text-center">
          <Film className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterCategory === 'All' 
              ? 'Aucun film ou série ajouté pour le moment.' 
              : `Aucun contenu trouvé dans la catégorie "${filterCategory}".`
            }
          </p>
        </Card>
      )}

      {/* Grille des films */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieSelect(movie)}
          />
        ))}
      </div>

      {/* Modal de lecture amélioré */}
      <AnimatePresence>
        {currentMovie && (
          <VideoModal 
            movie={currentMovie} 
            onClose={() => setCurrentMovie(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
