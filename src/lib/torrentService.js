'use client';
"use strict";
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
exports.torrentService = void 0;
var buffer_1 = require("buffer");
// Instance globale du client WebTorrent pour s'assurer qu'il est un singleton
var globalWebTorrentClient = null;
var currentTorrentInstance = null;
var TorrentService = /** @class */ (function () {
    function TorrentService() {
    }
    /**
     * Initialise le client WebTorrent global
     */
    TorrentService.prototype.getWebTorrentClient = function () {
        return __awaiter(this, void 0, Promise, function () {
            var WebTorrent, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (globalWebTorrentClient) {
                            return [2 /*return*/, globalWebTorrentClient];
                        }
                        if (typeof window === 'undefined') {
                            throw new Error('WebTorrent ne peut être utilisé que côté client');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('webtorrent'); })];
                    case 2:
                        WebTorrent = (_a.sent()).default;
                        globalWebTorrentClient = new WebTorrent({
                            maxConns: 100,
                            dht: true,
                            webSeeds: true,
                        });
                        console.log('WebTorrent client initialized.');
                        return [2 /*return*/, globalWebTorrentClient];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Impossible de charger WebTorrent:', error_1);
                        throw new Error('Impossible de charger WebTorrent: ' + error_1.message);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Valide un lien magnet
     */
    TorrentService.prototype.validateMagnetURI = function (magnetURI) {
        var magnetRegex = /^magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40}/;
        return magnetRegex.test(magnetURI);
    };
    /**
     * Extrait le hash d'un lien magnet
     */
    TorrentService.prototype.extractHashFromMagnet = function (magnetURI) {
        var match = magnetURI.match(/xt=urn:btih:([a-fA-F0-9]{32,40})/);
        return match ? match[1] : null;
    };
    /**
     * Extrait le nom d'un lien magnet
     */
    TorrentService.prototype.extractNameFromMagnet = function (magnetURI) {
        var match = magnetURI.match(/dn=([^&]+)/);
        return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
    };
    /**
     * Parse un torrent (fichier ou magnet) de manière améliorée
     */
    TorrentService.prototype.parseTorrentContent = function (source, sourceName) {
        return __awaiter(this, void 0, Promise, function () {
            var movies, series, errors, warnings, client_1, torrentToAdd_1, arrayBuffer, torrentData_1, videoFiles, groupedContent, err_1, errorMessage;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[parseTorrentContent] Parsing torrent for source: ".concat(sourceName));
                        movies = [];
                        series = [];
                        errors = [];
                        warnings = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.getWebTorrentClient()];
                    case 2:
                        client_1 = _a.sent();
                        // Assurer qu'il n'y a qu'un seul torrent à la fois
                        if (currentTorrentInstance) {
                            currentTorrentInstance.destroy();
                            currentTorrentInstance = null;
                        }
                        if (!(source instanceof File)) return [3 /*break*/, 4];
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var reader = new FileReader();
                                reader.onload = function () { return resolve(reader.result); };
                                reader.onerror = function () { return reject(new Error('Erreur lors de la lecture du fichier')); };
                                reader.readAsArrayBuffer(source);
                            })];
                    case 3:
                        arrayBuffer = _a.sent();
                        // Conversion de l'ArrayBuffer en Buffer pour le client webtorrent
                        torrentToAdd_1 = buffer_1.Buffer.from(arrayBuffer);
                        return [3 /*break*/, 5];
                    case 4:
                        if (typeof source === 'string') {
                            if (!this.validateMagnetURI(source)) {
                                throw new Error('Lien magnet invalide');
                            }
                            torrentToAdd_1 = source;
                        }
                        else {
                            throw new Error('Type de source non supporté');
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var torrent = client_1.add(torrentToAdd_1, {
                                announce: [
                                    'wss://tracker.openwebtorrent.com',
                                    'wss://tracker.btorrent.xyz',
                                    'wss://tracker.webtorrent.dev',
                                    'wss://tracker.files.fm:7073/announce',
                                ],
                            });
                            currentTorrentInstance = torrent;
                            var timeout = setTimeout(function () {
                                torrent.destroy();
                                reject(new Error('Timeout lors du chargement du torrent (30s)'));
                            }, 30000);
                            torrent.on('ready', function () {
                                clearTimeout(timeout);
                                console.log('Torrent prêt:', torrent.name, 'Files:', torrent.files.length);
                                resolve(torrent);
                            });
                            // Caster en 'any' car la déclaration de type de webtorrent ne supporte pas 'error'
                            torrent.on('error', function (err) {
                                clearTimeout(timeout);
                                // Important: détruire le torrent en cas d'erreur
                                torrent.destroy();
                                reject(new Error("Erreur WebTorrent: ".concat(err.message)));
                            });
                        })];
                    case 6:
                        torrentData_1 = _a.sent();
                        videoFiles = torrentData_1.files.filter(function (file) {
                            var name = file.name.toLowerCase();
                            var videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv', '.m2ts'];
                            return videoExtensions.some(function (ext) { return name.endsWith(ext); });
                        });
                        if (videoFiles.length === 0) {
                            warnings.push('Aucun fichier vidéo trouvé dans ce torrent');
                            return [2 /*return*/, { movies: movies, series: series, errors: errors, warnings: warnings }];
                        }
                        console.log("Trouv\u00E9 ".concat(videoFiles.length, " fichiers vid\u00E9o"));
                        groupedContent = this.groupVideoFiles(videoFiles, sourceName, torrentData_1);
                        // Traiter les films
                        groupedContent.movies.forEach(function (movieData, index) {
                            var _a;
                            var movie = {
                                id: "".concat(sourceName, "-movie-").concat(index + 1),
                                name: movieData.name,
                                infoHash: torrentData_1.infoHash,
                                magnetURI: torrentData_1.magnetURI,
                                poster: _this.generatePosterUrl(movieData.name),
                                category: _this.detectCategory(movieData.name),
                                playlistSource: sourceName,
                                length: ((_a = movieData.files[0]) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                files: movieData.files.map(function (file) { return ({
                                    name: file.name,
                                    url: '',
                                    length: file.length,
                                }); }),
                                torrentFiles: movieData.files,
                                // Métadonnées supplémentaires
                                quality: _this.detectQuality(movieData.name),
                                year: _this.detectYear(movieData.name),
                            };
                            movies.push(movie);
                        });
                        // Traiter les séries
                        groupedContent.series.forEach(function (seriesData, index) {
                            var episodes = seriesData.episodes.map(function (ep, epIndex) { return ({
                                id: "".concat(sourceName, "-series-").concat(index + 1, "-e").concat(epIndex + 1),
                                name: ep.name,
                                season: ep.season,
                                episode: ep.episode,
                                infoHash: torrentData_1.infoHash,
                                magnetURI: torrentData_1.magnetURI,
                                torrentFile: ep.file,
                                quality: _this.detectQuality(ep.file.name),
                                duration: _this.estimateDuration(ep.file.length),
                            }); });
                            var seriesItem = {
                                id: "".concat(sourceName, "-series-").concat(index + 1),
                                name: seriesData.name,
                                poster: _this.generatePosterUrl(seriesData.name),
                                category: _this.detectCategory(seriesData.name),
                                playlistSource: sourceName,
                                episodes: episodes,
                                // Métadonnées supplémentaires
                                totalSeasons: Math.max.apply(Math, episodes.map(function (ep) { return ep.season; })),
                                year: _this.detectYear(seriesData.name),
                            };
                            series.push(seriesItem);
                        });
                        console.log("Analys\u00E9: ".concat(movies.length, " films et ").concat(series.length, " s\u00E9ries"));
                        return [3 /*break*/, 8];
                    case 7:
                        err_1 = _a.sent();
                        errorMessage = err_1 instanceof Error ? err_1.message : 'Erreur inconnue';
                        errors.push("Erreur lors du parsing du torrent: ".concat(errorMessage));
                        console.error('Erreur parsing torrent:', err_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, { movies: movies, series: series, errors: errors, warnings: warnings }];
                }
            });
        });
    };
    /**
     * Détruit le client WebTorrent global et libère les ressources
     */
    TorrentService.prototype.destroyClient = function () {
        if (globalWebTorrentClient) {
            try {
                globalWebTorrentClient.destroy();
                globalWebTorrentClient = null;
                currentTorrentInstance = null;
                console.log('WebTorrent client destroyed.');
            }
            catch (error) {
                console.error('Erreur lors du nettoyage de WebTorrent:', error);
            }
        }
    };
    /**
     * Groupe les fichiers vidéo de manière améliorée
     */
    TorrentService.prototype.groupVideoFiles = function (files, sourceName, torrentData) {
        var _this = this;
        var movies = [];
        var series = [];
        var seriesMap = new Map();
        files.forEach(function (file) {
            var fileName = file.name;
            var episodeMatch = _this.detectEpisode(fileName);
            if (episodeMatch) {
                // C'est un épisode de série
                var seriesName = episodeMatch.seriesName;
                if (!seriesMap.has(seriesName)) {
                    seriesMap.set(seriesName, {
                        name: seriesName,
                        episodes: [],
                    });
                }
                seriesMap.get(seriesName).episodes.push({
                    name: _this.formatEpisodeName(episodeMatch),
                    season: episodeMatch.season,
                    episode: episodeMatch.episode,
                    file: file,
                });
            }
            else {
                // C'est un film
                movies.push({
                    name: _this.cleanMovieName(fileName),
                    files: [file],
                });
            }
        });
        // Convertir la Map en array et trier
        seriesMap.forEach(function (seriesData) {
            seriesData.episodes.sort(function (a, b) {
                if (a.season !== b.season)
                    return a.season - b.season;
                return a.episode - b.episode;
            });
            series.push(seriesData);
        });
        return { movies: movies, series: series };
    };
    /**
     * Détection améliorée des épisodes de série
     */
    TorrentService.prototype.detectEpisode = function (fileName) {
        var patterns = [
            // Patterns standards
            /(.+?)[.\s]S(\d{1,2})E(\d{1,2})/i,
            /(.+?)[.\s](\d{1,2})x(\d{1,2})/i,
            /(.+?)[.\s]Season\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i,
            // Patterns français
            /(.+?)[.\s]Saison\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i,
            /(.+?)[.\s]S(\d{1,2})\s*EP?(\d{1,2})/i,
            // Patterns avec tirets
            /(.+?)\s*-\s*S(\d{1,2})E(\d{1,2})/i,
            // Patterns avec parenthèses
            /(.+?)\s*\(S(\d{1,2})E(\d{1,2})\)/i,
        ];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = fileName.match(pattern);
            if (match) {
                return {
                    seriesName: this.cleanSeriesName(match[1]),
                    season: parseInt(match[2]),
                    episode: parseInt(match[3]),
                    episodeName: null,
                };
            }
        }
        return null;
    };
    /**
     * Nettoyage amélioré du nom de série
     */
    TorrentService.prototype.cleanSeriesName = function (name) {
        return name
            .replace(/[._\-]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC|1080p|720p|480p)\b/gi, '')
            .trim()
            .replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    /**
     * Nettoyage amélioré du nom de film
     */
    TorrentService.prototype.cleanMovieName = function (fileName) {
        var nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        return nameWithoutExt
            .replace(/[._\-]/g, ' ')
            .replace(/\d{4}p?/g, '')
            .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC|PROPER|REPACK|EXTENDED|UNRATED)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, function (l) { return l.toUpperCase(); });
    };
    /**
     * Détection améliorée de la catégorie
     */
    TorrentService.prototype.detectCategory = function (name) {
        var lowerName = name.toLowerCase();
        var categories = {
            'Action': ['action', 'adventure', 'fight', 'war', 'battle'],
            'Comédie': ['comedy', 'comic', 'funny', 'humor', 'laugh'],
            'Drame': ['drama', 'dramatic', 'emotional'],
            'Horreur': ['horror', 'scary', 'terror', 'fear', 'nightmare'],
            'Science-Fiction': ['sci-fi', 'science', 'fiction', 'space', 'alien', 'future'],
            'Romance': ['romance', 'love', 'romantic', 'heart'],
            'Thriller': ['thriller', 'suspense', 'mystery'],
            'Documentaire': ['documentary', 'docu', 'real', 'true'],
            'Animation': ['animation', 'animated', 'cartoon', 'anime'],
            'Crime': ['crime', 'criminal', 'police', 'detective', 'murder'],
        };
        for (var _i = 0, _a = Object.entries(categories); _i < _a.length; _i++) {
            var _b = _a[_i], category = _b[0], keywords = _b[1];
            if (keywords.some(function (keyword) { return lowerName.includes(keyword); })) {
                return category;
            }
        }
        return 'Divers';
    };
    /**
     * Détecte la qualité vidéo
     */
    TorrentService.prototype.detectQuality = function (fileName) {
        var lowerName = fileName.toLowerCase();
        if (lowerName.includes('4k') || lowerName.includes('2160p'))
            return '4K';
        if (lowerName.includes('1080p'))
            return '1080p';
        if (lowerName.includes('720p'))
            return '720p';
        if (lowerName.includes('480p'))
            return '480p';
        if (lowerName.includes('360p'))
            return '360p';
        return 'SD';
    };
    /**
     * Détecte l'année de sortie
     */
    TorrentService.prototype.detectYear = function (name) {
        var yearMatch = name.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    };
    /**
     * Estime la durée basée sur la taille du fichier
     */
    TorrentService.prototype.estimateDuration = function (fileSize) {
        // Estimation approximative: 1GB ≈ 45 minutes pour une qualité standard
        var estimatedMinutes = Math.round((fileSize / (1024 * 1024 * 1024)) * 45);
        return Math.max(estimatedMinutes, 20); // Minimum 20 minutes
    };
    /**
     * Formate le nom d'un épisode
     */
    TorrentService.prototype.formatEpisodeName = function (episodeMatch) {
        var season = episodeMatch.season.toString().padStart(2, '0');
        var episode = episodeMatch.episode.toString().padStart(2, '0');
        return "S".concat(season, "E").concat(episode);
    };
    /**
     * Génère une URL d'affiche améliorée
     */
    TorrentService.prototype.generatePosterUrl = function (name) {
        // TODO: Intégrer une vraie API comme TMDB
        var encodedName = encodeURIComponent(name);
        return "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=".concat(encodedName);
    };
    return TorrentService;
}());
// Instance singleton
exports.torrentService = new TorrentService();
