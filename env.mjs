import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Spécifiez vos variables d'environnement côté serveur.
   * Elles ne sont disponibles que dans les Server Components et les API routes.
   * Elles NE PEUVENT PAS être exposées au client.
   */
  server: {
    YOUTUBE_API_KEY: z.string().min(1, 'La clé API YouTube est requise.'),
  },

  /**
   * Spécifiez vos variables d'environnement côté client.
   * Elles DOIVENT être préfixées par NEXT_PUBLIC_.
   */
  client: {
    // Aucune variable d'environnement client n'est utilisée pour le moment.
  },

  /**
   * Spécifiez vos variables d'environnement que vous voulez rendre accessibles à la fois
   * côté client et côté serveur. Elles doivent aussi être préfixées par NEXT_PUBLIC_.
   */
  runtimeEnv: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
});
