// src/lib/youtubeValidation.ts

import { google } from 'googleapis';
import NodeCache from 'node-cache';

/**
 * Cache mémoire pour éviter de solliciter trop l’API YouTube
 */
const cache = new NodeCache({ stdTTL: 60 * 5 }); // 5 minutes
const CACHE_EXPIRY_MS = 1000 * 60 * 5;

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * Valide si une vidéo YouTube peut être intégrée
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
      part: ['status'],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      return { canEmbed: false, reason: 'Vidéo non trouvée.' };
    }

    // 🚨 Blocage uniquement si le propriétaire interdit l’intégration
    if (video.status?.embeddable === false) {
      return {
        canEmbed: false,
        reason: 'L’intégration est désactivée par le propriétaire.',
      };
    }

    // ✅ Ne bloque PAS sur regionRestriction → simple avertissement
    const result = { canEmbed: true };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      console.error('Erreur API YouTube:', error.response.data.error.message);
      return {
        canEmbed: false,
        reason: `Erreur API: ${error.response.data.error.message}`,
      };
    }
    console.error('Erreur de validation:', error);
    return { canEmbed: false, reason: 'Erreur technique.' };
  }
}