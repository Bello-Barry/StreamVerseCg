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
exports.useSmartRecommendation = exports.smartRecommendation = void 0;
var channelValidator_1 = require("./channelValidator");
var SmartChannelRecommendation = /** @class */ (function () {
    function SmartChannelRecommendation() {
        this.watchHistory = new Map();
        this.categoryPreferences = new Map();
        this.lastWatchedChannels = [];
        this.userPreferences = {
            preferredLanguages: [],
            preferredCountries: [],
            favoriteCategories: []
        };
        if (typeof window !== 'undefined') {
            this.loadUserData();
        }
    }
    SmartChannelRecommendation.prototype.getSmartRecommendations = function (allChannels, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a = options.maxRecommendations, maxRecommendations = _a === void 0 ? 20 : _a, _b = options.minReliability, minReliability = _b === void 0 ? 50 : _b, _c = options.preferredCategories, preferredCategories = _c === void 0 ? [] : _c, _d = options.excludeOfflineChannels, excludeOfflineChannels = _d === void 0 ? true : _d, _e = options.boostPopularChannels, boostPopularChannels = _e === void 0 ? true : _e;
        var filteredChannels = allChannels.filter(function (channel) {
            var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
            if (excludeOfflineChannels && (status === null || status === void 0 ? void 0 : status.status) === 'offline') {
                return false;
            }
            if (status && status.reliability < minReliability) {
                return false;
            }
            return true;
        });
        var scoredChannels = filteredChannels.map(function (channel) { return ({
            channel: channel,
            score: _this.calculateRecommendationScore(channel, {
                preferredCategories: preferredCategories,
                boostPopularChannels: boostPopularChannels
            })
        }); });
        return scoredChannels
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, maxRecommendations)
            .map(function (item) { return item.channel; });
    };
    SmartChannelRecommendation.prototype.getReliableChannelsByCategory = function (allChannels, category, limit) {
        if (limit === void 0) { limit = 10; }
        return allChannels
            .filter(function (channel) { return channel.category.toLowerCase() === category.toLowerCase(); })
            .map(function (channel) {
            var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
            return {
                channel: channel,
                reliability: (status === null || status === void 0 ? void 0 : status.reliability) || 0,
                isOnline: (status === null || status === void 0 ? void 0 : status.status) === 'online'
            };
        })
            .filter(function (item) { return item.reliability > 0; })
            .sort(function (a, b) {
            if (a.isOnline && !b.isOnline)
                return -1;
            if (!a.isOnline && b.isOnline)
                return 1;
            return b.reliability - a.reliability;
        })
            .slice(0, limit)
            .map(function (item) { return item.channel; });
    };
    SmartChannelRecommendation.prototype.getChannelAlternatives = function (failedChannel, allChannels, limit) {
        var _this = this;
        if (limit === void 0) { limit = 5; }
        var sameCategory = allChannels.filter(function (channel) {
            return channel.id !== failedChannel.id &&
                channel.category === failedChannel.category;
        });
        var similarNames = allChannels.filter(function (channel) {
            return channel.id !== failedChannel.id &&
                _this.calculateNameSimilarity(channel.name, failedChannel.name) > 0.5;
        });
        var alternatives = __spreadArray([], new Set(__spreadArray(__spreadArray([], sameCategory, true), similarNames, true)), true);
        return alternatives
            .map(function (channel) {
            var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
            var reliability = (status === null || status === void 0 ? void 0 : status.reliability) || 0;
            var isOnline = (status === null || status === void 0 ? void 0 : status.status) === 'online';
            var nameSimilarity = _this.calculateNameSimilarity(channel.name, failedChannel.name);
            return {
                channel: channel,
                score: (reliability * 0.6) + (nameSimilarity * 0.3) + (isOnline ? 10 : 0)
            };
        })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, limit)
            .map(function (item) { return item.channel; });
    };
    SmartChannelRecommendation.prototype.updateWatchHistory = function (channelId, category) {
        var currentCount = this.watchHistory.get(channelId) || 0;
        this.watchHistory.set(channelId, currentCount + 1);
        var currentCategoryScore = this.categoryPreferences.get(category) || 0;
        this.categoryPreferences.set(category, currentCategoryScore + 1);
        this.lastWatchedChannels = __spreadArray([
            channelId
        ], this.lastWatchedChannels.filter(function (id) { return id !== channelId; }), true).slice(0, 10);
        this.saveUserData();
    };
    SmartChannelRecommendation.prototype.getPopularChannels = function (allChannels, limit) {
        if (limit === void 0) { limit = 20; }
        var channelStats = Array.from(this.watchHistory.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, limit);
        return channelStats
            .map(function (_a) {
            var channelId = _a[0];
            return allChannels.find(function (c) { return c.id === channelId; });
        })
            .filter(function (channel) { return channel !== undefined; });
    };
    SmartChannelRecommendation.prototype.getPreferredCategories = function () {
        return Array.from(this.categoryPreferences.entries())
            .map(function (_a) {
            var category = _a[0], score = _a[1];
            return ({ category: category, score: score });
        })
            .sort(function (a, b) { return b.score - a.score; });
    };
    SmartChannelRecommendation.prototype.calculateRecommendationScore = function (channel, options) {
        var _a;
        var score = 0;
        var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
        if (status) {
            score += status.reliability * 0.4;
            if (status.status === 'online') {
                score += 20;
            }
            if (status.responseTime && status.responseTime < 2000) {
                score += 10;
            }
        }
        var watchCount = this.watchHistory.get(channel.id) || 0;
        score += Math.min(watchCount * 5, 25);
        var categoryScore = this.categoryPreferences.get(channel.category) || 0;
        score += Math.min(categoryScore * 2, 15);
        if ((_a = options.preferredCategories) === null || _a === void 0 ? void 0 : _a.includes(channel.category)) {
            score += 15;
        }
        var recentIndex = this.lastWatchedChannels.indexOf(channel.id);
        if (recentIndex >= 3 && recentIndex <= 7) {
            score += 10;
        }
        if (channel.language && this.userPreferences.preferredLanguages.includes(channel.language)) {
            score += 8;
        }
        if (channel.country && this.userPreferences.preferredCountries.includes(channel.country)) {
            score += 8;
        }
        if (options.boostPopularChannels) {
            var globalPopularity = this.getGlobalPopularityScore(channel.id);
            score += globalPopularity * 0.1;
        }
        return Math.round(score);
    };
    SmartChannelRecommendation.prototype.calculateNameSimilarity = function (name1, name2) {
        var normalize = function (str) {
            return str.toLowerCase().replace(/[^a-z0-9]/g, '');
        };
        var n1 = normalize(name1);
        var n2 = normalize(name2);
        if (n1 === n2)
            return 1;
        if (n1.includes(n2) || n2.includes(n1))
            return 0.8;
        var maxLength = Math.max(n1.length, n2.length);
        if (maxLength === 0)
            return 1;
        var matches = 0;
        var minLength = Math.min(n1.length, n2.length);
        for (var i = 0; i < minLength; i++) {
            if (n1[i] === n2[i])
                matches++;
        }
        return matches / maxLength;
    };
    SmartChannelRecommendation.prototype.getGlobalPopularityScore = function (channelId) {
        var hash = this.simpleHash(channelId);
        return hash % 100;
    };
    SmartChannelRecommendation.prototype.simpleHash = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    };
    SmartChannelRecommendation.prototype.saveUserData = function () {
        if (typeof window === 'undefined')
            return;
        try {
            var userData = {
                watchHistory: Array.from(this.watchHistory.entries()),
                categoryPreferences: Array.from(this.categoryPreferences.entries()),
                lastWatchedChannels: this.lastWatchedChannels,
                userPreferences: this.userPreferences
            };
            localStorage.setItem('streamverse_user_recommendations', JSON.stringify(userData));
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
        }
    };
    SmartChannelRecommendation.prototype.loadUserData = function () {
        if (typeof window === 'undefined')
            return;
        try {
            var userData = localStorage.getItem('streamverse_user_recommendations');
            if (!userData)
                return;
            var data = void 0;
            try {
                data = JSON.parse(userData);
            }
            catch (e) {
                console.error('Erreur de parsing JSON :', e);
                return;
            }
            this.watchHistory = new Map(data.watchHistory || []);
            this.categoryPreferences = new Map(data.categoryPreferences || []);
            this.lastWatchedChannels = data.lastWatchedChannels || [];
            this.userPreferences = __assign(__assign({}, this.userPreferences), data.userPreferences);
        }
        catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
        }
    };
    return SmartChannelRecommendation;
}());
exports.smartRecommendation = new SmartChannelRecommendation();
function useSmartRecommendation() {
    return {
        getSmartRecommendations: exports.smartRecommendation.getSmartRecommendations.bind(exports.smartRecommendation),
        getReliableChannelsByCategory: exports.smartRecommendation.getReliableChannelsByCategory.bind(exports.smartRecommendation),
        getChannelAlternatives: exports.smartRecommendation.getChannelAlternatives.bind(exports.smartRecommendation),
        updateWatchHistory: exports.smartRecommendation.updateWatchHistory.bind(exports.smartRecommendation),
        getPopularChannels: exports.smartRecommendation.getPopularChannels.bind(exports.smartRecommendation),
        getPreferredCategories: exports.smartRecommendation.getPreferredCategories.bind(exports.smartRecommendation)
    };
}
exports.useSmartRecommendation = useSmartRecommendation;
