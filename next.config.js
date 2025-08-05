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
var pwa_1 = require("@next/pwa");
/**
 * @type {import('@next/pwa').PWAConfig}
 */
var pwaConfig = {
    dest: 'public',
    // Activez 'disable' en mode développement pour éviter la génération du service worker
    // Cela rend le debug plus facile, le service worker peut être un peu capricieux
    disable: process.env.NODE_ENV === 'development',
    register: true,
    scope: '/',
    sw: 'service-worker.js',
    buildExcludes: [/middleware-manifest\.json$/], // Exclut ce fichier pour éviter les conflits
};
var nextConfig = __assign(__assign({}, (0, pwa_1.default)(pwaConfig)), { 
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
                                    value: "default-src 'self' 'unsafe-inline';                     script-src 'self' 'unsafe-inline';                     style-src 'self' 'unsafe-inline' 'unsafe-eval';                     img-src 'self' data: http: https: blob:;                     connect-src 'self' data: ws: http: https:;                     media-src 'self' data: blob: http: https:;                     font-src 'self' data:",
                                },
                            ],
                        },
                    ]];
            });
        });
    } });
exports.default = nextConfig;
