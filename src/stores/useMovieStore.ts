'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Movie, MovieInsert } from '@/types/movie';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { validateYouTubeEmbed } from '@/lib/youtubeValidation';

interface MovieState {
  movies: Movie[];
  currentMovie: Movie | null;
  favorites: string[];
  watchHistory: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'title' | 'date' | 'category';
  sortOrder: 'asc' | 'desc';
  embedBlocked: string[];
}

interface MovieActions {
  // CORRECTION 1: Séparer la sélection de l'ajout à l'historique
  setCurrentMovie: (movie: Movie | null, addToHistory?: boolean) => void;
  fetchMovies: () => Promise<void>;
  addMovie: (movie: MovieInsert) => Promise<void>;
  updateMovie: (id: string, updates: Partial<MovieInsert>) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
  toggleFavorite: (movieId: string) => void;
  addToWatchHistory: (movieId: string) => void;
  clearWatchHistory: () => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: 'title' | 'date' | 'category', order: 'asc' | 'desc') => void;
  getFilteredMovies: (category?: string) => Movie[];
  getFavoriteMovies: () => Movie[];
  getRecentMovies: (limit?: number) => Movie[];
  duplicateMovie: (id: string) => Promise<void>;
  markAsEmbedBlocked: (movieId: string) => void;
  isEmbedBlocked: (movieId: string) => boolean;
  validateMovieEmbed: (movieId: string) => Promise<boolean>;
  // AJOUT: Nouvelle méthode pour valider avant ouverture
  canPlayMovie: (movie: Movie) => { canPlay: boolean; reason?: string };
  getMovieStats: () => {
    totalMovies: number;
    totalPlaylists: number;
    categoriesCount: Record<string, number>;
    mostWatchedCategory: string;
    recentlyWatchedCount: number;
    embedBlockedCount: number;
  };
}

const initialState: MovieState = {
  movies: [],
  currentMovie: null,
  favorites: [],
  watchHistory: [],
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
  embedBlocked: [],
};

export const useMovieStore = create<MovieState & MovieActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * CORRECTION 2: Sélection de film avec contrôle de l'historique
       */
      setCurrentMovie: (movie, addToHistory = true) => {
        console.log('setCurrentMovie appelé:', { movie: movie?.title, addToHistory });
        
        // Validation avant sélection
        if (movie) {
          const validation = get().canPlayMovie(movie);
          if (!validation.canPlay) {
            toast.error('Vidéo non disponible', {
              description: validation.reason
            });
            return;
          }
          
          // Ajouter à l'historique seulement si demandé
          if (addToHistory) {
            get().addToWatchHistory(movie.id);
          }
        }
        
        set({ currentMovie: movie });
      },

      /**
       * CORRECTION 3: Validation avant lecture
       */
      canPlayMovie: (movie) => {
        if (!movie) {
          return { canPlay: false, reason: 'Film non trouvé' };
        }

        if (!movie.youtubeid && !movie.playlistid) {
          return { 
            canPlay: false, 
            reason: 'Aucun ID YouTube associé à ce contenu' 
          };
        }

        if (movie.youtubeid && get().isEmbedBlocked(movie.youtubeid)) {
          return { 
            canPlay: false, 
            reason: 'Cette vidéo ne peut pas être intégrée. Ouvrez-la directement sur YouTube.' 
          };
        }

        return { canPlay: true };
      },

      /**
       * Récupération des films avec gestion d'erreur améliorée
       */
      fetchMovies: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(`Erreur Supabase: ${error.message}`);
          }

          if (data) {
            // CORRECTION 4: Validation des données plus stricte
            const movies: Movie[] = data
              .filter(row => row.id && row.title) // Filtrer les entrées invalides
              .map(row => ({
                id: row.id,
                title: row.title,
                description: row.description || undefined,
                youtubeid: row.youtubeid || undefined,
                playlistid: row.playlistid || undefined,
                poster: row.poster || undefined,
                type: row.type || 'video',
                category: row.category || undefined,
                createdAt: row.created_at,
              }));
            
            console.log(`${movies.length} films chargés depuis la DB`);
            set({ movies, error: null });
          }
        } catch (err) {
          const errorMessage = `Échec de la récupération des films: ${
            err instanceof Error ? err.message : 'Erreur inconnue'
          }`;
          console.error(errorMessage, err);
          set({ error: errorMessage, movies: [] });
          toast.error('Erreur de chargement', {
            description: 'Impossible de récupérer la liste des films.',
            action: {
              label: 'Réessayer',
              onClick: () => get().fetchMovies()
            }
          });
        } finally {
          set({ loading: false });
        }
      },

      /**
       * CORRECTION 5: Ajout de film avec validation renforcée
       */
      addMovie: async (movieData) => {
        // Validation préalable
        if (!movieData.title?.trim()) {
          toast.error('Titre requis');
          return;
        }

        if (!movieData.youtubeid && !movieData.playlistid) {
          toast.error('ID YouTube requis');
          return;
        }

        set({ loading: true, error: null });
        try {
          const { movies } = get();
          
          // Vérification de doublons améliorée
          const isDuplicate = movies.some(movie => {
            if (movieData.youtubeid && movie.youtubeid === movieData.youtubeid) return true;
            if (movieData.playlistid && movie.playlistid === movieData.playlistid) return true;
            return movie.title.toLowerCase().trim() === movieData.title.toLowerCase().trim();
          });

          if (isDuplicate) {
            toast.warning('Contenu déjà existant', {
              description: 'Ce film ou cette série existe déjà dans votre collection.',
            });
            set({ loading: false });
            return;
          }

          // Validation YouTube en arrière-plan (non-bloquante)
          if (movieData.youtubeid) {
            validateYouTubeEmbed(movieData.youtubeid)
              .then(validation => {
                if (!validation.canEmbed) {
                  console.warn('Embed bloqué pour:', movieData.youtubeid);
                  get().markAsEmbedBlocked(movieData.youtubeid!);
                  toast.warning("Lecture limitée", {
                    description: "Cette vidéo pourrait ne pas être lisible directement.",
                  });
                }
              })
              .catch(error => console.warn('Validation YouTube échouée:', error));
          }

          const { data, error } = await supabase
            .from('movies')
            .insert({
              title: movieData.title.trim(),
              description: movieData.description?.trim() || null,
              youtubeid: movieData.youtubeid || null,
              playlistid: movieData.playlistid || null,
              poster: movieData.poster || null,
              type: movieData.type || 'video',
              category: movieData.category || null,
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Erreur Supabase: ${error.message}`);
          }

          if (data) {
            const newMovie: Movie = {
              id: data.id,
              title: data.title,
              description: data.description || undefined,
              youtubeid: data.youtubeid || undefined,
              playlistid: data.playlistid || undefined,
              poster: data.poster || undefined,
              type: data.type || 'video',
              category: data.category || undefined,
              createdAt: data.created_at,
            };

            set(state => ({
              movies: [newMovie, ...state.movies],
            }));

            console.log('Film ajouté avec succès:', newMovie);
            toast.success('Film ajouté avec succès !', {
              description: `"${newMovie.title}" est maintenant dans votre collection.`,
              action: {
                label: 'Regarder',
                onClick: () => get().setCurrentMovie(newMovie),
              },
            });
          }
        } catch (err) {
          const errorMessage = `Échec de l'ajout du film: ${
            err instanceof Error ? err.message : 'Erreur inconnue'
          }`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de l'ajout", {
            description: "Le film n'a pas pu être ajouté.",
          });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * CORRECTION 6: Gestion optimisée de l'historique
       */
      addToWatchHistory: (movieId) => {
        set(state => {
          // Éviter les doublons et limiter l'historique
          const filteredHistory = state.watchHistory.filter(id => id !== movieId);
          const newHistory = [movieId, ...filteredHistory].slice(0, 100);
          
          console.log('Film ajouté à l\'historique:', movieId);
          return { watchHistory: newHistory };
        });
      },

      /**
       * CORRECTION 7: Gestion améliorée des embeds bloqués
       */
      markAsEmbedBlocked: (youtubeId) => {
        set(state => {
          if (state.embedBlocked.includes(youtubeId)) return state;
          
          console.log('Embed marqué comme bloqué:', youtubeId);
          return {
            embedBlocked: [...state.embedBlocked, youtubeId],
          };
        });
      },

      isEmbedBlocked: (youtubeId) => {
        return get().embedBlocked.includes(youtubeId);
      },

      /**
       * Validation d'embed avec mise en cache
       */
      validateMovieEmbed: async (movieId) => {
        const movie = get().movies.find(m => m.id === movieId);
        if (!movie?.youtubeid) return false;

        // Vérifier le cache d'abord
        if (get().isEmbedBlocked(movie.youtubeid)) {
          return false;
        }

        try {
          const validation = await validateYouTubeEmbed(movie.youtubeid);
          if (!validation.canEmbed) {
            get().markAsEmbedBlocked(movie.youtubeid);
            return false;
          }
          
          // Retirer du cache des bloqués si maintenant valide
          set(state => ({
            embedBlocked: state.embedBlocked.filter(id => id !== movie.youtubeid),
          }));
          return true;
        } catch (error) {
          console.error('Erreur validation embed:', error);
          return false;
        }
      },

      updateMovie: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('movies')
            .update({
              ...updates,
              title: updates.title?.trim(),
              description: updates.description?.trim() || null,
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw new Error(`Erreur Supabase: ${error.message}`);

          if (data) {
            const updatedMovie: Movie = {
              id: data.id,
              title: data.title,
              description: data.description || undefined,
              youtubeid: data.youtubeid || undefined,
              playlistid: data.playlistid || undefined,
              poster: data.poster || undefined,
              type: data.type || 'video',
              category: data.category || undefined,
              createdAt: data.created_at,
            };

            set(state => ({
              movies: state.movies.map(movie =>
                movie.id === id ? updatedMovie : movie
              ),
              currentMovie: state.currentMovie?.id === id ? updatedMovie : state.currentMovie,
            }));

            toast.success('Film mis à jour avec succès !');
          }
        } catch (err) {
          const errorMessage = `Échec de la mise à jour: ${
            err instanceof Error ? err.message : 'Erreur inconnue'
          }`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error('Échec de la mise à jour');
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      deleteMovie: async (id) => {
        const movieToDelete = get().movies.find(m => m.id === id);
        if (!movieToDelete) return;

        set({ loading: true, error: null });
        try {
          const { error } = await supabase.from('movies').delete().eq('id', id);
          if (error) throw new Error(`Erreur Supabase: ${error.message}`);

          set(state => ({
            movies: state.movies.filter(movie => movie.id !== id),
            favorites: state.favorites.filter(fav => fav !== id),
            watchHistory: state.watchHistory.filter(hist => hist !== id),
            embedBlocked: state.embedBlocked.filter(blocked => 
              blocked !== movieToDelete.youtubeid
            ),
            currentMovie: state.currentMovie?.id === id ? null : state.currentMovie,
          }));

          toast.success(`"${movieToDelete.title}" supprimé avec succès !`);
        } catch (err) {
          const errorMessage = `Échec de la suppression: ${
            err instanceof Error ? err.message : 'Erreur inconnue'
          }`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error('Échec de la suppression');
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      toggleFavorite: (movieId) => {
        set(state => {
          const isFavorite = state.favorites.includes(movieId);
          const movie = state.movies.find(m => m.id === movieId);
          if (!movie) return state;

          const newFavorites = isFavorite
            ? state.favorites.filter(id => id !== movieId)
            : [...state.favorites, movieId];

          toast.success(
            isFavorite 
              ? `"${movie.title}" retiré des favoris`
              : `"${movie.title}" ajouté aux favoris ⭐`
          );

          return { favorites: newFavorites };
        });
      },

      addToWatchHistory: (movieId) => {
        set(state => {
          const newHistory = [movieId, ...state.watchHistory.filter(id => id !== movieId)];
          return {
            watchHistory: newHistory.slice(0, 100), // Limite augmentée
          };
        });
      },

      clearWatchHistory: () => {
        set({ watchHistory: [] });
        toast.success('Historique effacé');
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSorting: (sortBy, order) => {
        set({ sortBy, sortOrder: order });
      },

      markAsEmbedBlocked: (youtubeId) => {
        set(state => {
          if (state.embedBlocked.includes(youtubeId)) return state;
          console.log('Marquage embed bloqué:', youtubeId);
          return {
            embedBlocked: [...state.embedBlocked, youtubeId],
          };
        });
      },

      isEmbedBlocked: (youtubeId) => {
        return get().embedBlocked.includes(youtubeId);
      },

      validateMovieEmbed: async (movieId) => {
        const movie = get().movies.find(m => m.id === movieId);
        if (!movie?.youtubeid) return false;

        if (get().isEmbedBlocked(movie.youtubeid)) {
          return false;
        }

        try {
          const validation = await validateYouTubeEmbed(movie.youtubeid);
          if (!validation.canEmbed) {
            get().markAsEmbedBlocked(movie.youtubeid);
            return false;
          }
          
          set(state => ({
            embedBlocked: state.embedBlocked.filter(id => id !== movie.youtubeid),
          }));
          return true;
        } catch (error) {
          console.error('Erreur validation embed:', error);
          return false;
        }
      },

      /**
       * CORRECTION 8: Filtrage optimisé avec performance
       */
      getFilteredMovies: (category) => {
        const state = get();
        let filtered = [...state.movies]; // Copie pour éviter les mutations

        if (category && category !== 'All') {
          filtered = filtered.filter(movie => movie.category === category);
        }

        if (state.searchQuery?.trim()) {
          const query = state.searchQuery.toLowerCase().trim();
          filtered = filtered.filter(movie =>
            movie.title.toLowerCase().includes(query) ||
            movie.description?.toLowerCase().includes(query) ||
            movie.category?.toLowerCase().includes(query)
          );
        }

        // Tri optimisé
        filtered.sort((a, b) => {
          let comparison = 0;
          
          switch (state.sortBy) {
            case 'title':
              comparison = a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
              break;
            case 'date':
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              comparison = dateB - dateA; // Plus récent en premier par défaut
              break;
            case 'category':
              comparison = (a.category || 'ZZZ').localeCompare(b.category || 'ZZZ');
              break;
          }
          
          return state.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
      },

      getFavoriteMovies: () => {
        const state = get();
        return state.movies.filter(movie => state.favorites.includes(movie.id));
      },

      getRecentMovies: (limit = 5) => {
        return get().movies
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },

      duplicateMovie: async (id) => {
        const originalMovie = get().movies.find(m => m.id === id);
        if (!originalMovie) {
          toast.error('Film original non trouvé');
          return;
        }

        const duplicateData: MovieInsert = {
          title: `${originalMovie.title} (Copie)`,
          description: originalMovie.description,
          youtubeid: originalMovie.youtubeid,
          playlistid: originalMovie.playlistid,
          poster: originalMovie.poster,
          type: originalMovie.type,
          category: originalMovie.category,
        };
        
        await get().addMovie(duplicateData);
      },

      /**
       * CORRECTION 9: Statistiques avec protection contre les erreurs
       */
      getMovieStats: () => {
        const state = get();
        const movies = state.movies || [];
        
        const totalMovies = movies.filter(m => m.type === 'video').length;
        const totalPlaylists = movies.filter(m => m.type === 'playlist').length;

        const categoriesCount = movies.reduce((acc, movie) => {
          const category = movie.category || 'Non classé';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostWatchedCategory = Object.entries(categoriesCount)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Aucune';
        
        return {
          totalMovies,
          totalPlaylists,
          categoriesCount,
          mostWatchedCategory,
          recentlyWatchedCount: state.watchHistory.length,
          embedBlockedCount: state.embedBlocked.length,
        };
      },
    }),
    {
      name: 'movie-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        watchHistory: state.watchHistory,
        embedBlocked: state.embedBlocked,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
      // CORRECTION 10: Gestion d'erreur de sérialisation
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Store réhydraté avec:', {
            favorites: state.favorites?.length || 0,
            watchHistory: state.watchHistory?.length || 0,
            embedBlocked: state.embedBlocked?.length || 0
          });
        }
      },
    }
  )
);