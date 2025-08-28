'use server';

import { google } from 'googleapis';
import { env } from '@/env.mjs'; // Assurez-vous que l'importation de `env` est correcte
import { Video } from '@/types/video';

// Initialisation de l'API YouTube
const youtube = google.youtube({
  version: 'v3',
  auth: env.YOUTUBE_API_KEY,
});

/**
 * Récupère le titre d'une vidéo ou d'une playlist YouTube.
 * @param url L'URL de la vidéo ou de la playlist.
 * @returns Le titre du contenu.
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
 * Valide si une vidéo YouTube peut être intégrée et renvoie un message détaillé.
 * @param videoId L'ID de la vidéo.
 * @returns Un objet indiquant si l'intégration est possible et la raison le cas échéant.
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

    // Vérifie si l'intégration est autorisée par l'auteur
    if (video.status?.embeddable === false) {
      return {
        canEmbed: false,
        reason: "L'intégration a été désactivée par l'auteur de la vidéo.",
      };
    }

    // Vérifie les restrictions de pays
    const regionRestriction = video.contentDetails?.regionRestriction;
    if (regionRestriction?.blocked && regionRestriction.blocked.length > 0) {
      return {
        canEmbed: true, // L'intégration est techniquement possible, mais restreinte
        reason: 'Vidéo bloquée dans certaines régions.',
      };
    }

    if (regionRestriction?.allowed && regionRestriction.allowed.length > 0) {
      return {
        canEmbed: true,
        reason: 'Vidéo restreinte à certaines régions.',
      };
    }

    // Gère le cas des vidéos privées ou non listées
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
 