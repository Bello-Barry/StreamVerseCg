import type { NextConfig } from 'next';
import withPWA from '@next/pwa';

/**
 * @type {import('@next/pwa').PWAConfig}
 */
const pwaConfig = {
  dest: 'public',
  // Activez 'disable' en mode développement pour éviter la génération du service worker
  // Cela rend le debug plus facile, le service worker peut être un peu capricieux
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  sw: 'service-worker.js',
  buildExcludes: [/middleware-manifest\.json$/], // Exclut ce fichier pour éviter les conflits
};

const nextConfig: NextConfig = {
  /*
   * Utilisation de 'withPWA' pour activer les fonctionnalités PWA.
   */
  ...withPWA(pwaConfig),

  /*
   * Configuration ESLint.
   * Il est fortement recommandé de corriger les erreurs de linting au lieu de les ignorer.
   * Nous commentons cette ligne pour que le build échoue en cas d'erreurs,
   * ce qui est une bonne pratique de CI/CD.
   */
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  /*
   * Options de compilation SWC (Rust-based).
   * C'est la valeur par défaut pour Next.js 15, mais on peut la personnaliser si nécessaire.
   */
  swcMinify: true,

  /*
   * Optimisation des images.
   * Crucial pour StreamVerse car les logos des chaînes sont chargés depuis des sources externes.
   */
  images: {
    // Permet d'optimiser les images de n'importe quel domaine.
    // Cela évite de lister chaque URL de logo de chaîne.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  /*
   * Configuration de l'output.
   * Utile si vous déployez votre application dans un conteneur Docker.
   * output: 'standalone',
   */

  /*
   * En-têtes HTTP de sécurité.
   * Améliore la sécurité de l'application en prévenant les attaques courantes.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Ajout de Content-Security-Policy (CSP) pour HLS.js et autres
          // C'est un exemple de base, il peut nécessiter des ajustements
          // en fonction de vos besoins précis.
          // 'self' permet de charger les ressources depuis le même domaine.
          // 'unsafe-inline' pour les styles et scripts en ligne, mais doit être évité si possible.
          // 'blob:' pour les objets HLS.
          // 'data:' pour les images encodées en base64.
          // 'http://*', 'https://*' pour les sources de streaming externes.
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' 'unsafe-inline'; \
                    script-src 'self' 'unsafe-inline'; \
                    style-src 'self' 'unsafe-inline' 'unsafe-eval'; \
                    img-src 'self' data: http: https: blob:; \
                    connect-src 'self' data: ws: http: https:; \
                    media-src 'self' data: blob: http: https:; \
                    font-src 'self' data:`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
