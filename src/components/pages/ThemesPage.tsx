'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeManager, ThemeConfig, CustomThemeSettings } from '@/lib/themes'
import {
  Palette,
  Type,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Eye,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Zap,
  Square
} from 'lucide-react'

export function ThemesPage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null)
  const [customSettings, setCustomSettings] = useState<CustomThemeSettings | null>(null)
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>([])
  const [isDark, setIsDark] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const {
    setTheme,
    setDarkMode,
    updateCustomColors,
    updateCustomFonts,
    updateCustomSettings,
    getCurrentTheme,
    getCustomSettings,
    getAvailableThemes,
    resetToDefault,
    exportTheme,
    importTheme
  } = useThemeManager()

  useEffect(() => {
    setIsClient(true)
    const loadThemeData = () => {
      setCurrentTheme(getCurrentTheme())
      setCustomSettings(getCustomSettings())
      setAvailableThemes(getAvailableThemes())
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    if (typeof window !== 'undefined') {
      loadThemeData()
      const interval = setInterval(loadThemeData, 1000) // Update every second for live preview
      return () => clearInterval(interval)
    }
  }, [getCurrentTheme, getCustomSettings, getAvailableThemes])

  const handleThemeChange = (themeId: string) => {
    if (!isClient) return
    setTheme(themeId)
  }

  const handleDarkModeToggle = (dark: boolean) => {
    if (!isClient) return
    setIsDark(dark)
    setDarkMode(dark)
  }

  const handleColorChange = (colorKey: string, value: string) => {
    if (!isClient) return
    updateCustomColors({ [colorKey]: value })
  }

  const handleFontChange = (fontKey: string, value: string) => {
    if (!isClient) return
    updateCustomFonts({ [fontKey]: value })
  }

  const handleSettingChange = (settingKey: string, value: any) => {
    if (!isClient) return
    updateCustomSettings({ [settingKey]: value })
  }

  const handleExportTheme = () => {
    if (!isClient) return
    const themeData = exportTheme()
    const blob = new Blob([themeData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `streamverse-theme-${currentTheme?.id}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isClient) return
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (importTheme(content)) {
          alert('Thème importé avec succès!')
        } else {
          alert('Erreur lors de l\'importation du thème')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleReset = () => {
    if (!isClient) return
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres de thème ?')) {
      resetToDefault()
    }
  }

  const colorInputs = [
    { key: 'primary', label: 'Couleur Primaire', description: 'Couleur principale de l\'interface' },
    { key: 'secondary', label: 'Couleur Secondaire', description: 'Couleur secondaire pour les éléments' },
    { key: 'accent', label: 'Couleur d\'Accent', description: 'Couleur pour les éléments mis en valeur' },
    { key: 'background', label: 'Arrière-plan', description: 'Couleur de fond principale' },
    { key: 'card', label: 'Cartes', description: 'Couleur de fond des cartes' },
    { key: 'border', label: 'Bordures', description: 'Couleur des bordures' }
  ]

  const fontOptions = [
    'Inter, system-ui, sans-serif',
    'Poppins, system-ui, sans-serif',
    'Montserrat, system-ui, sans-serif',
    'Roboto, system-ui, sans-serif',
    'Open Sans, system-ui, sans-serif',
    'Source Sans Pro, system-ui, sans-serif',
    'JetBrains Mono, Consolas, monospace',
    'Fira Code, Consolas, monospace',
    'Source Code Pro, Consolas, monospace'
  ]

  if (!isClient || !currentTheme || !customSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des thèmes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Thèmes Personnalisés
          </h1>
          <p className="text-muted-foreground mt-2">
            Personnalisez l'apparence de StreamVerse selon vos préférences
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportTheme} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-theme')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <input
            id="import-theme"
            type="file"
            accept=".json"
            onChange={handleImportTheme}
            className="hidden"
          />
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Theme Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Mode d'Affichage
          </CardTitle>
          <CardDescription>
            Basculer entre le mode clair et sombre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4" />
              <span className="text-sm">Clair</span>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={handleDarkModeToggle}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm">Sombre</span>
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Thèmes Prédéfinis
          </CardTitle>
          <CardDescription>
            Choisissez parmi nos thèmes prédéfinies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableThemes.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  currentTheme.id === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{theme.name}</h3>
                  {currentTheme.id === theme.id && (
                    <Badge variant="default" className="text-xs">Actuel</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                
                {/* Theme Preview */}
                <div className="flex gap-1 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].primary})` }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].secondary})` }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].accent})` }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-1 text-xs">
                  {theme.glassmorphism && <Badge variant="outline" className="text-xs">Glass</Badge>}
                  {theme.gradients && <Badge variant="outline" className="text-xs">Gradients</Badge>}
                  <Badge variant="outline" className="text-xs">{theme.animations}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customization Tabs */}
      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Polices
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Effets
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mise en page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation des Couleurs</CardTitle>
              <CardDescription>
                Modifiez les couleurs pour créer votre thème unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorInputs.map((color) => (
                  <div key={color.key} className="space-y-2">
                    <label className="text-sm font-medium">{color.label}</label>
                    <p className="text-xs text-muted-foreground">{color.description}</p>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 border rounded"
                        onChange={(e) => {
                          const hex = e.target.value
                          // Convert hex to HSL (simplified)
                          handleColorChange(color.key, hex)
                        }}
                      />
                      <Input
                        placeholder="HSL values (e.g., 262.1 83.3% 57.8%)"
                        className="flex-1"
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation des Polices</CardTitle>
              <CardDescription>
                Choisissez les polices pour différents éléments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Police des Titres</label>
                  <Select onValueChange={(value) => handleFontChange('heading', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une police" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font.split(',')[0]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Police du Corps</label>
                  <Select onValueChange={(value) => handleFontChange('body', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une police" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font.split(',')[0]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Police Monospace</label>
                  <Select onValueChange={(value) => handleFontChange('mono', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une police" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.filter(font => font.includes('mono') || font.includes('Mono')).map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font.split(',')[0]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Effets Visuels</CardTitle>
              <CardDescription>
                Configurez les effets visuels et animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Glassmorphisme</div>
                    <div className="text-sm text-muted-foreground">
                      Effets de verre et transparence
                    </div>
                  </div>
                </div>
                <Switch
                  checked={currentTheme.glassmorphism}
                  onCheckedChange={(value) => handleSettingChange('glassmorphism', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Dégradés</div>
                    <div className="text-sm text-muted-foreground">
                      Utiliser des dégradés de couleurs
                    </div>
                  </div>
                </div>
                <Switch
                  checked={currentTheme.gradients}
                  onCheckedChange={(value) => handleSettingChange('gradients', value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Animations</label>
                <Select 
                  value={currentTheme.animations}
                  onValueChange={(value) => handleSettingChange('animations', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="reduced">Réduites</SelectItem>
                    <SelectItem value="normal">Normales</SelectItem>
                    <SelectItem value="enhanced">Améliorées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ombres</label>
                <Select 
                  value={currentTheme.shadows}
                  onValueChange={(value) => handleSettingChange('shadows', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="subtle">Subtiles</SelectItem>
                    <SelectItem value="normal">Normales</SelectItem>
                    <SelectItem value="dramatic">Dramatiques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mise en Page</CardTitle>
              <CardDescription>
                Configurez l'apparence générale de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rayon des Bordures</label>
                <Select 
                  value={currentTheme.borderRadius}
                  onValueChange={(value) => handleSettingChange('borderRadius', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Square className="h-3 w-3" />
                        Aucun
                      </div>
                    </SelectItem>
                    <SelectItem value="sm">Petit</SelectItem>
                    <SelectItem value="md">Moyen</SelectItem>
                    <SelectItem value="lg">Grand</SelectItem>
                    <SelectItem value="xl">Très grand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu en Temps Réel
          </CardTitle>
          <CardDescription>
            Les modifications sont appliquées automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-card">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Exemple de Carte</h3>
                  <p className="text-sm text-muted-foreground">
                    Ceci est un aperçu de votre thème personnalisé
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Bouton Principal</Button>
                <Button variant="secondary" size="sm">Bouton Secondaire</Button>
                <Button variant="outline" size="sm">Bouton Contour</Button>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">
                  Zone de contenu avec arrière-plan en sourdine
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}