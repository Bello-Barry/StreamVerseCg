// Fichier: src/env.mjs
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Le nom des variables d'environnement doit correspondre à celui de votre fichier .env
    YOUTUBE_API_KEY: z.string().min(1, 'YouTube API Key is required'),
  },
  client: {}, // Aucune variable côté client pour le moment
  runtimeEnv: {
    // Assurez-vous que le nom ici correspond aussi
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
  emptyStringAsUndefined: true,
});
