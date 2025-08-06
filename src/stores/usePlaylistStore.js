'use client';
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePlaylistStore = void 0;
var zustand_1 = require("zustand");
var middleware_1 = require("zustand/middleware");
var sonner_1 = require("sonner");
var types_1 = require("@/types");
var m3uParser_1 = require("@/lib/m3uParser");
var xtreamParser_1 = require("@/lib/xtreamParser");
var initialState = {
    playlists: [],
    channels: [],
    categories: [],
    loading: false,
    error: null,
};
// Playlists par défaut, non modifiables par l'utilisateur
var defaultPlaylists = [
    {
        id: 'schumijo-fr',
        name: 'Chaînes Françaises (Schumijo)',
        url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
        type: types_1.PlaylistType.URL,
        status: types_1.PlaylistStatus.ACTIVE,
        description: 'Playlist française de Schumijo avec chaînes françaises',
        isRemovable: false,
        channelCount: 0,
        lastUpdate: new Date(0),
    },
    {
        id: 'iptv-org-france',
        name: 'IPTV-Org (France)',
        url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
        type: types_1.PlaylistType.URL,
        status: types_1.PlaylistStatus.ACTIVE,
        description: 'Chaînes françaises de IPTV-Org',
        isRemovable: false,
        channelCount: 0,
        lastUpdate: new Date(0),
    },
];
/**
 * Fonction utilitaire pour fetch et parser une playlist.
 * Refactorisation pour éviter la duplication de code.
 * J'ai ajouté le support pour le type 'torrent'.
 */
var fetchAndParsePlaylist = function (playlist) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, server, username, password, response, content, torrentResult;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (playlist.status !== types_1.PlaylistStatus.ACTIVE) {
                    throw new Error('La playlist est inactive.');
                }
                if (!(playlist.type === types_1.PlaylistType.XTREAM && playlist.xtreamConfig)) return [3 /*break*/, 1];
                _a = playlist.xtreamConfig, server = _a.server, username = _a.username, password = _a.password;
                if (!server || !username || !password) {
                    throw new Error('Configuration Xtream invalide.');
                }
                return [2 /*return*/, (0, xtreamParser_1.parseXtreamContent)(playlist.xtreamConfig, playlist.id)];
            case 1:
                if (!(playlist.type === types_1.PlaylistType.URL && playlist.url)) return [3 /*break*/, 4];
                return [4 /*yield*/, fetch(playlist.url)];
            case 2:
                response = _b.sent();
                if (!response.ok) {
                    throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                }
                return [4 /*yield*/, response.text()];
            case 3:
                content = _b.sent();
                return [2 /*return*/, (0, m3uParser_1.parseM3UContent)(content, playlist.id)];
            case 4:
                if (!(playlist.type === types_1.PlaylistType.FILE && playlist.content)) return [3 /*break*/, 5];
                return [2 /*return*/, (0, m3uParser_1.parseM3UContent)(playlist.content, playlist.id)];
            case 5:
                if (!(playlist.type === types_1.PlaylistType.TORRENT && playlist.url)) return [3 /*break*/, 7];
                return [4 /*yield*/, parseTorrentContent(playlist.url, playlist.id)];
            case 6:
                torrentResult = _b.sent();
                if (!torrentResult || torrentResult.movies.length === 0) {
                    throw new Error('Aucun film ou série trouvé dans le torrent.');
                }
                // TODO: Gérer ici la conversion des films/séries en un format de 'Channel'
                // Pour l'instant, nous renvoyons un tableau vide. C'est le point à implémenter.
                return [2 /*return*/, { channels: [], errors: [], warnings: [] }];
            case 7: throw new Error('Configuration de playlist invalide ou type de playlist inconnu.');
        }
    });
}); };
exports.usePlaylistStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return (__assign(__assign({}, initialState), { addPlaylist: function (playlistData) { return __awaiter(void 0, void 0, void 0, function () {
        var newPlaylist;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newPlaylist = __assign(__assign({}, playlistData), { id: "playlist-".concat(Date.now()), lastUpdate: new Date(), status: types_1.PlaylistStatus.ACTIVE, isRemovable: true, channelCount: 0 });
                    set(function (state) { return ({
                        playlists: __spreadArray(__spreadArray([], state.playlists, true), [newPlaylist], false),
                    }); });
                    return [4 /*yield*/, get().refreshPlaylist(newPlaylist.id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, updatePlaylist: function (id, updates) {
        return set(function (state) { return ({
            playlists: state.playlists.map(function (playlist) {
                return playlist.id === id
                    ? __assign(__assign(__assign({}, playlist), updates), { lastUpdate: new Date() }) : playlist;
            }),
        }); });
    }, removePlaylist: function (id) {
        var playlists = get().playlists;
        var playlist = playlists.find(function (p) { return p.id === id; });
        if (!playlist || playlist.isRemovable === false) {
            sonner_1.toast.warning("Impossible de supprimer la playlist \"".concat(playlist === null || playlist === void 0 ? void 0 : playlist.name, "\" car elle est prot\u00E9g\u00E9e."));
            return;
        }
        set(function (state) { return ({
            playlists: state.playlists.filter(function (p) { return p.id !== id; }),
            channels: state.channels.filter(function (c) { return c.playlistSource !== id; }),
        }); });
        set(function (state) { return ({
            categories: get().getCategories(),
        }); });
    }, togglePlaylistStatus: function (id) {
        return set(function (state) {
            var playlists = state.playlists.map(function (playlist) {
                return playlist.id === id
                    ? __assign(__assign({}, playlist), { status: playlist.status === types_1.PlaylistStatus.ACTIVE
                            ? types_1.PlaylistStatus.INACTIVE
                            : types_1.PlaylistStatus.ACTIVE, lastUpdate: new Date() }) : playlist;
            });
            return { playlists: playlists };
        });
    }, refreshPlaylists: function () { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, newChannels, _i, playlists_1, playlist, parseResult, error_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    playlists = get().playlists;
                    set({ loading: true, error: null });
                    newChannels = [];
                    _i = 0, playlists_1 = playlists;
                    _a.label = 1;
                case 1:
                    if (!(_i < playlists_1.length)) return [3 /*break*/, 6];
                    playlist = playlists_1[_i];
                    if (playlist.status !== types_1.PlaylistStatus.ACTIVE) {
                        get().updatePlaylist(playlist.id, { status: types_1.PlaylistStatus.INACTIVE });
                        return [3 /*break*/, 5];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetchAndParsePlaylist(playlist)];
                case 3:
                    parseResult = _a.sent();
                    if (parseResult.channels.length > 0) {
                        newChannels.push.apply(newChannels, parseResult.channels);
                        get().updatePlaylist(playlist.id, {
                            channelCount: parseResult.channels.length,
                            status: types_1.PlaylistStatus.ACTIVE,
                        });
                    }
                    else {
                        throw new Error('Aucune chaîne trouvée dans la playlist.');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_1);
                    errorMessage = error_1 instanceof Error ? error_1.message : 'Erreur inconnue';
                    sonner_1.toast.error("Erreur pour la playlist ".concat(playlist.name, ": ").concat(errorMessage));
                    get().updatePlaylist(playlist.id, {
                        status: types_1.PlaylistStatus.ERROR,
                        error: errorMessage,
                    });
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    set({
                        channels: newChannels,
                        categories: get().getCategories(),
                        loading: false,
                    });
                    return [2 /*return*/];
            }
        });
    }); }, refreshPlaylist: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, playlist, parseResult_1, error_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    playlists = get().playlists;
                    playlist = playlists.find(function (p) { return p.id === id; });
                    if (!playlist || playlist.status !== types_1.PlaylistStatus.ACTIVE) {
                        if (playlist)
                            sonner_1.toast.warning("La playlist \"".concat(playlist.name, "\" est inactive."));
                        return [2 /*return*/];
                    }
                    set({ loading: true, error: null });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchAndParsePlaylist(playlist)];
                case 2:
                    parseResult_1 = _a.sent();
                    if (parseResult_1.channels.length > 0) {
                        set(function (state) { return ({
                            channels: __spreadArray(__spreadArray([], state.channels.filter(function (c) { return c.playlistSource !== playlist.id; }), true), parseResult_1.channels, true),
                            categories: get().getCategories(),
                            loading: false,
                        }); });
                        get().updatePlaylist(id, {
                            channelCount: parseResult_1.channels.length,
                            status: types_1.PlaylistStatus.ACTIVE,
                        });
                        sonner_1.toast.success("La playlist \"".concat(playlist.name, "\" a \u00E9t\u00E9 mise \u00E0 jour !"));
                    }
                    else {
                        throw new Error('Aucune chaîne trouvée dans la playlist');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_2);
                    errorMessage = error_2 instanceof Error ? error_2.message : 'Erreur inconnue';
                    sonner_1.toast.error("Erreur lors du rafra\u00EEchissement de \"".concat(playlist.name, "\": ").concat(errorMessage));
                    get().updatePlaylist(id, { status: types_1.PlaylistStatus.ERROR, error: errorMessage });
                    set({ loading: false });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, getChannelsByCategory: function (category) {
        var channels = get().channels;
        return channels.filter(function (channel) { return (channel.group || 'Undefined') === category; });
    }, searchChannels: function (query) {
        var channels = get().channels;
        var searchTerm = query.toLowerCase().trim();
        if (!searchTerm)
            return channels;
        return channels.filter(function (channel) {
            return channel.name.toLowerCase().includes(searchTerm) ||
                (channel.group || '').toLowerCase().includes(searchTerm) ||
                (channel.country || '').toLowerCase().includes(searchTerm) ||
                (channel.language || '').toLowerCase().includes(searchTerm);
        });
    }, getCategories: function () {
        var channels = get().channels;
        var categoryMap = new Map();
        channels.forEach(function (channel) {
            var category = channel.group || 'Undefined';
            if (!categoryMap.has(category))
                categoryMap.set(category, []);
            categoryMap.get(category).push(channel);
        });
        return Array.from(categoryMap.entries())
            .map(function (_a) {
            var name = _a[0], channels = _a[1];
            return ({
                name: name,
                channels: channels,
                count: channels.length,
            });
        })
            .sort(function (a, b) { return b.count - a.count; });
    }, getCategoryCount: function (category) {
        var channels = get().channels;
        return channels.filter(function (channel) { return (channel.group || 'Undefined') === category; }).length;
    }, setLoading: function (loading) { return set({ loading: loading }); }, setError: function (error) { return set({ error: error }); }, clearError: function () { return set({ error: null }); }, resetStore: function () {
        return set(__assign(__assign({}, initialState), { playlists: defaultPlaylists }));
    } })); }, {
    name: 'streamverse-playlist-store',
    storage: (0, middleware_1.createJSONStorage)(function () { return localStorage; }),
    partialize: function (state) { return ({
        playlists: state.playlists.filter(function (p) { return p.isRemovable; }),
    }); },
    onRehydrateStorage: function () { return function (state) {
        // Logique de réhydratation améliorée
        if (state) {
            // Fusionner les playlists sauvegardées avec les playlists par défaut
            var savedPlaylists = state.playlists || [];
            var defaultPlaylistsIds_1 = new Set(defaultPlaylists.map(function (p) { return p.id; }));
            // Retirer les doublons si une playlist par défaut a été sauvegardée
            var mergedPlaylists = __spreadArray(__spreadArray([], defaultPlaylists, true), savedPlaylists.filter(function (p) { return !defaultPlaylistsIds_1.has(p.id); }), true);
            state.playlists = mergedPlaylists;
            // Rafraîchir les playlists après un court délai pour laisser l'interface se charger
            setTimeout(function () { return state.refreshPlaylists(); }, 100);
        }
    }; },
}));
// TODO: Créer une fonction de parsing pour les torrents
// Ce fichier n'existe pas encore, il faudra le créer
var parseTorrentContent = function (url, source) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("Parsing torrent for source: ".concat(source));
        // L'implémentation de WebTorrent se fera ici
        // Elle devrait retourner un tableau d'objets `Movie` ou `Series`
        return [2 /*return*/, { movies: [], errors: [], warnings: [] }];
    });
}); };
