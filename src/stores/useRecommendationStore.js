"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRecommendationStore = void 0;
var zustand_1 = require("zustand");
var smartChannelRecommendation_1 = require("@/lib/smartChannelRecommendation");
exports.useRecommendationStore = (0, zustand_1.create)(function (set) { return ({
    recommendations: [],
    setRecommendations: function (channels, preferences) {
        var result = smartChannelRecommendation_1.smartRecommendation.getSmartRecommendations(channels, {
            preferredCategories: preferences.preferredCategories
        });
        set({ recommendations: result });
    },
}); });
