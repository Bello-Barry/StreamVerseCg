// src/store/useThemeStore.ts
import { create } from "zustand"

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  text: string
}

export interface ThemeFonts {
  body: string
  heading: string
}

export interface ThemeLayout {
  borderRadius: number
  spacing: number
}

export interface ThemeEffects {
  shadows: boolean
  animations: boolean
}

export interface ThemeDefinition {
  id: string
  name: string
  isDark: boolean
  colors: ThemeColors
  fonts: ThemeFonts
  layout: ThemeLayout
  effects: ThemeEffects
}

export interface ThemeState {
  theme: ThemeDefinition
  availableThemes: ThemeDefinition[]
  setTheme: (themeId: string) => void
  setDarkMode: (isDark: boolean) => void
  updateCustomColors: (colors: Partial<ThemeColors>) => void
  updateCustomFonts: (fonts: Partial<ThemeFonts>) => void
  updateCustomLayout: (layout: Partial<ThemeLayout>) => void
  updateCustomEffects: (effects: Partial<ThemeEffects>) => void
  updateCustomSettings: (settings: Partial<ThemeDefinition>) => void
  resetToDefault: () => void
  exportTheme: () => string
  importTheme: (themeData: string) => boolean
}

const defaultTheme: ThemeDefinition = {
  id: "default",
  name: "Default",
  isDark: false,
  colors: {
    primary: "#4f46e5",
    secondary: "#9333ea",
    background: "#ffffff",
    text: "#000000",
  },
  fonts: {
    body: "Arial, sans-serif",
    heading: "Georgia, serif",
  },
  layout: {
    borderRadius: 8,
    spacing: 16,
  },
  effects: {
    shadows: true,
    animations: true,
  },
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: defaultTheme,
  availableThemes: [defaultTheme],

  setTheme: (themeId) => {
    const theme = get().availableThemes.find((t) => t.id === themeId)
    if (theme) set({ theme })
  },

  setDarkMode: (isDark) => {
    set((state) => ({
      theme: {
        ...state.theme,
        isDark,
      },
    }))
  },

  updateCustomColors: (colors) => {
    set((state) => ({
      theme: {
        ...state.theme,
        colors: {
          ...state.theme.colors,
          ...colors,
        },
      },
    }))
  },

  updateCustomFonts: (fonts) => {
    set((state) => ({
      theme: {
        ...state.theme,
        fonts: {
          ...state.theme.fonts,
          ...fonts,
        },
      },
    }))
  },

  updateCustomLayout: (layout) => {
    set((state) => ({
      theme: {
        ...state.theme,
        layout: {
          ...state.theme.layout,
          ...layout,
        },
      },
    }))
  },

  updateCustomEffects: (effects) => {
    set((state) => ({
      theme: {
        ...state.theme,
        effects: {
          ...state.theme.effects,
          ...effects,
        },
      },
    }))
  },

  updateCustomSettings: (settings) => {
    set((state) => ({
      theme: {
        ...state.theme,
        ...settings,
      },
    }))
  },

  resetToDefault: () => {
    set({ theme: defaultTheme })
  },

  exportTheme: () => {
    return JSON.stringify(get().theme)
  },

  importTheme: (themeData: string) => {
    try {
      const importedTheme = JSON.parse(themeData) as ThemeDefinition
      set({ theme: importedTheme })
      return true
    } catch (error) {
      console.error("Erreur d'import de thème :", error)
      return false
    }
  },
}))