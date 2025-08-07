'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTorrentPlayer = void 0;
var react_1 = require("react");
var useAppStore_1 = require("@/stores/useAppStore");
var webtorrent_1 = require("webtorrent");
var sonner_1 = require("sonner");
/**
 * Hook personnalisé pour gérer la lecture de contenu en P2P via WebTorrent.
 * @returns {object} Un objet contenant les fonctions de lecture et l'état du lecteur.
 */
var useTorrentPlayer = function () {
    var _a = (0, react_1.useState)(false), isLoading = _a[0], setIsLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    // Utiliser le type WebTorrent.WebTorrent pour le client, car c'est le type correct selon @types/webtorrent.
    // useRef peut stocker null au début.
    var clientRef = (0, react_1.useRef)(null);
    var setCurrentChannel = (0, useAppStore_1.useAppStore)(function (state) { return state.setCurrentChannel; });
    /**
     * Initialise le client WebTorrent s'il n'existe pas.
     * @returns {WebTorrent.WebTorrent} Le client WebTorrent.
     */
    var getClient = (0, react_1.useCallback)(function () {
        if (!clientRef.current) {
            console.log("Initialisation du client WebTorrent...");
            // Créer une nouvelle instance de WebTorrent
            var client = new webtorrent_1.default();
            // Attacher le gestionnaire d'erreurs
            client.on('error', function (err) {
                console.error('WebTorrent Client Error:', err);
                setError('Erreur du client WebTorrent. Veuillez réessayer.');
                sonner_1.toast.error('Erreur de lecture du torrent', {
                    description: "Le client de streaming a rencontré une erreur.",
                });
            });
            // Assigner le client initialisé à la référence
            clientRef.current = client;
        }
        // TypeScript sait maintenant que clientRef.current n'est pas null ici
        return clientRef.current;
    }, []);
    /**
     * Commence la lecture d'un torrent.
     * @param {Movie} movie Le film à lire.
     */
    var playTorrent = (0, react_1.useCallback)(function (movie) {
        setIsLoading(true);
        setError(null);
        var client = getClient();
        // Si un torrent est déjà en cours, on le détruit pour en lancer un nouveau.
        if (client.torrents.length > 0) {
            client.torrents.forEach(function (t) { return t.destroy(); });
        }
        sonner_1.toast.info('Démarrage du torrent...', {
            description: "Pr\u00E9paration de la lecture de \"".concat(movie.name, "\"."),
        });
        try {
            client.add(movie.magnetURI || movie.infoHash, function (torrent) {
                console.log('Torrent ready!', torrent);
                // Filtrer les fichiers vidéo pour trouver le bon
                var file = torrent.files.find(function (f) {
                    return f.name.endsWith('.mp4') ||
                        f.name.endsWith('.mkv') ||
                        f.name.endsWith('.avi');
                });
                if (file) {
                    file.getBlobURL(function (err, url) {
                        if (err) {
                            console.error('Erreur lors de la création de l\'URL blob:', err);
                            setError('Impossible de créer l\'URL de lecture.');
                            sonner_1.toast.error('Erreur de lecture', {
                                description: "Impossible de créer l'URL pour la vidéo.",
                            });
                            setIsLoading(false);
                            return;
                        }
                        if (url) {
                            var fakeChannel = {
                                id: movie.id,
                                name: movie.name,
                                url: url,
                                tvgLogo: movie.poster,
                                group: 'Torrents',
                                playlistSource: movie.playlistSource,
                                // ... autres propriétés optionnelles
                            };
                            // Mettre à jour le store pour que le Player puisse jouer ce "canal"
                            setCurrentChannel(fakeChannel);
                            setIsLoading(false);
                            sonner_1.toast.success('Lecture en cours', {
                                description: "D\u00E9marrage de la lecture de \"".concat(movie.name, "\"."),
                            });
                        }
                    });
                }
                else {
                    setError('Aucun fichier vidéo trouvé dans ce torrent.');
                    sonner_1.toast.error('Aucun fichier vidéo', {
                        description: "Le torrent ne contient pas de fichier vidéo lisible.",
                    });
                    setIsLoading(false);
                    torrent.destroy();
                }
            });
        }
        catch (e) {
            console.error('Failed to add torrent:', e);
            setError('Impossible d\'ajouter le torrent.');
            sonner_1.toast.error('Erreur', {
                description: "Impossible de démarrer le torrent.",
            });
            setIsLoading(false);
        }
    }, [getClient, setCurrentChannel]);
    return { playTorrent: playTorrent, isLoading: isLoading, error: error };
};
exports.useTorrentPlayer = useTorrentPlayer;
