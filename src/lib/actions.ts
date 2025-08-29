// Fichier: src/lib/actions.ts
'use server';

import { google } from 'googleapis';
// L'import de env n'est plus nécessaire ici
// car process.env est disponible globalement sur le serveur.
import { Video } from '@/types/video';

// Initialisation de l'API YouTube.
// Utilisation directe de process.env
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * Récupère le titre d'une vidéo ou d'une playlist YouTube.
 * Ceci est une action serveur.
 */
export async function getYoutubeTitle(url: string): Promise<string | null> {
  const urlObj = new URL(url);
  const videoId = urlObj.searchParams.get('v');
  const playlistId = urlObj.searchParams.get('list');

  try {
    if (videoId) {
      const response = await youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
      });
      const title = response.data.items?.[0]?.snippet?.title;
      return title || null;
    }

    if (playlistId) {
      const response = await youtube.playlists.list({
        part: ['snippet'],
        id: [playlistId],
      });
      const title = response.data.items?.[0]?.snippet?.title;
      return title || null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du titre YouTube:', error);
  }
  return null;
}

/**
 * Valide si une vidéo YouTube peut être intégrée.
 * Ceci est une action serveur.
 */
export async function validateYouTubeEmbed(videoId: string): Promise<{
  canEmbed: boolean;
  reason?: string;
}> {
  try {
    const response = await youtube.videos.list({
      part: ['status', 'contentDetails'],
      id: [videoId],
    });

    const video = response.data.items?.[0];

    if (!video) {
      return { canEmbed: false, reason: 'Vidéo introuvable.' };
    }

    if (video.status?.embeddable === false) {
      return {
        canEmbed: false,
        reason: "L'intégration a été désactivée par l'auteur de la vidéo.",
      };
    }

    const regionRestriction = video.contentDetails?.regionRestriction;
    if (regionRestriction?.blocked && regionRestriction.blocked.length > 0) {
      return {
        canEmbed: true,
        reason: 'Vidéo bloquée dans certaines régions.',
      };
    }

    if (video.status?.privacyStatus !== 'public' && video.status?.privacyStatus !== 'unlisted') {
      return {
        canEmbed: false,
        reason: 'La vidéo est privée ou non listée.',
      };
    }

    return { canEmbed: true };
  } catch (error: any) {
      console.error('Erreur lors de la validation de la vidéo YouTube:', error.message);
      if (error.message.includes('API key not valid')) {
        return { canEmbed: false, reason: 'Clé API invalide.' };
      }
      return {
        canEmbed: false,
        reason: 'Une erreur est survenue lors de la vérification de la vidéo.',
      };
    }
}
