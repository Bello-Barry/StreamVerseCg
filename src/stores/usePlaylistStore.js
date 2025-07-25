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
var types_1 = require("@/types");
var m3uParser_1 = require("@/lib/m3uParser");
var xtreamParser_1 = require("@/lib/xtreamParser");
var initialState = {
    playlists: [],
    channels: [],
    categories: [],
    loading: false,
    error: null
};
var defaultPlaylists = [
    {
        id: 'schumijo-fr',
        name: 'Chaînes Françaises (Schumijo)',
        url: 'https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8',
        type: 'url',
        status: types_1.PlaylistStatus.ACTIVE,
        description: 'Playlist française de Schumijo avec chaînes françaises',
        isRemovable: false
    },
    {
        id: 'iptv-org-france',
        name: 'IPTV-Org (France)',
        url: 'https://iptv-org.github.io/iptv/languages/fra.m3u',
        type: 'url',
        status: types_1.PlaylistStatus.ACTIVE,
        description: 'Chaînes françaises de IPTV-Org',
        isRemovable: false
    }
];
exports.usePlaylistStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return (__assign(__assign({}, initialState), { addPlaylist: function (playlistData) { return __awaiter(void 0, void 0, void 0, function () {
        var newPlaylist;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newPlaylist = __assign(__assign({}, playlistData), { id: "playlist-".concat(Date.now()), lastUpdate: new Date(), status: types_1.PlaylistStatus.ACTIVE, isRemovable: true });
                    set(function (state) { return ({
                        playlists: __spreadArray(__spreadArray([], state.playlists, true), [newPlaylist], false)
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
            })
        }); });
    }, removePlaylist: function (id) {
        var playlists = get().playlists;
        var playlist = playlists.find(function (p) { return p.id === id; });
        if (playlist && playlist.isRemovable === false) {
            console.warn("Impossible de supprimer la playlist \"".concat(playlist.name, "\" car elle est prot\u00E9g\u00E9e."));
            return;
        }
        set(function (state) { return ({
            playlists: state.playlists.filter(function (playlist) { return playlist.id !== id; }),
            channels: state.channels.filter(function (channel) { return channel.playlistSource !== id; })
        }); });
    }, togglePlaylistStatus: function (id) {
        return set(function (state) { return ({
            playlists: state.playlists.map(function (playlist) {
                return playlist.id === id
                    ? __assign(__assign({}, playlist), { status: playlist.status === types_1.PlaylistStatus.ACTIVE
                            ? types_1.PlaylistStatus.INACTIVE
                            : types_1.PlaylistStatus.ACTIVE, lastUpdate: new Date() }) : playlist;
            })
        }); });
    }, refreshPlaylists: function () { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, activePlaylists, allChannels, _loop_1, _i, activePlaylists_1, playlist, error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    playlists = get().playlists;
                    set({ loading: true, error: null });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    activePlaylists = playlists.filter(function (p) { return p.status === types_1.PlaylistStatus.ACTIVE; });
                    allChannels = [];
                    _loop_1 = function (playlist) {
                        var parseResult, controller_1, timeoutId, response, content, error_2, error_3;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 10, , 11]);
                                    parseResult = void 0;
                                    if (!(playlist.type === 'xtream' &&
                                        ((_a = playlist.xtreamConfig) === null || _a === void 0 ? void 0 : _a.server) &&
                                        ((_b = playlist.xtreamConfig) === null || _b === void 0 ? void 0 : _b.username) &&
                                        ((_c = playlist.xtreamConfig) === null || _c === void 0 ? void 0 : _c.password))) return [3 /*break*/, 2];
                                    return [4 /*yield*/, (0, xtreamParser_1.parseXtreamContent)(playlist.xtreamConfig, playlist.id)];
                                case 1:
                                    parseResult = _e.sent();
                                    return [3 /*break*/, 9];
                                case 2:
                                    if (!(playlist.type === 'url' && playlist.url)) return [3 /*break*/, 8];
                                    controller_1 = new AbortController();
                                    timeoutId = setTimeout(function () { return controller_1.abort(); }, 10000);
                                    _e.label = 3;
                                case 3:
                                    _e.trys.push([3, 6, , 7]);
                                    return [4 /*yield*/, fetch(playlist.url, {
                                            signal: controller_1.signal
                                        })];
                                case 4:
                                    response = _e.sent();
                                    clearTimeout(timeoutId);
                                    if (!response.ok) {
                                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                                    }
                                    return [4 /*yield*/, response.text()];
                                case 5:
                                    content = _e.sent();
                                    parseResult = (0, m3uParser_1.parseM3UContent)(content, playlist.id);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_2 = _e.sent();
                                    clearTimeout(timeoutId);
                                    throw error_2;
                                case 7: return [3 /*break*/, 9];
                                case 8:
                                    if (playlist.content) {
                                        parseResult = (0, m3uParser_1.parseM3UContent)(playlist.content, playlist.id);
                                    }
                                    else {
                                        return [2 /*return*/, "continue"];
                                    }
                                    _e.label = 9;
                                case 9:
                                    if (parseResult.channels.length > 0) {
                                        allChannels.push.apply(allChannels, parseResult.channels);
                                        get().updatePlaylist(playlist.id, {
                                            channelCount: parseResult.channels.length,
                                            status: types_1.PlaylistStatus.ACTIVE
                                        });
                                    }
                                    return [3 /*break*/, 11];
                                case 10:
                                    error_3 = _e.sent();
                                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_3);
                                    get().updatePlaylist(playlist.id, {
                                        status: types_1.PlaylistStatus.ERROR
                                    });
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, activePlaylists_1 = activePlaylists;
                    _d.label = 2;
                case 2:
                    if (!(_i < activePlaylists_1.length)) return [3 /*break*/, 5];
                    playlist = activePlaylists_1[_i];
                    return [5 /*yield**/, _loop_1(playlist)];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    set({
                        channels: allChannels,
                        categories: get().getCategories(),
                        loading: false
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _d.sent();
                    set({
                        error: error_1 instanceof Error ? error_1.message : 'Erreur inconnue',
                        loading: false
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, refreshPlaylist: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var playlists, playlist, parseResult_1, controller_2, timeoutId, response, content, error_4, error_5;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    playlists = get().playlists;
                    playlist = playlists.find(function (p) { return p.id === id; });
                    if (!playlist || playlist.status !== types_1.PlaylistStatus.ACTIVE)
                        return [2 /*return*/];
                    set({ loading: true });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 11, , 12]);
                    if (!(playlist.type === 'xtream' &&
                        ((_a = playlist.xtreamConfig) === null || _a === void 0 ? void 0 : _a.server) &&
                        ((_b = playlist.xtreamConfig) === null || _b === void 0 ? void 0 : _b.username) &&
                        ((_c = playlist.xtreamConfig) === null || _c === void 0 ? void 0 : _c.password))) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, xtreamParser_1.parseXtreamContent)(playlist.xtreamConfig, playlist.id)];
                case 2:
                    parseResult_1 = _d.sent();
                    return [3 /*break*/, 10];
                case 3:
                    if (!(playlist.type === 'url' && playlist.url)) return [3 /*break*/, 9];
                    controller_2 = new AbortController();
                    timeoutId = setTimeout(function () { return controller_2.abort(); }, 10000);
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, fetch(playlist.url, {
                            signal: controller_2.signal
                        })];
                case 5:
                    response = _d.sent();
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.text()];
                case 6:
                    content = _d.sent();
                    parseResult_1 = (0, m3uParser_1.parseM3UContent)(content, playlist.id);
                    return [3 /*break*/, 8];
                case 7:
                    error_4 = _d.sent();
                    clearTimeout(timeoutId);
                    throw error_4;
                case 8: return [3 /*break*/, 10];
                case 9:
                    if (playlist.content) {
                        parseResult_1 = (0, m3uParser_1.parseM3UContent)(playlist.content, playlist.id);
                    }
                    else {
                        throw new Error('Configuration de playlist invalide');
                    }
                    _d.label = 10;
                case 10:
                    if (parseResult_1.channels.length > 0) {
                        set(function (state) { return ({
                            channels: __spreadArray(__spreadArray([], state.channels.filter(function (c) { return c.playlistSource !== playlist.id; }), true), parseResult_1.channels, true),
                            loading: false
                        }); });
                        get().updatePlaylist(id, {
                            channelCount: parseResult_1.channels.length,
                            status: types_1.PlaylistStatus.ACTIVE
                        });
                    }
                    else {
                        throw new Error('Aucune chaîne trouvée dans la playlist');
                    }
                    return [3 /*break*/, 12];
                case 11:
                    error_5 = _d.sent();
                    console.error("Erreur lors du chargement de la playlist ".concat(playlist.name, ":"), error_5);
                    get().updatePlaylist(id, { status: types_1.PlaylistStatus.ERROR });
                    set({ loading: false });
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); }, getChannelsByCategory: function (category) {
        var channels = get().channels;
        return channels.filter(function (channel) { return (channel.group || 'Undefined') === category; });
    }, searchChannels: function (query) {
        var channels = get().channels;
        if (!query.trim())
            return channels;
        var terms = query.toLowerCase().split(' ');
        return channels.filter(function (channel) {
            return terms.every(function (term) {
                return channel.name.toLowerCase().includes(term) ||
                    (channel.group || '').toLowerCase().includes(term);
            });
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
                count: channels.length
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
        playlists: state.playlists
    }); },
    onRehydrateStorage: function () { return function (state) {
        var timeoutId;
        if (state && state.playlists.length === 0) {
            state.playlists = defaultPlaylists;
        }
        if (state) {
            timeoutId = setTimeout(function () { return state.refreshPlaylists(); }, 100);
        }
        return function () { return clearTimeout(timeoutId); };
    }; }
}));
