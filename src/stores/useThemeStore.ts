import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme as ThemeEnum } from '@/types';

export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  accent: string;
  muted: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  monospace: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: number;
  glassmorphism: boolean;
  gradients: boolean;
}

export interface ThemeState {
  theme: ThemeDefinition;
  isDark: boolean;
  customSettings: ThemeDefinition;
  availableThemes: ThemeDefinition[]; // ✅ AJOUTÉ
  setTheme: (themeId: string) => void;
  setDarkMode: (isDark: boolean) => void;
  updateCustomColors: (colors: Partial<ThemeColors>) => void;
  updateCustomFonts: (fonts: Partial<ThemeFonts>) => void;
  updateSetting: <K extends keyof ThemeDefinition>(
    key: K,
    value: ThemeDefinition[K]
  ) => void;
  exportTheme: () => string;
  importTheme: (themeData: string) => boolean;
}

// ✅ Exemple de plusieurs thèmes disponibles
const defaultTheme: ThemeDefinition = {
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

const darkTheme: ThemeDefinition = {
  ...defaultTheme,
  id: 'dark',
  name: 'Thème sombre',
  mode: 'dark',
  colors: {
    primary: '#8b5cf6',
    background: '#111827',
    text: '#ffffff',
    accent: '#f43f5e',
    muted: '#9ca3af',
  },
};

export const useThemeManager = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,
      isDark: false,
      customSettings: defaultTheme,
      availableThemes: [defaultTheme, darkTheme], // ✅ AJOUTÉ

      setTheme: (themeId: string) => {
        const found = get().availableThemes.find((t) => t.id === themeId);
        const newTheme = found ?? defaultTheme;
        set({ theme: newTheme, customSettings: newTheme });
      },

      setDarkMode: (isDark: boolean) => {
        set((state) => ({
          isDark,
          customSettings: {
            ...state.customSettings,
            mode: isDark ? 'dark' : 'light',
          },
        }));
      },

      updateCustomColors: (colors: Partial<ThemeColors>) => {
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

      updateCustomFonts: (fonts: Partial<ThemeFonts>) => {
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

      updateSetting: (key, value) => {
        set((state) => ({
          customSettings: {
            ...state.customSettings,
            [key]: value,
          },
        }));
      },

      exportTheme: () => {
        const themeToExport = get().customSettings;
        return JSON.stringify(themeToExport, null, 2);
      },

      importTheme: (themeData: string) => {
        try {
          const imported = JSON.parse(themeData) as ThemeDefinition;
          set({
            theme: imported,
            customSettings: imported,
            isDark: imported.mode === 'dark',
          });
          return true;
        } catch (error) {
          console.error('Erreur import theme :', error);
          return false;
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);