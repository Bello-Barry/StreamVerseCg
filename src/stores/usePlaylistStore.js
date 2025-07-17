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
var m3uParser_1 = require("@/lib/m3uParser");
//import { parseXtreamContent, XtreamParser } from '@/lib/xtreamParser';
var xtreamParser_1 = require("@/lib/xtreamParser");
var initialState = {
    playlists: [],
    channels: [],
    categories: [],
    loading: false,
    error: null
};
// Playlists par défaut
var defaultPlaylists = [
    {
        id: 'schumijo-fr',
        name: 'Chaînes Françaises (Schumijo)',
        url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
        type: 'url',
        status: 'active',
        description: 'Playlist française de Schumijo avec chaînes françaises',
        isRemovable: false
    },
    {
        id: 'iptv-org-france',
        name: 'IPTV-Org (France)',
        url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
        type: 'url',
        status: 'active',
        description: 'Chaînes françaises de IPTV-Org',
        isRemovable: false
    }
];
exports.usePlaylistStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return (__assign(__assign({}, initialState), { 
    // Actions pour les playlists
    addPlaylist: function (playlistData) { return __awaiter(void 0, void 0, void 0, function () {
        var newPlaylist;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newPlaylist = __assign(__assign({}, playlistData), { id: "playlist-".concat(Date.now()), lastUpdate: new Date(), status: 'active', isRemovable: true // Les nouvelles playlists sont amovibles par défaut
                     });
                    set(function (state) { return ({
                        playlists: __spreadArray(__spreadArray([], state.playlists, true), [newPlaylist], false)
                    }); });
                    // Charger immédiatement la playlist
                    return [4 /*yield*/, get().refreshPlaylist(newPlaylist.id)];
                case 1:
                    // Charger immédiatement la playlist
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, updatePlaylist: function (id, updates) { return set(function (state) { return ({
        playlists: state.playlists.map(function (playlist) {
            return playlist.id === id
                ? __assign(__assign(__assign({}, playlist), updates), { lastUpdate: new Date() }) : playlist;
        })
    }); }); }, removePlaylist: function (id) {
        var playlists = get().playlists;
        var playlist = playlists.find(function (p) { return p.id === id; });
        // Empêcher la suppression des playlists non amovibles
        if (playlist && playlist.isRemovable === false) {
            console.warn("Impossible de supprimer la playlist \"".concat(playlist.name, "\" car elle est prot\u00E9g\u00E9e."));
            return;
        }
        set(function (state) { return ({
            playlists: state.playlists.filter(function (playlist) { return playlist.id !== id; }),
            channels: state.channels.filter(function (channel) { return channel.playlistSource !== id; })
        }); });
    }, togglePlaylistStatus: function (id) { return set(function (state) { return ({
        playlists: state.playlists.map(function (playlist) {
            return playlist.id === id
                ? __assign(__assign({}, playlist), { status: playlist.status === 'active' ? 'inactive' : 'active', lastUpdate: new Date() }) : playlist;
        })
    }); }); }, 
    // Actions pour les chaînes
    refreshPlaylists: function () { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, activePlaylists, allChannels, _i, activePlaylists_1, playlist, parseResult, response, content, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    playlists = get().playlists;
                    set({ loading: true, error: null });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 13, , 14]);
                    activePlaylists = playlists.filter(function (p) { return p.status === 'active'; });
                    allChannels = [];
                    _i = 0, activePlaylists_1 = activePlaylists;
                    _a.label = 2;
                case 2:
                    if (!(_i < activePlaylists_1.length)) return [3 /*break*/, 12];
                    playlist = activePlaylists_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 10, , 11]);
                    parseResult = void 0;
                    if (!(playlist.type === 'xtream' && playlist.xtreamConfig)) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, xtreamParser_1.parseXtreamContent)(playlist.xtreamConfig, playlist.id)];
                case 4:
                    // Parser Xtream Codes
                    parseResult = _a.sent();
                    return [3 /*break*/, 9];
                case 5:
                    if (!(playlist.type === 'url' && playlist.url)) return [3 /*break*/, 8];
                    return [4 /*yield*/, fetch(playlist.url)];
                case 6:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.text()];
                case 7:
                    content = _a.sent();
                    parseResult = (0, m3uParser_1.parseM3UContent)(content, playlist.id);
                    return [3 /*break*/, 9];
                case 8:
                    if (playlist.content) {
                        // Parser M3U depuis contenu
                        parseResult = (0, m3uParser_1.parseM3UContent)(playlist.content, playlist.id);
                    }
                    else {
                        return [3 /*break*/, 11]; // Ignorer les playlists mal configurées
                    }
                    _a.label = 9;
                case 9:
                    if (parseResult.channels.length > 0) {
                        allChannels.push.apply(allChannels, parseResult.channels);
                        // Mettre à jour le nombre de chaînes
                        get().updatePlaylist(playlist.id, {
                            channelCount: parseResult.channels.length,
                            status: 'active'
                        });
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_1);
                    get().updatePlaylist(playlist.id, {
                        status: 'error'
                    });
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 2];
                case 12:
                    set({
                        channels: allChannels,
                        categories: get().getCategories(),
                        loading: false
                    });
                    return [3 /*break*/, 14];
                case 13:
                    error_2 = _a.sent();
                    set({
                        error: error_2 instanceof Error ? error_2.message : 'Erreur inconnue',
                        loading: false
                    });
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    }); }, refreshPlaylist: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, playlist, parseResult_1, response, content, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    playlists = get().playlists;
                    playlist = playlists.find(function (p) { return p.id === id; });
                    if (!playlist || playlist.status !== 'active')
                        return [2 /*return*/];
                    set({ loading: true });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    if (!(playlist.type === 'xtream' && playlist.xtreamConfig)) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, xtreamParser_1.parseXtreamContent)(playlist.xtreamConfig, playlist.id)];
                case 2:
                    // Parser Xtream Codes
                    parseResult_1 = _a.sent();
                    return [3 /*break*/, 7];
                case 3:
                    if (!(playlist.type === 'url' && playlist.url)) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetch(playlist.url)];
                case 4:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.text()];
                case 5:
                    content = _a.sent();
                    parseResult_1 = (0, m3uParser_1.parseM3UContent)(content, playlist.id);
                    return [3 /*break*/, 7];
                case 6:
                    if (playlist.content) {
                        // Parser M3U depuis contenu
                        parseResult_1 = (0, m3uParser_1.parseM3UContent)(playlist.content, playlist.id);
                    }
                    else {
                        throw new Error('Configuration de playlist invalide');
                    }
                    _a.label = 7;
                case 7:
                    if (parseResult_1.channels.length > 0) {
                        set(function (state) { return ({
                            channels: __spreadArray(__spreadArray([], state.channels.filter(function (c) { return c.playlistSource !== id; }), true), parseResult_1.channels, true),
                            loading: false
                        }); });
                        get().updatePlaylist(id, {
                            channelCount: parseResult_1.channels.length,
                            status: 'active'
                        });
                    }
                    else {
                        throw new Error('Aucune chaîne trouvée dans la playlist');
                    }
                    return [3 /*break*/, 9];
                case 8:
                    error_3 = _a.sent();
                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_3);
                    get().updatePlaylist(id, { status: 'error' });
                    set({ loading: false });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); }, getChannelsByCategory: function (category) {
        var channels = get().channels;
        return channels.filter(function (channel) {
            return (channel.group || 'Undefined') === category;
        });
    }, searchChannels: function (query) {
        var channels = get().channels;
        if (!query.trim())
            return channels;
        var searchTerm = query.toLowerCase();
        return channels.filter(function (channel) {
            return channel.name.toLowerCase().includes(searchTerm) ||
                (channel.group || '').toLowerCase().includes(searchTerm) ||
                (channel.country || '').toLowerCase().includes(searchTerm) ||
                (channel.language || '').toLowerCase().includes(searchTerm);
        });
    }, 
    // Actions pour les catégories
    getCategories: function () {
        var channels = get().channels;
        var categoryMap = new Map();
        channels.forEach(function (channel) {
            var category = channel.group || 'Undefined';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category).push(channel);
        });
        return Array.from(categoryMap.entries()).map(function (_a) {
            var name = _a[0], channels = _a[1];
            return ({
                name: name,
                channels: channels,
                count: channels.length
            });
        }).sort(function (a, b) { return b.count - a.count; });
    }, getCategoryCount: function (category) {
        var channels = get().channels;
        return channels.filter(function (channel) {
            return (channel.group || 'Undefined') === category;
        }).length;
    }, 
    // Actions utilitaires
    setLoading: function (loading) { return set({ loading: loading }); }, setError: function (error) { return set({ error: error }); }, clearError: function () { return set({ error: null }); }, resetStore: function () { return set(__assign(__assign({}, initialState), { playlists: defaultPlaylists })); } })); }, {
    name: 'streamverse-playlist-store',
    storage: (0, middleware_1.createJSONStorage)(function () { return localStorage; }),
    partialize: function (state) { return ({
        playlists: state.playlists,
        // On ne persiste que les playlists configurées
        // Les chaînes et catégories sont rechargées à chaque session
    }); },
    onRehydrateStorage: function () { return function (state) {
        // Initialiser avec les playlists par défaut si aucune n'existe
        if (state && state.playlists.length === 0) {
            state.playlists = defaultPlaylists;
        }
        // Recharger les chaînes au démarrage
        if (state) {
            setTimeout(function () { return state.refreshPlaylists(); }, 100);
        }
    }; }
}));
