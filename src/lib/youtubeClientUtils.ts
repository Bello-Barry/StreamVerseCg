// Fichier: src/lib/youtubeClientUtils.ts

/**
 * Extrait l'ID vidéo et playlist d'une URL YouTube.
 * Fonctionne côté client.
 */
export function extractYouTubeIds(url: string): {
  videoId?: string;
  playlistId?: string;
  isValid: boolean;
} {
  try {
    const urlObj = new URL(url);
    
    // Patterns pour différents formats d'URL YouTube
    const videoPatterns = [
      /(?:youtu\.be\/)([^?&]+)/,
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtube\.com\/embed\/)([^?&]+)/,
      /(?:youtube\.com\/v\/)([^?&]+)/
    ];
    
    const playlistPattern = /[?&]list=([^&]+)/;
    
    let videoId: string | undefined;
    let playlistId: string | undefined;
    
    // Recherche de l'ID vidéo
    for (const pattern of videoPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }
    
    // Recherche de l'ID playlist
    const playlistMatch = url.match(playlistPattern);
    if (playlistMatch && playlistMatch[1]) {
      playlistId = playlistMatch[1];
    }
    
    return {
      videoId,
      playlistId,
      isValid: !!(videoId || playlistId)
    };
  } catch (error) {
    return {
      isValid: false
    };
  }
}

/**
 * Génère l'URL d'une miniature YouTube.
 * Fonctionne côté client.
 * @param videoId L'ID de la vidéo YouTube.
 */
export function getYoutubeThumbnail(videoId: string): string | null {
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
