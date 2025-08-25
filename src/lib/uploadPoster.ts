// src/lib/uploadPoster.ts
import { supabase } from "@/lib/supabaseClient"

export async function uploadPoster(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from("movie-posters")
    .upload(fileName, file)

  if (error) {
    console.error("❌ Erreur upload poster:", error.message)
    return null
  }

  // Récupérer l’URL publique
  const { data: publicUrl } = supabase.storage
    .from("movie-posters")
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}