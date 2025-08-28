'use server'; // Indique à Next.js que ce fichier s'exécute uniquement sur le serveur.

import { google, youtube_v3 } from 'googleapis';
import { env } from '../../env.mjs';

// Initialisation de l'API YouTube Data
const youtube = google.youtube({
  version: 'v3',
  auth: env.YOUTUBE_API_KEY,
});

/**
 * Cache pour les résultats de l'API (pour économiser les quotas)
 * Utilisation de Map pour un accès rapide.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Récupère le titre d'une vidéo YouTube.
 * @param videoId L'ID de la vidéo.
 * @returns Le titre de la vidéo ou une chaîne vide en cas d'erreur.
 */
export async function getYoutubeTitle(videoId: string): Promise<string> {
  const cacheKey = `title_${videoId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
    return cachedData.data;
  }

  try {
    const response = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });

    const title = response.data.items?.[0]?.snippet?.title || '';
    cache.set(cacheKey, { data: title, timestamp: Date.now() });
    return title;
  } catch (error) {
    console.error('Erreur lors de la récupération du titre YouTube:', error);
    return '';
  }
}

/**
 * Valide si une vidéo YouTube est intégrable via l'API.
 * @param videoId L'ID de la vidéo à valider.
 * @returns Un objet indiquant si l'intégration est possible et la raison si elle ne l'est pas.
 */
export async function validateYouTubeEmbed(videoId: string): Promise<{
  canEmbed: boolean;
  reason?: string;
}> {
  const cacheKey = `embed_${videoId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
    return cachedData.data;
  }

  try {
    const response = await youtube.videos.list({
      part: ['status', 'contentDetails'],
      id: [videoId],
    });

    const video = response.data.items?.[0];

    if (!video) {
      return { canEmbed: false, reason: 'Vidéo non trouvée.' };
    }

    if (video.status?.embeddable === false) {
      return { canEmbed: false, reason: 'L\'intégration est désactivée par le propriétaire de la vidéo.' };
    }

    if (video.contentDetails?.regionRestriction) {
      return { canEmbed: false, reason: 'La vidéo est bloquée dans certaines régions.' };
    }

    const result = { canEmbed: true };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;

  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      console.error('Erreur API YouTube:', error.response.data.error.message);
      return { canEmbed: false, reason: `Erreur API: ${error.response.data.error.message}` };
    }
    console.error('Erreur de validation de la vidéo YouTube:', error);
    return { canEmbed: false, reason: 'Erreur technique lors de la vérification.' };
  }
}

