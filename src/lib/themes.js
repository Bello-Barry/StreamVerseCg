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
exports.useThemeManager = exports.themeManager = exports.defaultThemes = void 0;
// Predefined themes
exports.defaultThemes = [
    {
        id: 'streamverse-default',
        name: 'StreamVerse Classic',
        description: 'Le thème par défaut avec des dégradés violets',
        colors: {
            light: {
                primary: '262.1 83.3% 57.8%',
                primaryForeground: '210 40% 98%',
                secondary: '220 14.3% 95.9%',
                secondaryForeground: '220.9 39.3% 11%',
                accent: '220 14.3% 95.9%',
                accentForeground: '220.9 39.3% 11%',
                background: '0 0% 100%',
                foreground: '220.9 39.3% 11%',
                card: '0 0% 100%',
                cardForeground: '220.9 39.3% 11%',
                muted: '220 14.3% 95.9%',
                mutedForeground: '220 8.9% 46.1%',
                border: '220 13% 91%',
                input: '220 13% 91%',
                ring: '262.1 83.3% 57.8%',
                destructive: '0 84.2% 60.2%',
                destructiveForeground: '210 40% 98%'
            },
            dark: {
                primary: '263.4 70% 50.4%',
                primaryForeground: '210 40% 98%',
                secondary: '215 27.9% 16.9%',
                secondaryForeground: '210 40% 98%',
                accent: '215 27.9% 16.9%',
                accentForeground: '210 40% 98%',
                background: '224 71.4% 4.1%',
                foreground: '210 40% 98%',
                card: '224 71.4% 4.1%',
                cardForeground: '210 40% 98%',
                muted: '215 27.9% 16.9%',
                mutedForeground: '217.9 10.6% 64.9%',
                border: '215 27.9% 16.9%',
                input: '215 27.9% 16.9%',
                ring: '263.4 70% 50.4%',
                destructive: '0 62.8% 30.6%',
                destructiveForeground: '210 40% 98%'
            }
        },
        fonts: {
            heading: 'Inter, system-ui, sans-serif',
            body: 'Inter, system-ui, sans-serif',
            mono: 'JetBrains Mono, Consolas, monospace'
        },
        borderRadius: 'md',
        animations: 'normal',
        glassmorphism: true,
        gradients: true,
        shadows: 'normal'
    },
    {
        id: 'ocean-blue',
        name: 'Ocean Blue',
        description: 'Thème bleu océan apaisant',
        colors: {
            light: {
                primary: '200 100% 50%',
                primaryForeground: '210 40% 98%',
                secondary: '200 20% 95%',
                secondaryForeground: '200 50% 15%',
                accent: '200 20% 95%',
                accentForeground: '200 50% 15%',
                background: '0 0% 100%',
                foreground: '200 50% 15%',
                card: '0 0% 100%',
                cardForeground: '200 50% 15%',
                muted: '200 20% 95%',
                mutedForeground: '200 20% 50%',
                border: '200 20% 90%',
                input: '200 20% 90%',
                ring: '200 100% 50%',
                destructive: '0 84.2% 60.2%',
                destructiveForeground: '210 40% 98%'
            },
            dark: {
                primary: '200 100% 60%',
                primaryForeground: '200 100% 10%',
                secondary: '200 30% 20%',
                secondaryForeground: '200 20% 90%',
                accent: '200 30% 20%',
                accentForeground: '200 20% 90%',
                background: '200 50% 5%',
                foreground: '200 20% 90%',
                card: '200 50% 5%',
                cardForeground: '200 20% 90%',
                muted: '200 30% 20%',
                mutedForeground: '200 20% 60%',
                border: '200 30% 20%',
                input: '200 30% 20%',
                ring: '200 100% 60%',
                destructive: '0 62.8% 30.6%',
                destructiveForeground: '210 40% 98%'
            }
        },
        fonts: {
            heading: 'Poppins, system-ui, sans-serif',
            body: 'Open Sans, system-ui, sans-serif',
            mono: 'Fira Code, Consolas, monospace'
        },
        borderRadius: 'lg',
        animations: 'enhanced',
        glassmorphism: true,
        gradients: true,
        shadows: 'dramatic'
    },
    {
        id: 'sunset-orange',
        name: 'Sunset Orange',
        description: 'Thème orange coucher de soleil chaleureux',
        colors: {
            light: {
                primary: '25 95% 53%',
                primaryForeground: '210 40% 98%',
                secondary: '25 20% 95%',
                secondaryForeground: '25 50% 15%',
                accent: '25 20% 95%',
                accentForeground: '25 50% 15%',
                background: '0 0% 100%',
                foreground: '25 50% 15%',
                card: '0 0% 100%',
                cardForeground: '25 50% 15%',
                muted: '25 20% 95%',
                mutedForeground: '25 20% 50%',
                border: '25 20% 90%',
                input: '25 20% 90%',
                ring: '25 95% 53%',
                destructive: '0 84.2% 60.2%',
                destructiveForeground: '210 40% 98%'
            },
            dark: {
                primary: '25 95% 60%',
                primaryForeground: '25 95% 10%',
                secondary: '25 30% 20%',
                secondaryForeground: '25 20% 90%',
                accent: '25 30% 20%',
                accentForeground: '25 20% 90%',
                background: '25 50% 5%',
                foreground: '25 20% 90%',
                card: '25 50% 5%',
                cardForeground: '25 20% 90%',
                muted: '25 30% 20%',
                mutedForeground: '25 20% 60%',
                border: '25 30% 20%',
                input: '25 30% 20%',
                ring: '25 95% 60%',
                destructive: '0 62.8% 30.6%',
                destructiveForeground: '210 40% 98%'
            }
        },
        fonts: {
            heading: 'Montserrat, system-ui, sans-serif',
            body: 'Source Sans Pro, system-ui, sans-serif',
            mono: 'Source Code Pro, Consolas, monospace'
        },
        borderRadius: 'xl',
        animations: 'enhanced',
        glassmorphism: false,
        gradients: true,
        shadows: 'dramatic'
    },
    {
        id: 'forest-green',
        name: 'Forest Green',
        description: 'Thème vert forêt naturel',
        colors: {
            light: {
                primary: '142 76% 36%',
                primaryForeground: '210 40% 98%',
                secondary: '142 20% 95%',
                secondaryForeground: '142 50% 15%',
                accent: '142 20% 95%',
                accentForeground: '142 50% 15%',
                background: '0 0% 100%',
                foreground: '142 50% 15%',
                card: '0 0% 100%',
                cardForeground: '142 50% 15%',
                muted: '142 20% 95%',
                mutedForeground: '142 20% 50%',
                border: '142 20% 90%',
                input: '142 20% 90%',
                ring: '142 76% 36%',
                destructive: '0 84.2% 60.2%',
                destructiveForeground: '210 40% 98%'
            },
            dark: {
                primary: '142 76% 50%',
                primaryForeground: '142 76% 10%',
                secondary: '142 30% 20%',
                secondaryForeground: '142 20% 90%',
                accent: '142 30% 20%',
                accentForeground: '142 20% 90%',
                background: '142 50% 5%',
                foreground: '142 20% 90%',
                card: '142 50% 5%',
                cardForeground: '142 20% 90%',
                muted: '142 30% 20%',
                mutedForeground: '142 20% 60%',
                border: '142 30% 20%',
                input: '142 30% 20%',
                ring: '142 76% 50%',
                destructive: '0 62.8% 30.6%',
                destructiveForeground: '210 40% 98%'
            }
        },
        fonts: {
            heading: 'Roboto, system-ui, sans-serif',
            body: 'Roboto, system-ui, sans-serif',
            mono: 'Roboto Mono, Consolas, monospace'
        },
        borderRadius: 'sm',
        animations: 'normal',
        glassmorphism: false,
        gradients: false,
        shadows: 'subtle'
    },
    {
        id: 'minimal-mono',
        name: 'Minimal Mono',
        description: 'Thème minimaliste monochrome',
        colors: {
            light: {
                primary: '0 0% 20%',
                primaryForeground: '0 0% 98%',
                secondary: '0 0% 96%',
                secondaryForeground: '0 0% 20%',
                accent: '0 0% 96%',
                accentForeground: '0 0% 20%',
                background: '0 0% 100%',
                foreground: '0 0% 20%',
                card: '0 0% 100%',
                cardForeground: '0 0% 20%',
                muted: '0 0% 96%',
                mutedForeground: '0 0% 50%',
                border: '0 0% 90%',
                input: '0 0% 90%',
                ring: '0 0% 20%',
                destructive: '0 84.2% 60.2%',
                destructiveForeground: '210 40% 98%'
            },
            dark: {
                primary: '0 0% 80%',
                primaryForeground: '0 0% 10%',
                secondary: '0 0% 20%',
                secondaryForeground: '0 0% 90%',
                accent: '0 0% 20%',
                accentForeground: '0 0% 90%',
                background: '0 0% 5%',
                foreground: '0 0% 90%',
                card: '0 0% 5%',
                cardForeground: '0 0% 90%',
                muted: '0 0% 20%',
                mutedForeground: '0 0% 60%',
                border: '0 0% 20%',
                input: '0 0% 20%',
                ring: '0 0% 80%',
                destructive: '0 62.8% 30.6%',
                destructiveForeground: '210 40% 98%'
            }
        },
        fonts: {
            heading: 'JetBrains Mono, Consolas, monospace',
            body: 'JetBrains Mono, Consolas, monospace',
            mono: 'JetBrains Mono, Consolas, monospace'
        },
        borderRadius: 'none',
        animations: 'reduced',
        glassmorphism: false,
        gradients: false,
        shadows: 'none'
    }
];
var ThemeManager = /** @class */ (function () {
    function ThemeManager() {
        this.isDark = false;
        if (typeof window !== 'undefined') {
            this.customSettings = this.loadCustomSettings();
            this.currentTheme = this.getThemeById(this.customSettings.selectedTheme) || exports.defaultThemes[0];
            this.isDark = this.getSystemTheme() === 'dark';
            this.applyTheme();
            this.setupSystemThemeListener();
        }
        else {
            // Default values for SSR
            this.customSettings = { selectedTheme: 'streamverse-default' };
            this.currentTheme = exports.defaultThemes[0];
            this.isDark = false; // Default to light mode on server
        }
    }
    ThemeManager.prototype.loadCustomSettings = function () {
        if (typeof window === 'undefined') {
            return { selectedTheme: 'streamverse-default' };
        }
        try {
            var stored = localStorage.getItem('streamverse_theme_settings');
            if (stored) {
                return __assign({ selectedTheme: 'streamverse-default' }, JSON.parse(stored));
            }
        }
        catch (error) {
            console.warn('Failed to load theme settings:', error);
        }
        return { selectedTheme: 'streamverse-default' };
    };
    ThemeManager.prototype.saveCustomSettings = function () {
        try {
            localStorage.setItem('streamverse_theme_settings', JSON.stringify(this.customSettings));
        }
        catch (error) {
            console.warn('Failed to save theme settings:', error);
        }
    };
    ThemeManager.prototype.getSystemTheme = function () {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    };
    ThemeManager.prototype.setupSystemThemeListener = function () {
        var _this = this;
        if (typeof window !== 'undefined') {
            var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', function (e) {
                _this.isDark = e.matches;
                _this.applyTheme();
            });
        }
    };
    ThemeManager.prototype.getThemeById = function (id) {
        return exports.defaultThemes.find(function (theme) { return theme.id === id; });
    };
    ThemeManager.prototype.applyTheme = function () {
        if (typeof document === 'undefined')
            return;
        var root = document.documentElement;
        var colors = this.isDark ? this.currentTheme.colors.dark : this.currentTheme.colors.light;
        // Apply custom colors if any
        var finalColors = __assign(__assign({}, colors), this.customSettings.customColors);
        // Apply CSS custom properties
        Object.entries(finalColors).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            root.style.setProperty("--".concat(key.replace(/([A-Z])/g, '-$1').toLowerCase()), value);
        });
        // Apply fonts
        var fonts = __assign(__assign({}, this.currentTheme.fonts), this.customSettings.customFonts);
        root.style.setProperty('--font-heading', fonts.heading);
        root.style.setProperty('--font-body', fonts.body);
        root.style.setProperty('--font-mono', fonts.mono);
        // Apply other settings
        var settings = __assign(__assign({}, this.currentTheme), this.customSettings.customSettings);
        // Border radius
        var radiusMap = {
            none: '0',
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem'
        };
        root.style.setProperty('--radius', radiusMap[settings.borderRadius]);
        // Animations
        root.setAttribute('data-animations', settings.animations);
        // Glassmorphism
        root.setAttribute('data-glassmorphism', settings.glassmorphism.toString());
        // Gradients
        root.setAttribute('data-gradients', settings.gradients.toString());
        // Shadows
        root.setAttribute('data-shadows', settings.shadows);
        // Apply theme class
        root.className = root.className.replace(/theme-\w+/g, '');
        root.classList.add("theme-".concat(this.currentTheme.id));
        root.classList.toggle('dark', this.isDark);
    };
    ThemeManager.prototype.setTheme = function (themeId) {
        var theme = this.getThemeById(themeId);
        if (theme) {
            this.currentTheme = theme;
            this.customSettings.selectedTheme = themeId;
            this.saveCustomSettings();
            this.applyTheme();
        }
    };
    ThemeManager.prototype.setDarkMode = function (isDark) {
        this.isDark = isDark;
        this.applyTheme();
    };
    ThemeManager.prototype.updateCustomColors = function (colors) {
        this.customSettings.customColors = __assign(__assign({}, this.customSettings.customColors), colors);
        this.saveCustomSettings();
        this.applyTheme();
    };
    ThemeManager.prototype.updateCustomFonts = function (fonts) {
        this.customSettings.customFonts = __assign(__assign({}, this.customSettings.customFonts), fonts);
        this.saveCustomSettings();
        this.applyTheme();
    };
    ThemeManager.prototype.updateCustomSettings = function (settings) {
        this.customSettings.customSettings = __assign(__assign({}, this.customSettings.customSettings), settings);
        this.saveCustomSettings();
        this.applyTheme();
    };
    ThemeManager.prototype.getCurrentTheme = function () {
        return this.currentTheme;
    };
    ThemeManager.prototype.getCustomSettings = function () {
        return __assign({}, this.customSettings);
    };
    ThemeManager.prototype.getAvailableThemes = function () {
        return __spreadArray([], exports.defaultThemes, true);
    };
    ThemeManager.prototype.resetToDefault = function () {
        this.customSettings = { selectedTheme: 'streamverse-default' };
        this.currentTheme = exports.defaultThemes[0];
        this.saveCustomSettings();
        this.applyTheme();
    };
    ThemeManager.prototype.exportTheme = function () {
        return JSON.stringify({
            theme: this.currentTheme,
            customSettings: this.customSettings,
            isDark: this.isDark
        }, null, 2);
    };
    ThemeManager.prototype.importTheme = function (themeData) {
        try {
            var data = JSON.parse(themeData);
            if (data.customSettings) {
                this.customSettings = data.customSettings;
                this.saveCustomSettings();
                this.applyTheme();
                return true;
            }
        }
        catch (error) {
            console.error('Failed to import theme:', error);
        }
        return false;
    };
    return ThemeManager;
}());
// Create singleton instance
exports.themeManager = new ThemeManager();
// React hook for theme management
function useThemeManager() {
    return {
        setTheme: exports.themeManager.setTheme.bind(exports.themeManager),
        setDarkMode: exports.themeManager.setDarkMode.bind(exports.themeManager),
        updateCustomColors: exports.themeManager.updateCustomColors.bind(exports.themeManager),
        updateCustomFonts: exports.themeManager.updateCustomFonts.bind(exports.themeManager),
        updateCustomSettings: exports.themeManager.updateCustomSettings.bind(exports.themeManager),
        getCurrentTheme: exports.themeManager.getCurrentTheme.bind(exports.themeManager),
        getCustomSettings: exports.themeManager.getCustomSettings.bind(exports.themeManager),
        getAvailableThemes: exports.themeManager.getAvailableThemes.bind(exports.themeManager),
        resetToDefault: exports.themeManager.resetToDefault.bind(exports.themeManager),
        exportTheme: exports.themeManager.exportTheme.bind(exports.themeManager),
        importTheme: exports.themeManager.importTheme.bind(exports.themeManager)
    };
}
exports.useThemeManager = useThemeManager;
