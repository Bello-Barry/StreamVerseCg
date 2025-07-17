"use strict";
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
exports.useWatchHistoryStore = void 0;
var zustand_1 = require("zustand");
var middleware_1 = require("zustand/middleware");
var MAX_HISTORY_ENTRIES = 1000; // Limite pour éviter une croissance excessive
exports.useWatchHistoryStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return ({
    history: [],
    // Actions de base
    addToHistory: function (channel, duration) {
        var newEntry = {
            id: "watch-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
            channel: channel,
            timestamp: new Date(),
            duration: duration,
            completed: duration > 300 // Considéré comme "terminé" si regardé plus de 5 minutes
        };
        set(function (state) {
            // Supprimer l'ancienne entrée pour la même chaîne si elle existe dans les 5 dernières minutes
            var recentThreshold = new Date(Date.now() - 5 * 60 * 1000);
            var filteredHistory = state.history.filter(function (entry) {
                return !(entry.channel.id === channel.id && entry.timestamp > recentThreshold);
            });
            var newHistory = __spreadArray([newEntry], filteredHistory, true);
            // Limiter le nombre d'entrées
            if (newHistory.length > MAX_HISTORY_ENTRIES) {
                newHistory.splice(MAX_HISTORY_ENTRIES);
            }
            return { history: newHistory };
        });
    },
    clearHistory: function () { return set({ history: [] }); },
    getWatchStats: function () {
        var history = get().history;
        // Temps total de visionnage
        var totalWatchTime = history.reduce(function (total, entry) { return total + entry.duration; }, 0);
        // Catégories favorites (par temps de visionnage)
        var categoryTime = {};
        history.forEach(function (entry) {
            var category = entry.channel.group || 'Undefined';
            categoryTime[category] = (categoryTime[category] || 0) + entry.duration;
        });
        var favoriteCategories = Object.entries(categoryTime)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .map(function (_a) {
            var category = _a[0];
            return category;
        });
        // Chaînes les plus regardées
        var channelTime = {};
        history.forEach(function (entry) {
            if (!channelTime[entry.channel.id]) {
                channelTime[entry.channel.id] = { channel: entry.channel, time: 0 };
            }
            channelTime[entry.channel.id].time += entry.duration;
        });
        var mostWatchedChannels = Object.values(channelTime)
            .sort(function (a, b) { return b.time - a.time; })
            .slice(0, 10)
            .map(function (item) { return item.channel; });
        // Série de visionnage (jours consécutifs avec au moins une session)
        var watchingStreak = get().getWatchingStreak();
        return {
            totalWatchTime: totalWatchTime,
            favoriteCategories: favoriteCategories,
            mostWatchedChannels: mostWatchedChannels,
            watchingStreak: watchingStreak
        };
    },
    // Actions étendues
    removeFromHistory: function (entryId) { return set(function (state) { return ({
        history: state.history.filter(function (entry) { return entry.id !== entryId; })
    }); }); },
    clearOldHistory: function (daysOld) {
        var cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        set(function (state) { return ({
            history: state.history.filter(function (entry) { return entry.timestamp > cutoffDate; })
        }); });
    },
    getRecentChannels: function (limit) {
        if (limit === void 0) { limit = 10; }
        var history = get().history;
        var seenChannels = new Set();
        var recentChannels = [];
        for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
            var entry = history_1[_i];
            if (!seenChannels.has(entry.channel.id)) {
                seenChannels.add(entry.channel.id);
                recentChannels.push(entry.channel);
                if (recentChannels.length >= limit)
                    break;
            }
        }
        return recentChannels;
    },
    getMostWatchedChannels: function (limit) {
        if (limit === void 0) { limit = 10; }
        var history = get().history;
        var channelTime = {};
        history.forEach(function (entry) {
            if (!channelTime[entry.channel.id]) {
                channelTime[entry.channel.id] = { channel: entry.channel, time: 0 };
            }
            channelTime[entry.channel.id].time += entry.duration;
        });
        return Object.values(channelTime)
            .sort(function (a, b) { return b.time - a.time; })
            .slice(0, limit)
            .map(function (item) { return item.channel; });
    },
    getWatchTimeByCategory: function () {
        var history = get().history;
        var categoryTime = {};
        history.forEach(function (entry) {
            var category = entry.channel.group || 'Undefined';
            categoryTime[category] = (categoryTime[category] || 0) + entry.duration;
        });
        return categoryTime;
    },
    getWatchingStreak: function () {
        var history = get().history;
        if (history.length === 0)
            return 0;
        // Grouper par jour
        var dayGroups = {};
        history.forEach(function (entry) {
            var dayKey = entry.timestamp.toISOString().split('T')[0];
            if (!dayGroups[dayKey]) {
                dayGroups[dayKey] = [];
            }
            dayGroups[dayKey].push(entry);
        });
        // Calculer la série
        var sortedDays = Object.keys(dayGroups).sort().reverse();
        var streak = 0;
        var currentDate = new Date(); // Corrigé : déclaré en const
        for (var _i = 0, sortedDays_1 = sortedDays; _i < sortedDays_1.length; _i++) {
            var day = sortedDays_1[_i];
            var dayDate = new Date(day);
            var diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === streak) {
                streak++;
            }
            else if (diffDays > streak) {
                break;
            }
        }
        return streak;
    },
    getTotalWatchTime: function () {
        var history = get().history;
        return history.reduce(function (total, entry) { return total + entry.duration; }, 0);
    },
    getWatchHistoryByDate: function (date) {
        var history = get().history;
        var targetDate = date.toISOString().split('T')[0];
        return history.filter(function (entry) {
            return entry.timestamp.toISOString().split('T')[0] === targetDate;
        });
    },
    getWatchHistoryByChannel: function (channelId) {
        var history = get().history;
        return history.filter(function (entry) { return entry.channel.id === channelId; });
    },
    exportHistory: function () { return get().history; },
    importHistory: function (entries) { return set({ history: entries }); }
}); }, {
    name: 'streamverse-watch-history-store',
    storage: (0, middleware_1.createJSONStorage)(function () { return localStorage; }),
    partialize: function (state) { return ({
        // Limiter la persistance aux 500 dernières entrées pour éviter des problèmes de performance
        history: state.history.slice(0, 500)
    }); }
}));
