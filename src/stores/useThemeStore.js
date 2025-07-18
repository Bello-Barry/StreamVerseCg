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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThemeManager = void 0;
var zustand_1 = require("zustand");
var middleware_1 = require("zustand/middleware");
// Valeur par défaut
var defaultTheme = {
    id: 'default',
    name: 'Thème par défaut',
    mode: 'light',
    colors: {
        primary: '#3b82f6',
        background: '#ffffff',
        text: '#000000',
        accent: '#f97316',
        muted: '#6b7280',
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        monospace: 'Fira Code, monospace',
    },
    borderRadius: 8,
    glassmorphism: false,
    gradients: false,
};
exports.useThemeManager = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return ({
    theme: defaultTheme,
    isDark: false,
    customSettings: defaultTheme,
    setTheme: function (themeId) {
        // Ici tu pourrais charger un thème existant par ID (depuis un tableau de thèmes si besoin)
        var newTheme = defaultTheme;
        set({ theme: newTheme, customSettings: newTheme });
    },
    setDarkMode: function (isDark) {
        set(function (state) { return ({
            isDark: isDark,
            customSettings: __assign(__assign({}, state.customSettings), { mode: isDark ? 'dark' : 'light' }),
        }); });
    },
    updateCustomColors: function (colors) {
        set(function (state) { return ({
            customSettings: __assign(__assign({}, state.customSettings), { colors: __assign(__assign({}, state.customSettings.colors), colors) }),
        }); });
    },
    updateCustomFonts: function (fonts) {
        set(function (state) { return ({
            customSettings: __assign(__assign({}, state.customSettings), { fonts: __assign(__assign({}, state.customSettings.fonts), fonts) }),
        }); });
    },
    updateSetting: function (key, value) {
        set(function (state) {
            var _a;
            return ({
                customSettings: __assign(__assign({}, state.customSettings), (_a = {}, _a[key] = value, _a)),
            });
        });
    },
    exportTheme: function () {
        var themeToExport = get().customSettings;
        return JSON.stringify(themeToExport, null, 2);
    },
    importTheme: function (themeData) {
        try {
            var imported = JSON.parse(themeData);
            set({
                theme: imported,
                customSettings: imported,
                isDark: imported.mode === 'dark',
            });
            return true;
        }
        catch (error) {
            console.error('Erreur import theme :', error);
            return false;
        }
    },
}); }, {
    name: 'theme-storage',
}));
