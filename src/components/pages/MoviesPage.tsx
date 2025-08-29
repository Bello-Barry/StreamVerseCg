// src/app/movies/MoviesPage.tsx
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
// L'import des actions serveur reste le même
import { getYoutubeTitle, validateYouTubeEmbed } from '@/lib/actions';
import { toast } from 'sonner';
import { MovieCard } from '@/components/MovieCard';
import { X, Loader2, LogIn, Upload, Film, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import VideoModal from '@/components/VideoModal';

// Types pour les catégories
type MovieCategory =
  | 'Action' | 'Comédie' | 'Drame' | 'Horreur' | 'Animation' | 'Série' | 'Documentaire' | 'Autre';

interface FormData {
  url: string;
  title: string;
  description: string;
  type: 'video' | 'playlist';
  category: MovieCategory;
  posterFile: File | null;
}

const LoginPrompt = () => (
  <Card className="p-6 text-center border-dashed bg-muted">
    <div className="space-y-4">
      <Film className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground font-semibold">Connectez-vous pour ajouter de nouveaux films et séries.</p>
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

  const categories: (MovieCategory | 'All')[] = useMemo(() => {
    const defaultCategories: MovieCategory[] = ['Action','Comédie','Drame','Horreur','Animation','Série','Documentaire','Autre'];
    const existingCategories = Array.from(new Set(movies.map(m => m.category))).filter(Boolean) as MovieCategory[];
    const unique = new Set<MovieCategory | 'All'>(['All', ...defaultCategories, ...existingCategories]);
    return Array.from(unique).sort();
  }, [movies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleUrlChange = useCallback(async (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    if (!url) return;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setAutoFilling(true);
      try {
        const { videoId, playlistId } = extractYouTubeIds(url);
        if (videoId || playlistId) {
          // passons bien l'ID (getYoutubeTitle attend un videoId)
          const title = videoId ? await getYoutubeTitle(videoId) : undefined;
          if (title) {
            setFormData(prev => ({
              ...prev,
              title: prev.title || title,
              type: playlistId ? 'playlist' : 'video'
            }));
          } else if (playlistId && !videoId) {
            // si playlist et pas de titre trouvé, on marque type playlist
            setFormData(prev => ({ ...prev, type: 'playlist' }));
          }
        }
      } catch (err) {
        console.error('Erreur récupération titre YouTube', err);
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
    toast.info('Validation en cours...', { id: toastId });

    try {
      const { videoId, playlistId, isValid } = extractYouTubeIds(formData.url);
      if (!isValid) {
        toast.error('Lien YouTube invalide', { id: toastId, description: 'Le lien doit être une URL de vidéo ou de playlist YouTube valide.' });
        setIsAdding(false);
        return;
      }

      let posterUrl: string | null = null;
      if (formData.posterFile) {
        try {
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

      // Validation non-bloquante : on affiche un warning si l'API renvoie canEmbed=false,
      // mais on laisse l'utilisateur ajouter la vidéo (évite faux positifs liés à regionRestriction).
      if (videoId) {
        try {
          const validation = await validateYouTubeEmbed(videoId);
          if (!validation.canEmbed) {
            toast.warning(`${validation.reason}. La vidéo sera ajoutée mais pourrait ne pas être lisible dans l'app.`, { id: toastId });
          }
        } catch (err) {
          console.warn('Validation YouTube échouée', err);
        }
      }

      await addMovie(movieData);
      toast.success(`"${formData.title}" ajouté avec succès !`, { id: toastId });

      // reset form
      setFormData({ url: '', title: '', description: '', type: 'video', category: 'Autre', posterFile: null });

    } catch (err) {
      console.error('Erreur ajout film:', err);
      toast.error('Une erreur est survenue lors de l\'ajout.', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  }, [formData, isAdding, user, addMovie]);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => filterCategory === 'All' || movie.category === filterCategory);
  }, [movies, filterCategory]);

  const handleMovieSelect = useCallback((movie: Movie) => {
    if (!movie.youtubeid && !movie.playlistid) {
      toast.error('Vidéo non disponible', { description: 'Ce contenu ne peut pas être lu car il manque l\'identifiant YouTube.' });
      return;
    }
    setCurrentMovie(movie);
  }, [setCurrentMovie]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">🎬 Films & Séries</h1>

      <AnimatePresence>
        {user ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Ajouter un nouveau contenu
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">URL YouTube <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=... ou https://www.youtube.com/playlist?list=..."
                      value={formData.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="h-12 text-base"
                      disabled={autoFilling || isAdding}
                    />
                    {autoFilling && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Récupération des informations...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Titre <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="Titre du film/série"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="h-12"
                      disabled={isAdding}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as 'video' | 'playlist' }))} disabled={isAdding}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vidéo</SelectItem>
                        <SelectItem value="playlist">Playlist/Série</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Catégorie</label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as MovieCategory }))} disabled={isAdding}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
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

                  <div>
                    <label className="block text-sm font-medium mb-2">Image personnalisée (optionnel)</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({ ...prev, posterFile: e.target.files?.[0] || null }))}
                      className="p-2 cursor-pointer file:text-blue-500 file:bg-transparent file:border-0"
                      disabled={isAdding}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Si aucune image n'est fournie, la miniature YouTube sera utilisée</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                    <Textarea placeholder="Description du contenu..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[80px]" disabled={isAdding} />
                  </div>
                </div>

                <Button onClick={handleAdd} disabled={!formData.url || !formData.title || isAdding} className="w-full h-12 text-lg font-semibold">
                  {isAdding ? <span className="flex items-center"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Ajout en cours...</span> : 'Ajouter le film/la série'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <LoginPrompt />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Button key={cat} variant={filterCategory === cat ? 'default' : 'outline'} onClick={() => setFilterCategory(cat)} className="shrink-0">
            {cat} {cat !== 'All' && `(${movies.filter(m => m.category === cat).length})`}
          </Button>
        ))}
      </div>

      {/* Message si aucun film */}
      {filteredMovies.length === 0 && (
        <Card className="p-8 text-center">
          <Film className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterCategory === 'All' ? 'Aucun film ou série ajouté pour le moment.' : `Aucun contenu trouvé dans la catégorie "${filterCategory}".`}
          </p>
        </Card>
      )}

      {/* Grille */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={() => handleMovieSelect(movie)} />
        ))}
      </div>

      <AnimatePresence>
        {currentMovie && <VideoModal movie={currentMovie} onClose={() => setCurrentMovie(null)} />}
      </AnimatePresence>
    </div>
  );
}