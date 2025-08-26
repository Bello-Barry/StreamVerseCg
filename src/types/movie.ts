// src/types/movie.ts

export interface Movie {
  id: string;
  title: string;
  description?: string;
  youtubeid?: string;
  playlistid?: string;
  poster?: string;
  type: 'video' | 'playlist';
  category?: 'Action' | 'Comédie' | 'Drame' | 'Horreur' | 'Animation' | 'Série' | 'Documentaire' | 'Autre';
  createdAt: string; // Correspond à created_at dans Supabase (timestamp)
}

// Type pour les données à insérer (sans id et createdAt)
export type MovieInsert = Omit<Movie, 'id' | 'createdAt'>;