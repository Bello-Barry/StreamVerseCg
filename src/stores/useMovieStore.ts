// src/stores/useMovieStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Movie, MovieInsert } from "@/types/movie";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { validateYouTubeEmbed, extractYouTubeIds } from "@/lib/youtubeValidation";

/**
 * Interface pour l'état du store avec nouvelles fonctionnalités.
 */
type MovieStore = {
  movies: Movie[];
  currentMovie: Movie | null;
  favorites: string[]; // IDs des films favoris
  watchHistory: string[]; // IDs des films regardés
  recentlyAdded: Movie[]; // Films récemment ajoutés
  embedBlocked: string[]; // IDs des films avec embed bloqué
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'title' | 'date' | 'category';
  sortOrder: 'asc' | 'desc';
  
  // Actions existantes
  setCurrentMovie: (movie: Movie | null) => void;
  fetchMovies: () => Promise<void>;
  addMovie: (movie: MovieInsert) => Promise<void>;
  updateMovie: (id: string, updates: Partial<MovieInsert>) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
  
  // Nouvelles actions
  toggleFavorite: (movieId: string) => void;
  addToWatchHistory: (movieId: string) => void;
  clearWatchHistory: () => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: 'title' | 'date' | 'category', order: 'asc' | 'desc') => void;
  getFilteredMovies: (category?: string) => Movie[];
  getFavoriteMovies: () => Movie[];
  getRecentMovies: (limit?: number) => Movie[];
  duplicateMovie: (id: string) => Promise<void>;
  
  // Gestion des erreurs d'embed
  markAsEmbedBlocked: (movieId: string) => void;
  isEmbedBlocked: (movieId: string) => boolean;
  validateMovieEmbed: (movieId: string) => Promise<boolean>;
  
  // Analytics
  getMovieStats: () => {
    totalMovies: number;
    totalPlaylists: number;
    categoriesCount: Record<string, number>;
    mostWatchedCategory: string;
    recentlyWatchedCount: number;
    embedBlockedCount: number;
  };
};

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      movies: [],
      currentMovie: null,
      favorites: [],
      watchHistory: [],
      recentlyAdded: [],
      embedBlocked: [],
      loading: false,
      error: null,
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',

      /**
       * Définit le film actuellement sélectionné et l'ajoute à l'historique.
       */
      setCurrentMovie: (movie) => {
        if (movie) {
          get().addToWatchHistory(movie.id);
        }
        set({ currentMovie: movie });
      },

      /**
       * Récupère la liste des films depuis la base de données Supabase.
       */
      fetchMovies: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          if (data) {
            const movies: Movie[] = data.map(row => ({
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
            
            set({ 
              movies,
              recentlyAdded: movies.slice(0, 10) // 10 films les plus récents
            });
          }
        } catch (err) {
          const errorMessage = `Échec de la récupération des films: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Erreur de chargement", {
            description: "Impossible de récupérer la liste des films."
          });
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Ajoute un nouveau film avec validation étendue et vérification d'embed.
       */
      addMovie: async (movieData) => {
        set({ loading: true, error: null });
        try {
          // Vérification des doublons
          const existingMovies = get().movies;
          const isDuplicate = existingMovies.some(movie => 
            movie.youtubeid === movieData.youtubeid || 
            movie.playlistid === movieData.playlistid ||
            movie.title.toLowerCase() === movieData.title.toLowerCase()
          );

          if (isDuplicate) {
            toast.warning("Contenu déjà existant", {
              description: "Ce film ou cette série existe déjà dans votre collection."
            });
            set({ loading: false });
            return;
          }

          // Validation de l'URL YouTube si fournie
          if (movieData.youtubeid) {
            try {
              const validation = await validateYouTubeEmbed(movieData.youtubeid);
              if (!validation.canEmbed) {
                toast.warning("Avertissement d'intégration", {
                  description: `${validation.reason}. Le contenu sera ajouté mais pourrait ne pas être lisible directement.`
                });
                // Marquer comme potentiellement bloqué
                setTimeout(() => {
                  const newMovieInState = get().movies.find(m => m.youtubeid === movieData.youtubeid);
                  if (newMovieInState) {
                    get().markAsEmbedBlocked(newMovieInState.id);
                  }
                }, 1000);
              }
            } catch (error) {
              console.warn('Validation YouTube échouée:', error);
            }
          }

          const supabaseData = {
            title: movieData.title,
            description: movieData.description || null,
            youtubeid: movieData.youtubeid || null,
            playlistid: movieData.playlistid || null,
            poster: movieData.poster || null,
            type: movieData.type,
            category: movieData.category || null,
          };

          const { data, error } = await supabase
            .from("movies")
            .insert(supabaseData)
            .select()
            .single();

          if (error) {
            throw error;
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
              recentlyAdded: [newMovie, ...state.recentlyAdded.slice(0, 9)]
            }));
            
            toast.success("Film ajouté avec succès !", {
              description: `"${newMovie.title}" est maintenant dans votre collection.`,
              action: {
                label: "Voir",
                onClick: () => get().setCurrentMovie(newMovie)
              }
            });
          }
        } catch (err) {
          const errorMessage = `Échec de l'ajout du film: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de l'ajout", {
            description: "Le film n'a pas pu être ajouté."
          });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Met à jour un film existant.
       */
      updateMovie: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const supabaseUpdates = {
            title: updates.title,
            description: updates.description || null,
            youtubeid: updates.youtubeid || null,
            playlistid: updates.playlistid || null,
            poster: updates.poster || null,
            type: updates.type,
            category: updates.category || null,
          };

          const { data, error } = await supabase
            .from("movies")
            .update(supabaseUpdates)
            .eq('id', id)
            .select()
            .single();

          if (error) {
            throw error;
          }

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
              currentMovie: state.currentMovie?.id === id ? updatedMovie : state.currentMovie
            }));
            
            toast.success("Film mis à jour avec succès !");
          }
        } catch (err) {
          const errorMessage = `Échec de la mise à jour: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de la mise à jour", {
            description: "Le film n'a pas pu être mis à jour."
          });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Supprime un film avec confirmation.
       */
      deleteMovie: async (id) => {
        const movieToDelete = get().movies.find(m => m.id === id);
        if (!movieToDelete) return;

        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from("movies")
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            movies: state.movies.filter(movie => movie.id !== id),
            favorites: state.favorites.filter(fav => fav !== id),
            watchHistory: state.watchHistory.filter(hist => hist !== id),
            recentlyAdded: state.recentlyAdded.filter(movie => movie.id !== id),
            embedBlocked: state.embedBlocked.filter(blocked => blocked !== id),
            currentMovie: state.currentMovie?.id === id ? null : state.currentMovie
          }));
          
          toast.success(`"${movieToDelete.title}" supprimé avec succès !`);
        } catch (err) {
          const errorMessage = `Échec de la suppression: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de la suppression", {
            description: "Le film n'a pas pu être supprimé."
          });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Bascule le statut favori d'un film.
       */
      toggleFavorite: (movieId) => {
        set(state => {
          const isFavorite = state.favorites.includes(movieId);
          const movie = state.movies.find(m => m.id === movieId);
          
          if (isFavorite) {
            toast.info(`"${movie?.title}" retiré des favoris`);
            return {
              favorites: state.favorites.filter(id => id !== movieId)
            };
          } else {
            toast.success(`"${movie?.title}" ajouté aux favoris ⭐`);
            return {
              favorites: [...state.favorites, movieId]
            };
          }
        });
      },

      /**
       * Ajoute un film à l'historique de visionnage.
       */
      addToWatchHistory: (movieId) => {
        set(state => {
          const newHistory = [movieId, ...state.watchHistory.filter(id => id !== movieId)];
          return {
            watchHistory: newHistory.slice(0, 50) // Limite à 50 entrées
          };
        });
      },

      /**
       * Efface l'historique de visionnage.
       */
      clearWatchHistory: () => {
        set({ watchHistory: [] });
        toast.success("Historique effacé");
      },

      /**
       * Définit la requête de recherche.
       */
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      /**
       * Définit les paramètres de tri.
       */
      setSorting: (sortBy, order) => {
        set({ sortBy, sortOrder: order });
      },

      /**
       * Marque un film comme ayant l'embed bloqué.
       */
      markAsEmbedBlocked: (movieId) => {
        set(state => {
          if (state.embedBlocked.includes(movieId)) return state;
          
          return {
            embedBlocked: [...state.embedBlocked, movieId]
          };
        });
      },

      /**
       * Vérifie si l'embed d'un film est bloqué.
       */
      isEmbedBlocked: (movieId) => {
        return get().embedBlocked.includes(movieId);
      },

      /**
       * Valide si l'embed d'un film fonctionne.
       */
      validateMovieEmbed: async (movieId) => {
        const movie = get().movies.find(m => m.id === movieId);
        if (!movie || !movie.youtubeid) return false;

        try {
          const validation = await validateYouTubeEmbed(movie.youtubeid);
          if (!validation.canEmbed) {
            get().markAsEmbedBlocked(movieId);
            return false;
          }
          
          // Retirer de la liste des bloqués si la validation réussit
          set(state => ({
            embedBlocked: state.embedBlocked.filter(id => id !== movieId)
          }));
          return true;
        } catch (error) {
          console.error('Erreur validation embed:', error);
          return false;
        }
      },

      /**
       * Retourne les films filtrés selon les critères actuels.
       */
      getFilteredMovies: (category) => {
        const state = get();
        let filtered = state.movies;

        // Filtrage par catégorie
        if (category && category !== 'All') {
          filtered = filtered.filter(movie => movie.category === category);
        }

        // Filtrage par recherche
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(movie => 
            movie.title.toLowerCase().includes(query) ||
            movie.description?.toLowerCase().includes(query) ||
            movie.category?.toLowerCase().includes(query)
          );
        }

        // Tri
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (state.sortBy) {
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'date':
              comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              break;
            case 'category':
              comparison = (a.category || '').localeCompare(b.category || '');
              break;
          }
          return state.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
      },

      /**
       * Retourne les films favoris.
       */
      getFavoriteMovies: () => {
        const state = get();
        return state.movies.filter(movie => state.favorites.includes(movie.id));
      },

      /**
       * Retourne les films récents.
       */
      getRecentMovies: (limit = 5) => {
        return get().recentlyAdded.slice(0, limit);
      },

      /**
       * Duplique un film existant.
       */
      duplicateMovie: async (id) => {
        const state = get();
        const originalMovie = state.movies.find(m => m.id === id);
        if (!originalMovie) return;

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
       * Retourne les statistiques de la collection avec embed bloqué.
       */
      getMovieStats: () => {
        const state = get();
        const totalMovies = state.movies.filter(m => m.type === 'video').length;
        const totalPlaylists = state.movies.filter(m => m.type === 'playlist').length;
        
        const categoriesCount = state.movies.reduce((acc, movie) => {
          const category = movie.category || 'Non classé';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostWatchedCategory = Object.entries(categoriesCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucune';

        const recentlyWatchedCount = state.watchHistory.length;
        const embedBlockedCount = state.embedBlocked.length;

        return {
          totalMovies,
          totalPlaylists,
          categoriesCount,
          mostWatchedCategory,
          recentlyWatchedCount,
          embedBlockedCount,
        };
      },
    }),
    {
      name: "movie-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentMovie: state.currentMovie,
        favorites: state.favorites,
        watchHistory: state.watchHistory,
        embedBlocked: state.embedBlocked,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);