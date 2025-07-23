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
        this.watchHistory = new Map(); // channelId -> watch count
        this.categoryPreferences = new Map(); // category -> preference score
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
    /**
     * Obtient des recommandations intelligentes de chaînes
     */
    SmartChannelRecommendation.prototype.getSmartRecommendations = function (allChannels, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a = options.maxRecommendations, maxRecommendations = _a === void 0 ? 20 : _a, _b = options.minReliability, minReliability = _b === void 0 ? 50 : _b, _c = options.preferredCategories, preferredCategories = _c === void 0 ? [] : _c, _d = options.excludeOfflineChannels, excludeOfflineChannels = _d === void 0 ? true : _d, _e = options.boostPopularChannels, boostPopularChannels = _e === void 0 ? true : _e;
        // Filtrer les chaînes selon les critères de base
        var filteredChannels = allChannels.filter(function (channel) {
            // Exclure les chaînes hors ligne si demandé
            if (excludeOfflineChannels) {
                var status_1 = channelValidator_1.channelValidator.getChannelStatus(channel.id);
                if (status_1 && status_1.status === 'offline') {
                    return false;
                }
            }
            // Vérifier la fiabilité minimale
            var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
            if (status && status.reliability < minReliability) {
                return false;
            }
            return true;
        });
        // Calculer les scores de recommandation
        var scoredChannels = filteredChannels.map(function (channel) { return ({
            channel: channel,
            score: _this.calculateRecommendationScore(channel, {
                preferredCategories: preferredCategories,
                boostPopularChannels: boostPopularChannels
            })
        }); });
        // Trier par score et retourner les meilleures recommandations
        return scoredChannels
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, maxRecommendations)
            .map(function (item) { return item.channel; });
    };
    /**
     * Obtient les chaînes les plus fiables par catégorie
     */
    SmartChannelRecommendation.prototype.getReliableChannelsByCategory = function (allChannels, category, limit) {
        if (limit === void 0) { limit = 10; }
        var categoryChannels = allChannels.filter(function (channel) { return channel.category.toLowerCase() === category.toLowerCase(); });
        return categoryChannels
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
            // Prioriser les chaînes en ligne
            if (a.isOnline && !b.isOnline)
                return -1;
            if (!a.isOnline && b.isOnline)
                return 1;
            // Puis par fiabilité
            return b.reliability - a.reliability;
        })
            .slice(0, limit)
            .map(function (item) { return item.channel; });
    };
    /**
     * Obtient des alternatives pour une chaîne qui ne fonctionne pas
     */
    SmartChannelRecommendation.prototype.getChannelAlternatives = function (failedChannel, allChannels, limit) {
        var _this = this;
        if (limit === void 0) { limit = 5; }
        // Chercher des chaînes similaires dans la même catégorie
        var sameCategory = allChannels.filter(function (channel) {
            return channel.id !== failedChannel.id &&
                channel.category === failedChannel.category;
        });
        // Chercher des chaînes avec des noms similaires
        var similarNames = allChannels.filter(function (channel) {
            return channel.id !== failedChannel.id &&
                _this.calculateNameSimilarity(channel.name, failedChannel.name) > 0.5;
        });
        // Combiner et scorer les alternatives
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
    /**
     * Met à jour l'historique de visionnage
     */
    SmartChannelRecommendation.prototype.updateWatchHistory = function (channelId, category) {
        // Mettre à jour le compteur de visionnage
        var currentCount = this.watchHistory.get(channelId) || 0;
        this.watchHistory.set(channelId, currentCount + 1);
        // Mettre à jour les préférences de catégorie
        var currentCategoryScore = this.categoryPreferences.get(category) || 0;
        this.categoryPreferences.set(category, currentCategoryScore + 1);
        // Mettre à jour les dernières chaînes regardées
        this.lastWatchedChannels = __spreadArray([
            channelId
        ], this.lastWatchedChannels.filter(function (id) { return id !== channelId; }), true).slice(0, 10); // Garder seulement les 10 dernières
        // Sauvegarder les données
        this.saveUserData();
    };
    /**
     * Obtient les chaînes populaires basées sur l'historique global
     */
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
    /**
     * Obtient les catégories préférées de l'utilisateur
     */
    SmartChannelRecommendation.prototype.getPreferredCategories = function () {
        return Array.from(this.categoryPreferences.entries())
            .map(function (_a) {
            var category = _a[0], score = _a[1];
            return ({ category: category, score: score });
        })
            .sort(function (a, b) { return b.score - a.score; });
    };
    /**
     * Calcule le score de recommandation pour une chaîne
     */
    SmartChannelRecommendation.prototype.calculateRecommendationScore = function (channel, options) {
        var _a;
        var score = 0;
        // Score de base : fiabilité de la chaîne
        var status = channelValidator_1.channelValidator.getChannelStatus(channel.id);
        if (status) {
            score += status.reliability * 0.4; // 40% du score basé sur la fiabilité
            // Bonus pour les chaînes en ligne
            if (status.status === 'online') {
                score += 20;
            }
            // Bonus pour les temps de réponse rapides
            if (status.responseTime && status.responseTime < 2000) {
                score += 10;
            }
        }
        // Score basé sur l'historique de visionnage
        var watchCount = this.watchHistory.get(channel.id) || 0;
        score += Math.min(watchCount * 5, 25); // Maximum 25 points pour l'historique
        // Score basé sur les préférences de catégorie
        var categoryScore = this.categoryPreferences.get(channel.category) || 0;
        score += Math.min(categoryScore * 2, 15); // Maximum 15 points pour la catégorie
        // Bonus pour les catégories préférées spécifiées
        if ((_a = options.preferredCategories) === null || _a === void 0 ? void 0 : _a.includes(channel.category)) {
            score += 15;
        }
        // Bonus pour les chaînes récemment regardées (mais pas trop récentes)
        var recentIndex = this.lastWatchedChannels.indexOf(channel.id);
        if (recentIndex >= 3 && recentIndex <= 7) { // Entre la 4ème et 8ème position
            score += 10;
        }
        // Bonus pour les langues et pays préférés
        if (channel.language && this.userPreferences.preferredLanguages.includes(channel.language)) {
            score += 8;
        }
        if (channel.country && this.userPreferences.preferredCountries.includes(channel.country)) {
            score += 8;
        }
        // Boost pour les chaînes populaires globalement
        if (options.boostPopularChannels) {
            var globalPopularity = this.getGlobalPopularityScore(channel.id);
            score += globalPopularity * 0.1;
        }
        return Math.round(score);
    };
    /**
     * Calcule la similarité entre deux noms de chaînes
     */
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
        // Calcul de distance de Levenshtein simplifiée
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
    /**
     * Obtient le score de popularité global d'une chaîne
     */
    SmartChannelRecommendation.prototype.getGlobalPopularityScore = function (channelId) {
        // Simuler un score de popularité basé sur des données fictives
        // Dans une vraie application, cela viendrait d'analytics globaux
        var hash = this.simpleHash(channelId);
        return hash % 100; // Score entre 0 et 99
    };
    /**
     * Hash simple pour simuler des données
     */
    SmartChannelRecommendation.prototype.simpleHash = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en 32bit integer
        }
        return Math.abs(hash);
    };
    /**
     * Sauvegarde les données utilisateur
     */
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
    /**
     * Charge les données utilisateur
     */
    SmartChannelRecommendation.prototype.loadUserData = function () {
        if (typeof window === 'undefined')
            return;
        try {
            var userData = localStorage.getItem('streamverse_user_recommendations');
            if (!userData)
                return;
            var data = JSON.parse(userData);
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
// Instance singleton
exports.smartRecommendation = new SmartChannelRecommendation();
// Hook React pour utiliser le système de recommandation
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
