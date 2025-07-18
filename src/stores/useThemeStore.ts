import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeDefinition, ThemeColors, ThemeFonts } from '@/types';

interface ThemeState {
  theme: ThemeDefinition; // ✅ Propriété nécessaire
  isDark: boolean;
  customSettings: {
    colors: ThemeColors;
    fonts: ThemeFonts;
    glassmorphism: boolean;
    gradients: boolean;
    borderRadius: number;
  };
  setTheme: (themeId: string) => void;
  setDarkMode: (isDark: boolean) => void;
  updateCustomColors: (colors: Partial<ThemeColors>) => void;
  updateCustomFonts: (fonts: Partial<ThemeFonts>) => void;
  updateSetting: (key: keyof ThemeState['customSettings'], value: any) => void;
  exportTheme: () => string;
  importTheme: (themeData: string) => boolean;
}

const defaultTheme: ThemeDefinition = {
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
};

export const useThemeManager = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,
      isDark: false,
      customSettings: { ...defaultTheme },
      setTheme: (themeId) => {
        // Ici tu peux ajouter une logique pour charger un thème prédéfini
        set({ theme: defaultTheme }); // pour l'instant on force le thème custom
      },
      setDarkMode: (isDark) => set({ isDark }),
      updateCustomColors: (colors) =>
        set((state) => ({
          customSettings: {
            ...state.customSettings,
            colors: { ...state.customSettings.colors, ...colors },
          },
        })),
      updateCustomFonts: (fonts) =>
        set((state) => ({
          customSettings: {
            ...state.customSettings,
            fonts: { ...state.customSettings.fonts, ...fonts },
          },
        })),
      updateSetting: (key, value) =>
        set((state) => ({
          customSettings: {
            ...state.customSettings,
            [key]: value,
          },
        })),
      exportTheme: () => {
        return JSON.stringify(get().customSettings, null, 2);
      },
      importTheme: (themeData: string) => {
        try {
          const parsed = JSON.parse(themeData);
          if (typeof parsed === 'object') {
            set({
              customSettings: {
                ...get().customSettings,
                ...parsed,
              },
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'theme-manager-store',
    }
  )
);