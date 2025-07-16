// Indique que c'est un composant client
'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeManager, ThemeConfig, CustomThemeSettings } from '@/lib/themes'
import { Palette, Type, Settings, Download, Upload, RotateCcw, Eye, Sun, Moon, Sparkles, Layers } from 'lucide-react'
import { toast } from 'sonner'

// --- Sous-composants mémoïsés pour la performance ---

const PageHeader = React.memo(function PageHeader({ onExport, onImportClick, onReset }: { onExport: () => void; onImportClick: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Thèmes Personnalisés</h1>
        <p className="text-muted-foreground mt-2">Personnalisez l'apparence de StreamVerse selon vos préférences.</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onExport} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Exporter</Button>
        <Button onClick={onImportClick} variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Importer</Button>
        <Button onClick={onReset} variant="outline" size="sm"><RotateCcw className="h-4 w-4 mr-2" />Réinitialiser</Button>
      </div>
    </div>
  )
})

const ThemeModeToggle = React.memo(function ThemeModeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: (dark: boolean) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{isDark ? <Moon /> : <Sun />}Mode d'Affichage</CardTitle>
        <CardDescription>Basculez entre le mode clair et sombre.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-sm">Clair</span>
        <Switch checked={isDark} onCheckedChange={onToggle} aria-label="Toggle dark mode" />
        <span className="text-sm">Sombre</span>
      </CardContent>
    </Card>
  )
})

const ThemeCard = React.memo(function ThemeCard({ theme, isCurrent, isDark, onSelect }: { theme: ThemeConfig; isCurrent: boolean; isDark: boolean; onSelect: (id: string) => void }) {
  const colors = theme.colors[isDark ? 'dark' : 'light'];
  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
      onClick={() => onSelect(theme.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{theme.name}</h3>
        {isCurrent && <Badge variant="default">Actuel</Badge>}
      </div>
      <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
      <div className="flex gap-1">
        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: `hsl(${colors.primary})` }} />
        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: `hsl(${colors.secondary})` }} />
        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: `hsl(${colors.accent})` }} />
      </div>
    </div>
  )
})

// --- Composant principal ---

export default function ThemesPage() {
  const {
    setTheme,
    setDarkMode,
    updateCustomColors,
    resetToDefault,
    exportTheme,
    importTheme,
    currentTheme,
    isDark,
    availableThemes,
  } = useThemeManager()

  const importInputRef = useRef<HTMLInputElement>(null)

  // --- Callbacks mémoïsés ---

  const handleThemeChange = useCallback((themeId: string) => setTheme(themeId), [setTheme])
  const handleDarkModeToggle = useCallback((dark: boolean) => setDarkMode(dark), [setDarkMode])
  const handleImportClick = useCallback(() => importInputRef.current?.click(), [])

  const handleExportTheme = useCallback(() => {
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
    toast.success("Thème exporté avec succès.")
  }, [exportTheme, currentTheme])

  const handleImportTheme = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        if (importTheme(content)) {
          toast.success('Thème importé avec succès!')
        } else {
          toast.error("Erreur lors de l'importation du thème.")
        }
      } catch {
        toast.error("Le fichier sélectionné est invalide.")
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }, [importTheme])

  const handleReset = useCallback(() => {
    toast("Réinitialiser le thème ?", {
        action: {
            label: "Confirmer",
            onClick: () => {
                resetToDefault();
                toast.success("Thème réinitialisé aux valeurs par défaut.");
            },
        },
        cancel: {
            label: "Annuler",
        }
    });
  }, [resetToDefault])
  
  const handleColorChange = useCallback((colorKey: string, value: string) => {
      // Basic validation for HSL format
      const hslRegex = /^\s*(\d{1,3}(\.\d+)?)\s*(\d{1,3}(\.\d+)?)%\s*(\d{1,3}(\.\d+)?)%\s*$/;
      if (hslRegex.test(value)) {
          updateCustomColors({ [colorKey]: value.replace(/%/g, '') });
      } else {
          // You could add a toast error here if you want strict validation
          // For now, it allows partial input without breaking
      }
  }, [updateCustomColors]);


  if (!currentTheme) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Palette className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des thèmes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader onExport={handleExportTheme} onImportClick={handleImportClick} onReset={handleReset} />
      <input ref={importInputRef} type="file" accept=".json" onChange={handleImportTheme} className="hidden" />

      <ThemeModeToggle isDark={isDark} onToggle={handleDarkModeToggle} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye />Thèmes Prédéfinis</CardTitle>
          <CardDescription>Choisissez un thème de base pour commencer.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} isCurrent={currentTheme.id === theme.id} isDark={isDark} onSelect={handleThemeChange} />
          ))}
        </CardContent>
      </Card>
      
      {currentTheme.id === 'custom' && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette/>Personnalisation des Couleurs</CardTitle>
                <CardDescription>Modifiez les couleurs pour créer votre thème unique. Utilisez le format HSL (ex: 262.1 83.3% 57.8%).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {Object.entries(currentTheme.colors[isDark ? 'dark' : 'light']).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                        <label className="text-sm font-medium capitalize">{key}</label>
                        <Input
                            placeholder="ex: 210 40% 96.1%"
                            defaultValue={`${value}`}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                         />
                    </div>
                 ))}
            </CardContent>
        </Card>
      )}

    </div>
  )
}