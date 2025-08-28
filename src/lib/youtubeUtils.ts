// Ce fichier contient uniquement des utilitaires qui n'ont pas besoin d'appels API.

/**
 * Extrait l'ID de la vidéo ou de la playlist d'une URL YouTube.
 * @param url L'URL YouTube à analyser.
 * @returns Un objet contenant les IDs et un statut de validité.
 */
export function extractYouTubeIds(url: string): {
  videoId?: string;
  playlistId?: string;
  isValid: boolean;
} {
  try {
    const videoRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*&v=))([^&?]+)/;
    const playlistRegex = /(?:list=)([a-zA-Z0-9_-]+)/;

    const videoMatch = url.match(videoRegex);
    const playlistMatch = url.match(playlistRegex);

    if (videoMatch && videoMatch[1]) {
      return { videoId: videoMatch[1], isValid: true };
    }
    if (playlistMatch && playlistMatch[1]) {
      return { playlistId: playlistMatch[1], isValid: true };
    }

    return { isValid: false };
  } catch (error) {
    console.error('Erreur lors de l\'extraction des IDs YouTube:', error);
    return { isValid: false };
  }
}

/**
 * Génère l'URL d'une miniature YouTube à partir d'un ID de vidéo.
 * @param videoId L'ID de la vidéo.
 * @returns L'URL de la miniature.
 */
export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
