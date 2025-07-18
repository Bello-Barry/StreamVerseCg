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

// Valeur par défaut
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

export const useThemeManager = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,
      isDark: false,
      customSettings: defaultTheme,

      setTheme: (themeId: string) => {
        // Ici tu pourrais charger un thème existant par ID (depuis un tableau de thèmes si besoin)
        const newTheme = defaultTheme;
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