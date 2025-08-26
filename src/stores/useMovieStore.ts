// src/stores/useMovieStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Movie, MovieInsert } from "@/types/movie";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Interface pour l'état du store.
 * Ajout des états de chargement et d'erreur pour un meilleur feedback utilisateur.
 */
type MovieStore = {
  movies: Movie[];
  currentMovie: Movie | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentMovie: (movie: Movie | null) => void;
  fetchMovies: () => Promise<void>;
  addMovie: (movie: MovieInsert) => Promise<void>;
  updateMovie: (id: string, updates: Partial<MovieInsert>) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
};

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      movies: [],
      currentMovie: null,
      loading: false,
      error: null,

      /**
       * Définit le film actuellement sélectionné.
       */
      setCurrentMovie: (movie) => {
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
            // Mapper les noms de colonnes Supabase vers nos types TypeScript
            const movies: Movie[] = data.map(row => ({
              id: row.id,
              title: row.title,
              description: row.description || undefined,
              youtubeid: row.youtubeid || undefined, // Respecter la casse
              playlistid: row.playlistid || undefined, // Respecter la casse  
              poster: row.poster || undefined,
              type: row.type || 'video',
              category: row.category || undefined,
              createdAt: row.created_at,
            }));
            
            set({ movies });
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
       * Ajoute un nouveau film à la base de données et au store.
       */
      addMovie: async (movieData) => {
        set({ loading: true, error: null });
        try {
          // Mapper les champs TypeScript vers les colonnes Supabase
          const supabaseData = {
            title: movieData.title,
            description: movieData.description || null,
            youtubeid: movieData.youtubeid || null, // Respecter la casse
            playlistid: movieData.playlistid || null, // Respecter la casse
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
            // Mapper la réponse Supabase vers notre type Movie
            const newMovie: Movie = {
              id: data.id,
              title: data.title,
              description: data.description || undefined,
              youtubeid: data.youtubeid || undefined, // Respecter la casse
              playlistid: data.playlistid || undefined, // Respecter la casse
              poster: data.poster || undefined,
              type: data.type || 'video',
              category: data.category || undefined,
              createdAt: data.created_at,
            };
            
            set({ movies: [newMovie, ...get().movies] });
            toast.success("Film ajouté avec succès !");
          }
        } catch (err) {
          const errorMessage = `Échec de l'ajout du film: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de l'ajout", {
            description: "Le film n'a pas pu être ajouté."
          });
          throw err; // Relancer l'erreur pour que le composant puisse la gérer
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
            youtubeid: updates.youtubeid || null, // Respecter la casse
            playlistid: updates.playlistid || null, // Respecter la casse
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
              youtubeid: data.youtubeid || undefined, // Respecter la casse
              playlistid: data.playlistid || undefined, // Respecter la casse
              poster: data.poster || undefined,
              type: data.type || 'video',
              category: data.category || undefined,
              createdAt: data.created_at,
            };
            
            set({
              movies: get().movies.map(movie => 
                movie.id === id ? updatedMovie : movie
              )
            });
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
       * Supprime un film de la base de données et du store.
       */
      deleteMovie: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from("movies")
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set({
            movies: get().movies.filter(movie => movie.id !== id),
            currentMovie: get().currentMovie?.id === id ? null : get().currentMovie
          });
          toast.success("Film supprimé avec succès !");
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
    }),
    {
      name: "movie-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentMovie: state.currentMovie,
      }),
    }
  )
);