import { create } from 'zustand';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  border?: string;
  card?: string;
  accent?: string;
}

export interface ThemeFonts {
  body: string;
  heading: string;
  mono: string;
}

export interface ThemeEffects {
  borderRadius: string;
  boxShadow: string;
}

export interface ThemeLayout {
  spacing: number;
  maxWidth: number;
}

export interface ThemeSettings {
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects: ThemeEffects;
  layout: ThemeLayout;

  // ✅ Ajoutés manuellement pour coller à ton usage dans ThemesPage.tsx :
  glassmorphism: boolean;
  gradients: boolean;
  borderRadius: number;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  settings: ThemeSettings;
}

const defaultTheme: ThemeDefinition = {
  id: 'default',
  name: 'Thème par défaut',
  settings: {
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#2563eb',
      secondary: '#7c3aed',
      border: '#e2e8f0',
      card: '#f8fafc',
      accent: '#4f46e5',
    },
    fonts: {
      body: 'Inter, sans-serif',
      heading: 'Poppins, sans-serif',
      mono: 'Fira Code, monospace',
    },
    effects: {
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    layout: {
      spacing: 16,
      maxWidth: 1200,
    },
    glassmorphism: false,
    gradients: false,
    borderRadius: 8,
  },
};

const darkTheme: ThemeDefinition = {
  id: 'dark',
  name: 'Thème sombre',
  settings: {
    colors: {
      background: '#0f172a',
      text: '#f8fafc',
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      border: '#1e293b',
      card: '#1e293b',
      accent: '#6366f1',
    },
    fonts: {
      body: 'Inter, sans-serif',
      heading: 'Poppins, sans-serif',
      mono: 'Fira Code, monospace',
    },
    effects: {
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
    },
    layout: {
      spacing: 16,
      maxWidth: 1200,
    },
    glassmorphism: true,
    gradients: true,
    borderRadius: 10,
  },
};

const defaultThemes: ThemeDefinition[] = [defaultTheme, darkTheme];

export interface ThemeState {
  theme: ThemeDefinition;
  customSettings: ThemeSettings;
  availableThemes: ThemeDefinition[];
  isDark: boolean;

  setTheme: (themeId: string) => void;
  setDarkMode: (isDark: boolean) => void;
  updateCustomColors: (colors: Partial<ThemeColors>) => void;
  updateCustomFonts: (fonts: Partial<ThemeFonts>) => void;
  updateCustomSettings: (settings: Partial<ThemeSettings>) => void;
  resetToDefault: () => void;
  exportTheme: () => string;
  importTheme: (themeData: string) => boolean;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: defaultTheme,
  customSettings: defaultTheme.settings,
  availableThemes: [...defaultThemes],
  isDark: false,

  setTheme: (themeId) => {
    const selected = get().availableThemes.find((t) => t.id === themeId);
    if (selected) {
      set({
        theme: selected,
        customSettings: selected.settings,
      });
    }
  },

  setDarkMode: (isDark) => {
    set({ isDark });
  },

  updateCustomColors: (colors) => {
    set((state) => ({
      customSettings: {
        ...state.customSettings,
        colors: {
          ...state.customSettings.colors,
          ...colors,
        },
      },
    }));
  },

  updateCustomFonts: (fonts) => {
    set((state) => ({
      customSettings: {
        ...state.customSettings,
        fonts: {
          ...state.customSettings.fonts,
          ...fonts,
        },
      },
    }));
  },

  updateCustomSettings: (settings) => {
    set((state) => ({
      customSettings: {
        ...state.customSettings,
        ...settings,
      },
    }));
  },

  resetToDefault: () => {
    set({
      theme: defaultTheme,
      customSettings: defaultTheme.settings,
      isDark: false,
    });
  },

  exportTheme: () => {
    try {
      return JSON.stringify(get().customSettings);
    } catch {
      return '';
    }
  },

  importTheme: (data) => {
    try {
      const parsed = JSON.parse(data) as ThemeSettings;
      set({ customSettings: parsed });
      return true;
    } catch {
      return false;
    }
  },
}));