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
exports.useThemeManager = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return ({
    theme: {
        id: 'custom',
        name: 'Thème personnalisé',
        colors: {
            primary: '#0ea5e9',
            secondary: '#9333ea',
            background: '#ffffff',
            text: '#000000',
            card: '#f9fafb',
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter',
            mono: 'JetBrains Mono',
        },
        glassmorphism: false,
        gradients: false,
        borderRadius: 8,
    },
    isDark: false,
    customSettings: {
        colors: {
            primary: '#0ea5e9',
            secondary: '#9333ea',
            background: '#ffffff',
            text: '#000000',
            card: '#f9fafb',
        },
        fonts: {
            heading: 'Inter',
            body: 'Inter',
            mono: 'JetBrains Mono',
        },
        glassmorphism: false,
        gradients: false,
        borderRadius: 8,
    },
    setTheme: function (themeId) {
        // tu peux charger des thèmes prédéfinis ici si tu veux
        console.log('Changement de thème vers', themeId);
    },
    setDarkMode: function (isDark) { return set({ isDark: isDark }); },
    updateCustomColors: function (colors) {
        return set(function (state) { return ({
            customSettings: __assign(__assign({}, state.customSettings), { colors: __assign(__assign({}, state.customSettings.colors), colors) }),
        }); });
    },
    updateCustomFonts: function (fonts) {
        return set(function (state) { return ({
            customSettings: __assign(__assign({}, state.customSettings), { fonts: __assign(__assign({}, state.customSettings.fonts), fonts) }),
        }); });
    },
    updateSetting: function (key, value) {
        return set(function (state) {
            var _a;
            return ({
                customSettings: __assign(__assign({}, state.customSettings), (_a = {}, _a[key] = value, _a)),
            });
        });
    },
    exportTheme: function () {
        return JSON.stringify(get().customSettings, null, 2);
    },
    importTheme: function (themeData) {
        try {
            var parsed = JSON.parse(themeData);
            if (typeof parsed === 'object') {
                set({ customSettings: parsed });
                return true;
            }
            return false;
        }
        catch (_a) {
            return false;
        }
    },
}); }, {
    name: 'theme-settings',
}));
