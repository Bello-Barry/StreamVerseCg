// src/lib/getYoutubeTitle.ts

/**
 * Interface pour la réponse attendue de l'API oEmbed de YouTube.
 * Permet d'assurer le typage des données retournées par l'API.
 */
interface YoutubeOembedResponse {
  title: string;
  author_name: string;
  author_url: string;
  type: string;
  version: string;
  provider_name: string;
  provider_url: string;
  width: number;
  height: number;
  html: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

/**
 * Récupère le titre d'une vidéo ou d'une playlist YouTube en utilisant l'API oEmbed.
 * Un timeout est mis en place pour éviter les blocages en cas de problème réseau.
 * @param url L'URL de la vidéo ou de la playlist YouTube.
 * @returns Le titre de la vidéo ou null si une erreur survient.
 */
export async function getYoutubeTitle(url: string): Promise<string | null> {
  // Création d'un AbortController pour gérer le timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const res = await fetch(oembedUrl, { signal: controller.signal });

    // En cas de réponse non-réussie, log l'erreur et retourne null
    if (!res.ok) {
      console.error(`❌ Erreur de l'API oEmbed YouTube (Statut: ${res.status}): ${res.statusText}`);
      return null;
    }

    const data: YoutubeOembedResponse = await res.json();
    
    // Si le titre est présent dans la réponse, le retourner
    return data?.title || null;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error("❌ La requête a été annulée en raison d'un timeout.");
    } else {
      console.error("❌ Erreur lors de la récupération du titre YouTube:", err);
    }
    return null;
  } finally {
    // S'assurer de nettoyer le timeout pour éviter les fuites de mémoire
    clearTimeout(timeoutId);
  }
}
