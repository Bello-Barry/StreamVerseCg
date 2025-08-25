"use client"

import { useEffect, useState } from "react"
import { useMovieStore } from "@/stores/useMovieStore"
import { Movie } from "@/types/movie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { uploadPoster } from "@/lib/uploadPoster"
import { getYoutubeTitle } from "@/lib/getYoutubeTitle"
import { getYoutubeThumbnail } from "@/lib/getYoutubeThumbnail"

export default function TorrentsPage()() {
  const { movies, currentMovie, setCurrentMovie, fetchMovies, addMovie } = useMovieStore()
  const [newUrl, setNewUrl] = useState("")
  const [posterFile, setPosterFile] = useState<File | null>(null)

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const handleAdd = async () => {
    if (!newUrl) return

    // 🔹 Récupération du titre
    const title = (await getYoutubeTitle(newUrl)) || "Film ajouté"

    let movieData: Partial<Movie> = { title }

    // 🔹 Cas vidéo
    const videoMatch = newUrl.match(/v=([^&]+)/)
    if (videoMatch) {
      movieData = { ...movieData, youtubeId: videoMatch[1], type: "video" }
    }

    // 🔹 Cas playlist
    const playlistMatch = newUrl.match(/list=([^&]+)/)
    if (playlistMatch) {
      movieData = { ...movieData, playlistId: playlistMatch[1], type: "playlist" }
    }

    if (!movieData.youtubeId && !movieData.playlistId) {
      return alert("Lien YouTube invalide")
    }

    // 🔹 Upload poster si fourni
    if (posterFile) {
      const url = await uploadPoster(posterFile)
      if (url) movieData.poster = url
    }

    // 🔹 Sinon fallback miniature YouTube
    if (!movieData.poster) {
      movieData.poster = getYoutubeThumbnail(movieData.youtubeId, movieData.playlistId) || undefined
    }

    await addMovie(movieData as Omit<Movie, "id" | "createdAt">)
    setNewUrl("")
    setPosterFile(null)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">🎬 Films & Séries</h1>

      {/* Ajouter */}
      <div className="space-y-2">
        <Input
          placeholder="Coller un lien YouTube (vidéo ou playlist)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
        />
        <Button onClick={handleAdd}>Ajouter</Button>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {movies.map((movie: Movie) => (
          <Card
            key={movie.id}
            className="cursor-pointer hover:shadow-lg"
            onClick={() => setCurrentMovie(movie)}
          >
            <CardContent className="p-2">
              <img
                src={
                  movie.poster ||
                  getYoutubeThumbnail(movie.youtubeId, movie.playlistId) ||
                  "/placeholder.png"
                }
                alt={movie.title}
                className="rounded-xl aspect-video object-cover w-full"
              />
              <p className="mt-2 text-sm font-medium">{movie.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Player */}
      {currentMovie && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">{currentMovie.title}</h2>
          <iframe
            className="w-full aspect-video rounded-2xl"
            src={
              currentMovie.type === "playlist"
                ? `https://www.youtube.com/embed/videoseries?list=${currentMovie.playlistId}`
                : `https://www.youtube.com/embed/${currentMovie.youtubeId}`
            }
            allowFullScreen
          />
          <Button
            className="mt-2"
            variant="secondary"
            onClick={() => setCurrentMovie(null)}
          >
            Fermer
          </Button>
        </div>
      )}
    </div>
  )
}