// src/lib/youtubeValidation.ts

/**
 * Valide si une vidéo YouTube peut être intégrée
 */
export async function validateYouTubeEmbed(videoId: string): Promise<{
  canEmbed: boolean;
  reason?: string;
}> {
  try {
    // Essayer d'abord avec l'API oEmbed de YouTube
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oEmbedUrl);
    
    if (response.ok) {
      return { canEmbed: true };
    } else if (response.status === 401) {
      return { 
        canEmbed: false, 
        reason: "Vidéo privée ou restreinte" 
      };
    } else if (response.status === 404) {
      return { 
        canEmbed: false, 
        reason: "Vidéo introuvable" 
      };
    } else {
      return { 
        canEmbed: false, 
        reason: "Intégration désactivée par l'auteur" 
      };
    }
  } catch (error) {
    console.error('Erreur validation YouTube:', error);
    return { 
      canEmbed: false, 
      reason: "Impossible de vérifier la disponibilité" 
    };
  }
}

/**
 * Extrait l'ID vidéo et playlist d'une URL YouTube
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
 * Génère des URLs alternatives pour contourner les blocages
 */
export function generateAlternativeUrls(videoId: string, playlistId?: string) {
  const baseParams = 'rel=0&modestbranding=1&showinfo=0&controls=1';
  
  if (playlistId) {
    return [
      `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&${baseParams}`,
      `https://www.youtube.com/embed/videoseries?list=${playlistId}&${baseParams}`,
    ];
  } else {
    return [
      `https://www.youtube-nocookie.com/embed/${videoId}?${baseParams}`,
      `https://www.youtube.com/embed/${videoId}?${baseParams}`,
      `https://www.youtube.com/embed/${videoId}?${baseParams}&origin=${window.location.origin}`,
    ];
  }
}

/**
 * Vérifie si l'intégration est bloquée et suggère des alternatives
 */
export function handleEmbedError(videoId: string, playlistId?: string) {
  const directUrl = playlistId 
    ? `https://www.youtube.com/playlist?list=${playlistId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
    
  return {
    directUrl,
    suggestions: [
      "Ouvrir sur YouTube",
      "Essayer dans un nouvel onglet",
      "Copier le lien pour partager"
    ]
  };
}