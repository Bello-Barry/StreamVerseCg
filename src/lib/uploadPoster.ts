import { supabase } from "@/lib/supabaseClient";

/**
 * Charge un fichier image dans le bucket de stockage Supabase 'movie-posters'.
 * Renomme le fichier pour éviter les conflits et retourne l'URL publique.
 * @param file Le fichier image à uploader.
 * @returns L'URL publique de l'image ou null en cas d'erreur.
 * @throws {Error} En cas d'échec de l'upload ou de validation.
 */
export async function uploadPoster(file: File): Promise<string | null> {
  const MAX_FILE_SIZE_MB = 5;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  try {
    // 🛡️ Étape 1 : Validation du fichier
    if (!file) {
      throw new Error("Aucun fichier n'a été sélectionné.");
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("Type de fichier non supporté. Veuillez choisir une image au format JPEG, PNG ou WebP.");
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Le fichier est trop grand. La taille maximale autorisée est de ${MAX_FILE_SIZE_MB} Mo.`);
    }

    // 💡 Étape 2 : Création d'un nom de fichier unique
    const fileName = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name}`;
    
    // 🚀 Étape 3 : Téléchargement du fichier vers le bucket 'movie-posters'
    const { error: uploadError } = await supabase.storage
      .from("movie-posters")
      .upload(fileName, file);

    if (uploadError) {
      console.error("❌ Erreur d'upload Supabase:", uploadError.message);
      throw new Error(`Échec de l'upload: ${uploadError.message}`);
    }

    // ✨ Étape 4 : Récupération de l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from("movie-posters")
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Impossible d'obtenir l'URL publique du fichier uploadé.");
    }

    return publicUrlData.publicUrl;

  } catch (err) {
    // Centralisation et affichage des erreurs dans la console
    const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors de l\'upload.';
    console.error("❌ Erreur lors de l'upload du poster:", errorMessage);
    
    // Rejeter la promesse avec l'erreur pour que le composant appelant puisse la gérer
    throw new Error(errorMessage);
  }
}
