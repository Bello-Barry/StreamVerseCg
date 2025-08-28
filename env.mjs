import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Schéma de validation pour les variables d'environnement côté serveur.
    // Les variables d'environnement ajoutées ici ne seront JAMAIS exposées côté client.
    YOUTUBE_API_KEY: z.string().min(1, 'YouTube API Key is required'),
    // Ajoutez ici d'autres variables d'environnement secrètes si nécessaire.
  },
  client: {
    // Schéma de validation pour les variables d'environnement côté client.
    // Ces variables DOIVENT être préfixées par NEXT_PUBLIC_ pour être exposées au navigateur.
    // Exemple: NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  },
  runtimeEnv: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
  // Pour Next.js >= 13.4.0
  emptyStringAsUndefined: true,
});
