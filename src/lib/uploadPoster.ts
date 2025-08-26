import { supabase } from "@/lib/supabase";

/**
 * Charge un fichier image dans le bucket de stockage Supabase 'movie-posters'.
 * Renomme le fichier pour éviter les conflits et retourne l'URL publique.
 * @param file Le fichier image à uploader.
 * @returns L'URL publique de l'image ou null en cas d'erreur.
 */
export async function uploadPoster(file: File): Promise<string | null> {
  const MAX_FILE_SIZE_MB = 5;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  try {
    // Validation du fichier
    if (!file) {
      throw new Error("Aucun fichier n'a été sélectionné.");
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error("Type de fichier non supporté. Veuillez choisir une image au format JPEG, PNG ou WebP.");
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Le fichier est trop grand. La taille maximale autorisée est de ${MAX_FILE_SIZE_MB} Mo.`);
    }

    // Création d'un nom de fichier unique et sécurisé
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    console.log('📤 Tentative d\'upload:', fileName, 'Taille:', (file.size / 1024).toFixed(2), 'KB');

    // Vérification que le bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la vérification des buckets:', bucketsError);
      throw new Error('Impossible de vérifier l\'existence du bucket de stockage.');
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'movie-posters');
    if (!bucketExists) {
      throw new Error('Le bucket "movie-posters" n\'existe pas. Veuillez le créer dans Supabase Storage.');
    }

    // Téléchargement du fichier
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("movie-posters")
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ Erreur d'upload Supabase:", uploadError);
      throw new Error(`Échec de l'upload: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error("Aucune donnée retournée après l'upload.");
    }

    console.log('✅ Upload réussi:', uploadData.path);

    // Récupération de l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from("movie-posters")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Impossible d'obtenir l'URL publique du fichier uploadé.");
    }

    console.log('🔗 URL publique générée:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors de l\'upload.';
    console.error("❌ Erreur lors de l'upload du poster:", errorMessage);
    
    // On retourne null au lieu de throw pour que le composant puisse continuer
    return null;
  }
}