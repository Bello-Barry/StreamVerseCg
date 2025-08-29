// Fichier: next.config.ts
import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import { env } from './src/env.mjs';

/**
 * @type {import('next-pwa').PWAConfig}
 */
const pwaConfig = {
  dest: 'public',
  // Activez 'disable' en mode développement pour éviter la génération du service worker
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  sw: 'service-worker.js',
  buildExcludes: [/middleware-manifest\.json$/], // Exclut ce fichier pour éviter les conflits
  // Pré-cache des routes
  // Permet un accès hors-ligne plus rapide aux pages essentielles
  additionalManifestEntries: [
    { url: '/', revision: Date.now().toString() },
    { url: '/favorites', revision: Date.now().toString() },
    { url: '/history', revision: Date.now().toString() },
  ],
};

const nextConfig: NextConfig = {
  // Utilisation de 'withPWA' pour activer les fonctionnalités PWA.
  ...withPWA(pwaConfig),

  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuration Webpack pour WebTorrent et les dépendances natives
  webpack: (config, { isServer }) => {
    // Exclure WebTorrent du rendu côté serveur pour alléger le bundle
    if (isServer) {
      config.externals.push('webtorrent');
    } else {
      // Configuration pour le côté client, pour gérer les modules Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: require.resolve('buffer'),
      };
    }

    // Ignorer les warnings des dépendances natives
    config.ignoreWarnings = [
      { module: /fs-native-extensions/ },
      { module: /require-addon/ },
      { message: /Critical dependency/ },
    ];

    return config;
  },

  // Retrait de 'experimental.esmExternals' qui est déprécié dans Next.js 15
  // et peut causer des problèmes de résolution de modules.
  experimental: {},

  // Transpiler les modules nécessaires
  transpilePackages: ['webtorrent'],

  // Optimisation des images.
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  
  // En-têtes HTTP de sécurité.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' 'unsafe-inline'; \
                    script-src 'self' 'unsafe-inline' 'unsafe-eval'; \
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

  // Configuration env pour valider les variables d'environnement au build
  // Next.js 15 gère mieux ce cas, mais cette ligne de validation est une bonne pratique.
  env: {
    YOUTUBE_API_KEY: env.YOUTUBE_API_KEY,
  },
};

export default nextConfig;
