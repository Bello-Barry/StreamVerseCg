"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var next_pwa_1 = require("next-pwa");
var env_mjs_1 = require("./src/env.mjs");
/**
 * @type {import('next-pwa').PWAConfig}
 */
var pwaConfig = {
    dest: 'public',
    // Activez 'disable' en mode développement pour éviter la génération du service worker
    disable: process.env.NODE_ENV === 'development',
    register: true,
    scope: '/',
    sw: 'service-worker.js',
    buildExcludes: [/middleware-manifest\.json$/],
    // Pré-cache des routes
    // Permet un accès hors-ligne plus rapide aux pages essentielles
    additionalManifestEntries: [
        { url: '/', revision: Date.now().toString() },
        { url: '/favorites', revision: Date.now().toString() },
        { url: '/history', revision: Date.now().toString() },
    ],
};
var nextConfig = __assign(__assign({}, (0, next_pwa_1.default)(pwaConfig)), { 
    // Configuration ESLint
    eslint: {
        ignoreDuringBuilds: true,
    }, 
    // Configuration Webpack pour WebTorrent et les dépendances natives
    webpack: function (config, _a) {
        var isServer = _a.isServer;
        // Exclure WebTorrent du rendu côté serveur pour alléger le bundle
        if (isServer) {
            config.externals.push('webtorrent');
        }
        else {
            // Configuration pour le côté client, pour gérer les modules Node.js
            config.resolve.fallback = __assign(__assign({}, config.resolve.fallback), { fs: false, path: false, crypto: false, stream: false, util: false, buffer: require.resolve('buffer') });
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
    headers: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            source: '/:path*',
                            headers: [
                                { key: 'X-Frame-Options', value: 'DENY' },
                                { key: 'X-Content-Type-Options', value: 'nosniff' },
                                { key: 'X-XSS-Protection', value: '1; mode=block' },
                                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                                {
                                    key: 'Content-Security-Policy',
                                    value: "default-src 'self' 'unsafe-inline';                     script-src 'self' 'unsafe-inline' 'unsafe-eval';                     style-src 'self' 'unsafe-inline' 'unsafe-eval';                     img-src 'self' data: http: https: blob:;                     connect-src 'self' data: ws: http: https:;                     media-src 'self' data: blob: http: https:;                     font-src 'self' data:",
                                },
                            ],
                        },
                    ]];
            });
        });
    }, 
    // Configuration env pour valider les variables d'environnement au build
    // Next.js 15 gère mieux ce cas, mais cette ligne de validation est une bonne pratique.
    env: {
        YOUTUBE_API_KEY: env_mjs_1.env.YOUTUBE_API_KEY,
    } });
exports.default = nextConfig;
