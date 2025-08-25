// src/types/movie.ts
export type MovieType = "video" | "playlist"

export type MovieCategory =
  | "Action"
  | "Comédie"
  | "Drame"
  | "Horreur"
  | "Animation"
  | "Série"
  | "Documentaire"
  | "Autre"

export interface Movie {
  id: string
  title: string
  type: MovieType
  youtubeId?: string
  playlistId?: string
  poster?: string
  category: MovieCategory
  createdAt: string
}