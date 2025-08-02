export interface ThemeColors {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  destructive: string
  destructiveForeground: string
}

export interface ThemeConfig {
  id: string
  name: string
  description: string
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  animations: 'none' | 'reduced' | 'normal' | 'enhanced'
  glassmorphism: boolean
  gradients: boolean
  shadows: 'none' | 'subtle' | 'normal' | 'dramatic'
}

export interface CustomThemeSettings {
  selectedTheme: string
  customColors?: Partial<ThemeColors>
  customFonts?: Partial<ThemeConfig['fonts']>
  customSettings?: Partial<Pick<ThemeConfig, 'borderRadius' | 'animations' | 'glassmorphism' | 'gradients' | 'shadows'>>
}

// Predefined themes
export const defaultThemes: ThemeConfig[] = [
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
]

class ThemeManager {
  private currentTheme: ThemeConfig
  private customSettings: CustomThemeSettings
  private isDark: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.customSettings = this.loadCustomSettings();
      this.currentTheme = this.getThemeById(this.customSettings.selectedTheme) || defaultThemes[0];
      this.isDark = this.getSystemTheme() === 'dark';
      this.applyTheme();
      this.setupSystemThemeListener();
    } else {
      // Default values for SSR
      this.customSettings = { selectedTheme: 'streamverse-default' };
      this.currentTheme = defaultThemes[0];
      this.isDark = false; // Default to light mode on server
    }
  }

  private loadCustomSettings(): CustomThemeSettings {
    if (typeof window === 'undefined') {
      return { selectedTheme: 'streamverse-default' };
    }
    try {
      const stored = localStorage.getItem('streamverse_theme_settings');
      if (stored) {
        return { selectedTheme: 'streamverse-default', ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    }
    return { selectedTheme: 'streamverse-default' };
  }

  private saveCustomSettings(): void {
    try {
      localStorage.setItem('streamverse_theme_settings', JSON.stringify(this.customSettings))
    } catch (error) {
      console.warn('Failed to save theme settings:', error)
    }
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        this.isDark = e.matches
        this.applyTheme()
      })
    }
  }

  private getThemeById(id: string): ThemeConfig | undefined {
    return defaultThemes.find(theme => theme.id === id)
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const colors = this.isDark ? this.currentTheme.colors.dark : this.currentTheme.colors.light
    
    // Apply custom colors if any
    const finalColors = { ...colors, ...this.customSettings.customColors }

    // Apply CSS custom properties
    Object.entries(finalColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value)
    })

    // Apply fonts
    const fonts = { ...this.currentTheme.fonts, ...this.customSettings.customFonts }
    root.style.setProperty('--font-heading', fonts.heading)
    root.style.setProperty('--font-body', fonts.body)
    root.style.setProperty('--font-mono', fonts.mono)

    // Apply other settings
    const settings = { ...this.currentTheme, ...this.customSettings.customSettings }
    
    // Border radius
    const radiusMap = {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem'
    }
    root.style.setProperty('--radius', radiusMap[settings.borderRadius])

    // Animations
    root.setAttribute('data-animations', settings.animations)
    
    // Glassmorphism
    root.setAttribute('data-glassmorphism', settings.glassmorphism.toString())
    
    // Gradients
    root.setAttribute('data-gradients', settings.gradients.toString())
    
    // Shadows
    root.setAttribute('data-shadows', settings.shadows)

    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${this.currentTheme.id}`)
    root.classList.toggle('dark', this.isDark)
  }

  setTheme(themeId: string): void {
    const theme = this.getThemeById(themeId)
    if (theme) {
      this.currentTheme = theme
      this.customSettings.selectedTheme = themeId
      this.saveCustomSettings()
      this.applyTheme()
    }
  }

  setDarkMode(isDark: boolean): void {
    this.isDark = isDark
    this.applyTheme()
  }

  updateCustomColors(colors: Partial<ThemeColors>): void {
    this.customSettings.customColors = { ...this.customSettings.customColors, ...colors }
    this.saveCustomSettings()
    this.applyTheme()
  }

  updateCustomFonts(fonts: Partial<ThemeConfig['fonts']>): void {
    this.customSettings.customFonts = { ...this.customSettings.customFonts, ...fonts }
    this.saveCustomSettings()
    this.applyTheme()
  }

  updateCustomSettings(settings: Partial<Pick<ThemeConfig, 'borderRadius' | 'animations' | 'glassmorphism' | 'gradients' | 'shadows'>>): void {
    this.customSettings.customSettings = { ...this.customSettings.customSettings, ...settings }
    this.saveCustomSettings()
    this.applyTheme()
  }

  getCurrentTheme(): ThemeConfig {
    return this.currentTheme
  }

  getCustomSettings(): CustomThemeSettings {
    return { ...this.customSettings }
  }

  getAvailableThemes(): ThemeConfig[] {
    return [...defaultThemes]
  }

  resetToDefault(): void {
    this.customSettings = { selectedTheme: 'streamverse-default' }
    this.currentTheme = defaultThemes[0]
    this.saveCustomSettings()
    this.applyTheme()
  }

  exportTheme(): string {
    return JSON.stringify({
      theme: this.currentTheme,
      customSettings: this.customSettings,
      isDark: this.isDark
    }, null, 2)
  }

  importTheme(themeData: string): boolean {
    try {
      const data = JSON.parse(themeData)
      if (data.customSettings) {
        this.customSettings = data.customSettings
        this.saveCustomSettings()
        this.applyTheme()
        return true
      }
    } catch (error) {
      console.error('Failed to import theme:', error)
    }
    return false
  }
}

// Create singleton instance
export const themeManager = new ThemeManager()

// React hook for theme management
export function useThemeManager() {
  return {
    setTheme: themeManager.setTheme.bind(themeManager),
    setDarkMode: themeManager.setDarkMode.bind(themeManager),
    updateCustomColors: themeManager.updateCustomColors.bind(themeManager),
    updateCustomFonts: themeManager.updateCustomFonts.bind(themeManager),
    updateCustomSettings: themeManager.updateCustomSettings.bind(themeManager),
    getCurrentTheme: themeManager.getCurrentTheme.bind(themeManager),
    getCustomSettings: themeManager.getCustomSettings.bind(themeManager),
    getAvailableThemes: themeManager.getAvailableThemes.bind(themeManager),
    resetToDefault: themeManager.resetToDefault.bind(themeManager),
    exportTheme: themeManager.exportTheme.bind(themeManager),
    importTheme: themeManager.importTheme.bind(themeManager)
  }
}