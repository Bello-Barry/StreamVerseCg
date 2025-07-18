import { create } from 'zustand';
import { Theme } from '@/types';

interface ThemeColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  [key: string]: string | undefined;
}

interface ThemeFonts {
  heading?: string;
  body?: string;
  [key: string]: string | undefined;
}

interface ThemeStoreState {
  theme: Theme;
  darkMode: boolean;
  customColors: ThemeColors;
  customFonts: ThemeFonts;

  setTheme: (theme: Theme) => void;
  setDarkMode: (isDark: boolean) => void;
  updateCustomColors: (colors: Partial<ThemeColors>) => void;
  updateCustomFonts: (fonts: Partial<ThemeFonts>) => void;
  resetCustomizations: () => void;
  importTheme: (themeData: string) => boolean;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  theme: Theme.SYSTEM,
  darkMode: false,
  customColors: {},
  customFonts: {},

  setTheme: (theme) => set({ theme }),
  setDarkMode: (isDark) => set({ darkMode: isDark }),
  updateCustomColors: (colors) =>
    set((state) => ({
      customColors: { ...state.customColors, ...colors },
    })),
  updateCustomFonts: (fonts) =>
    set((state) => ({
      customFonts: { ...state.customFonts, ...fonts },
    })),
  resetCustomizations: () =>
    set({
      customColors: {},
      customFonts: {},
    }),
  importTheme: (themeData: string) => {
    try {
      const parsed = JSON.parse(themeData);
      const { colors, fonts, theme, darkMode } = parsed;

      set((state) => ({
        customColors: { ...state.customColors, ...colors },
        customFonts: { ...state.customFonts, ...fonts },
        theme: theme ?? state.theme,
        darkMode: darkMode ?? state.darkMode,
      }));

      return true;
    } catch (error) {
      console.error('Échec de l’importation du thème :', error);
      return false;
    }
  },
}));