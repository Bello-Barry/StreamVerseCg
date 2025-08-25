// src/stores/useMovieStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Movie } from "@/types/movie";
import { supabase } from "@/lib/supabaseClient";
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
  addMovie: (movie: Omit<Movie, "id" | "createdAt">) => Promise<void>;
};

export const useMovieStore = create<MovieStore>()(
  // Utilisation de `sessionStorage` car les films peuvent être nombreux et ne nécessitent pas une persistance infinie.
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
            set({ movies: data as Movie[] });
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
      addMovie: async (movie) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("movies")
            .insert(movie)
            .select()
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            // Met à jour l'état en ajoutant le nouveau film au début de la liste
            set({ movies: [data as Movie, ...get().movies] });
            toast.success("Film ajouté avec succès !");
          }
        } catch (err) {
          const errorMessage = `Échec de l'ajout du film: ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
          console.error(errorMessage, err);
          set({ error: errorMessage });
          toast.error("Échec de l'ajout", {
            description: "Le film n'a pas pu être ajouté."
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "movie-store",
      storage: createJSONStorage(() => sessionStorage),
      // Permet de ne stocker que certaines parties du store si nécessaire,
      // mais ici, le store complet est pertinent pour la session.
      partialize: (state) => ({
        currentMovie: state.currentMovie,
      }),
    }
  )
);
