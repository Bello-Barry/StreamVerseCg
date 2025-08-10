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
exports.parseTorrentContent = void 0;
/**
 * Parser pour les fichiers torrent utilisant WebTorrent
 */
var parseTorrentContent = function (source, sourceName) { return __awaiter(void 0, void 0, Promise, function () {
    var movies, series, errors, warnings, WebTorrent, client_1, torrentData_1, videoFiles, groupedContent, err_1, errorMessage;
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
                _a.trys.push([1, 4, , 5]);
                // Vérifier que nous sommes côté client
                if (typeof window === 'undefined') {
                    throw new Error('WebTorrent ne peut être utilisé que côté client');
                }
                return [4 /*yield*/, Promise.resolve().then(function () { return require('webtorrent'); })];
            case 2:
                WebTorrent = (_a.sent()).default;
                client_1 = new WebTorrent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var torrent = client_1.add(source, {
                            // Options pour accélérer le processus
                            announce: [
                                'wss://tracker.openwebtorrent.com',
                                'wss://tracker.btorrent.xyz',
                                'wss://tracker.webtorrent.dev'
                            ]
                        });
                        // Timeout pour éviter d'attendre indéfiniment
                        var timeout = setTimeout(function () {
                            torrent.destroy();
                            client_1.destroy();
                            reject(new Error('Timeout lors du chargement du torrent'));
                        }, 30000); // 30 secondes
                        torrent.on('ready', function () {
                            clearTimeout(timeout);
                            console.log('Torrent ready:', torrent.name);
                            resolve(torrent);
                        });
                        torrent.on('error', function (err) {
                            clearTimeout(timeout);
                            client_1.destroy();
                            reject(err);
                        });
                    })];
            case 3:
                torrentData_1 = _a.sent();
                videoFiles = torrentData_1.files.filter(function (file) {
                    var name = file.name.toLowerCase();
                    return name.endsWith('.mp4') ||
                        name.endsWith('.mkv') ||
                        name.endsWith('.avi') ||
                        name.endsWith('.webm') ||
                        name.endsWith('.mov') ||
                        name.endsWith('.m4v') ||
                        name.endsWith('.wmv');
                });
                if (videoFiles.length === 0) {
                    warnings.push('Aucun fichier vidéo trouvé dans ce torrent');
                    client_1.destroy();
                    return [2 /*return*/, { movies: movies, series: series, errors: errors, warnings: warnings }];
                }
                groupedContent = groupVideoFiles(videoFiles, sourceName);
                // Traiter les films
                groupedContent.movies.forEach(function (movieData, index) {
                    var _a;
                    var movie = {
                        id: "".concat(sourceName, "-movie-").concat(index + 1),
                        name: movieData.name,
                        infoHash: torrentData_1.infoHash,
                        magnetURI: torrentData_1.magnetURI,
                        poster: generatePosterUrl(movieData.name),
                        category: detectCategory(movieData.name),
                        playlistSource: sourceName,
                        length: ((_a = movieData.files[0]) === null || _a === void 0 ? void 0 : _a.length) || 0,
                        files: movieData.files.map(function (file) { return ({
                            name: file.name,
                            url: '',
                            length: file.length
                        }); }),
                        // Stocker les métadonnées du torrent pour usage ultérieur
                        torrentFiles: movieData.files
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
                        torrentFile: ep.file // Référence au fichier du torrent
                    }); });
                    var series = {
                        id: "".concat(sourceName, "-series-").concat(index + 1),
                        name: seriesData.name,
                        poster: generatePosterUrl(seriesData.name),
                        category: detectCategory(seriesData.name),
                        playlistSource: sourceName,
                        episodes: episodes
                    };
                    series.push(series);
                });
                // Ne pas détruire le client ici, on en aura besoin pour la lecture
                console.log("Parsed ".concat(movies.length, " movies and ").concat(series.length, " series from torrent"));
                return [3 /*break*/, 5];
            case 4:
                err_1 = _a.sent();
                errorMessage = err_1 instanceof Error ? err_1.message : 'Erreur inconnue';
                errors.push("Erreur lors du parsing du torrent: ".concat(errorMessage));
                console.error('Error parsing torrent:', err_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/, { movies: movies, series: series, errors: errors, warnings: warnings }];
        }
    });
}); };
exports.parseTorrentContent = parseTorrentContent;
/**
 * Groupe les fichiers vidéo en films et séries
 */
function groupVideoFiles(files, sourceName) {
    var movies = [];
    var series = [];
    var seriesMap = new Map();
    files.forEach(function (file) {
        var fileName = file.name;
        var episodeMatch = detectEpisode(fileName);
        if (episodeMatch) {
            // C'est un épisode de série
            var seriesName = episodeMatch.seriesName;
            if (!seriesMap.has(seriesName)) {
                seriesMap.set(seriesName, {
                    name: seriesName,
                    episodes: []
                });
            }
            seriesMap.get(seriesName).episodes.push({
                name: "S".concat(episodeMatch.season.toString().padStart(2, '0'), "E").concat(episodeMatch.episode.toString().padStart(2, '0'), " - ").concat(episodeMatch.episodeName || fileName),
                season: episodeMatch.season,
                episode: episodeMatch.episode,
                file: file
            });
        }
        else {
            // C'est un film
            movies.push({
                name: cleanMovieName(fileName),
                files: [file]
            });
        }
    });
    // Convertir la Map en array
    seriesMap.forEach(function (series) {
        // Trier les épisodes
        series.episodes.sort(function (a, b) {
            if (a.season !== b.season)
                return a.season - b.season;
            return a.episode - b.episode;
        });
        series.push(series);
    });
    return { movies: movies, series: series };
}
/**
 * Détecte si un nom de fichier correspond à un épisode de série
 */
function detectEpisode(fileName) {
    // Patterns communs pour les épisodes de séries
    var patterns = [
        /(.+?)[.\s]S(\d{1,2})E(\d{1,2})/i,
        /(.+?)[.\s](\d{1,2})x(\d{1,2})/i,
        /(.+?)[.\s]Season\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i // Series Name Season 1 Episode 1
    ];
    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
        var pattern = patterns_1[_i];
        var match = fileName.match(pattern);
        if (match) {
            return {
                seriesName: cleanSeriesName(match[1]),
                season: parseInt(match[2]),
                episode: parseInt(match[3]),
                episodeName: null
            };
        }
    }
    return null;
}
/**
 * Nettoie le nom d'une série
 */
function cleanSeriesName(name) {
    return name
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, function (l) { return l.toUpperCase(); });
}
/**
 * Nettoie le nom d'un film
 */
function cleanMovieName(fileName) {
    // Retirer l'extension
    var nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Nettoyer les caractères spéciaux et les infos techniques
    return nameWithoutExt
        .replace(/[._]/g, ' ')
        .replace(/\d{4}p?/g, '') // Retirer les résolutions (1080p, 720p, etc.)
        .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, function (l) { return l.toUpperCase(); });
}
/**
 * Détecte la catégorie basée sur le nom
 */
function detectCategory(name) {
    var lowerName = name.toLowerCase();
    if (lowerName.includes('action') || lowerName.includes('adventure'))
        return 'Action';
    if (lowerName.includes('comedy') || lowerName.includes('comic'))
        return 'Comédie';
    if (lowerName.includes('drama'))
        return 'Drame';
    if (lowerName.includes('horror') || lowerName.includes('scary'))
        return 'Horreur';
    if (lowerName.includes('sci-fi') || lowerName.includes('science'))
        return 'Science-Fiction';
    if (lowerName.includes('romance') || lowerName.includes('love'))
        return 'Romance';
    if (lowerName.includes('thriller'))
        return 'Thriller';
    if (lowerName.includes('documentary'))
        return 'Documentaire';
    return 'Divers';
}
/**
 * Génère une URL d'affiche factice (à remplacer par une vraie API)
 */
function generatePosterUrl(name) {
    // Vous pourrez plus tard intégrer une API comme TMDB
    return "https://via.placeholder.com/300x450.png?text=".concat(encodeURIComponent(name));
}
