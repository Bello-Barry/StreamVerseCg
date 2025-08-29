// src/stores/useMovieStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Movie, MovieInsert } from "@/types/movie";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type MovieStore = {
  movies: Movie[];
  currentMovie: Movie | null;
  loading: boolean;
  error: string | null;

  setCurrentMovie: (movie: Movie | null) => void;
  fetchMovies: () => Promise<void>;
  addMovie: (movie: MovieInsert) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
};

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      movies: [],
      currentMovie: null,
      loading: false,
      error: null,

      setCurrentMovie: (movie) => set({ currentMovie: movie }),

      fetchMovies: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("movies")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;

          if (data) {
            const movies: Movie[] = data.map(row => ({
              id: row.id,
              title: row.title,
              description: row.description || undefined,
              youtubeid: row.youtubeid || undefined,
              playlistid: row.playlistid || undefined,
              poster: row.poster || undefined,
              type: row.type || "video",
              category: row.category || "Autre",
              createdAt: row.created_at,
            }));
            set({ movies });
          }
        } catch (err) {
          set({ error: "Erreur lors du chargement des films" });
        } finally {
          set({ loading: false });
        }
      },

      addMovie: async (movieData) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from("movies")
            .insert(movieData)
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newMovie: Movie = {
              id: data.id,
              title: data.title,
              description: data.description || undefined,
              youtubeid: data.youtubeid || undefined,
              playlistid: data.playlistid || undefined,
              poster: data.poster || undefined,
              type: data.type || "video",
              category: data.category || "Autre",
              createdAt: data.created_at,
            };
            set(state => ({ movies: [newMovie, ...state.movies] }));
            toast.success(`"${newMovie.title}" ajouté avec succès !`);
          }
        } catch (err) {
          toast.error("Erreur lors de l'ajout du film");
        } finally {
          set({ loading: false });
        }
      },

      deleteMovie: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.from("movies").delete().eq("id", id);
          if (error) throw error;
          set(state => ({
            movies: state.movies.filter(m => m.id !== id),
            currentMovie: state.currentMovie?.id === id ? null : state.currentMovie,
          }));
          toast.success("Film supprimé");
        } catch (err) {
          toast.error("Erreur lors de la suppression");
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "movie-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);