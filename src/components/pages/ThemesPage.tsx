// src/components/pages/ThemesPage.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeManager, ThemeConfig, CustomThemeSettings } from '@/lib/themes';
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
} from 'lucide-react';
import { toast } from 'sonner';

type SettingValue = string | boolean | number;

export function ThemesPage() {
  const [isClient, setIsClient] = useState(false);

  const {
    theme: currentTheme,
    customSettings,
    availableThemes,
    isDark,
    setTheme,
    setDarkMode,
    updateCustomColors,
    updateCustomFonts,
    updateCustomSettings,
    resetToDefault,
    exportTheme,
    importTheme,
  } = useThemeManager();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleThemeChange = useCallback((themeId: string) => setTheme(themeId), [setTheme]);
  const handleDarkModeToggle = useCallback((dark: boolean) => setDarkMode(dark), [setDarkMode]);

  const handleColorChange = useCallback(
    (colorKey: keyof CustomThemeSettings['colors'], value: string) => {
      updateCustomColors({ [colorKey]: value });
    },
    [updateCustomColors]
  );

  const handleFontChange = useCallback(
    (fontKey: keyof CustomThemeSettings['fonts'], value: string) => {
      updateCustomFonts({ [fontKey]: value });
    },
    [updateCustomFonts]
  );

  const handleSettingChange = useCallback(
    (settingKey: keyof Omit<CustomThemeSettings, 'colors' | 'fonts'>, value: SettingValue) => {
      updateCustomSettings({ [settingKey]: value });
    },
    [updateCustomSettings]
  );

  const handleExportTheme = useCallback(() => {
    const themeData = exportTheme();
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamverse-theme-${currentTheme?.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Thème exporté avec succès !');
  }, [exportTheme, currentTheme]);

  const handleImportTheme = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            if (importTheme(content)) {
              toast.success('Thème importé et appliqué avec succès !');
            } else {
              toast.error("Erreur lors de l'importation du thème", {
                description: 'Le fichier est peut-être corrompu ou invalide.',
              });
            }
          } catch (error) {
            toast.error("Erreur critique à l'importation", {
              description: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
            });
          }
        };
        reader.readAsText(file);
      }
    },
    [importTheme]
  );

  const handleReset = useCallback(() => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres de thème ? Cette action est irréversible.")) {
      resetToDefault();
      toast.success('Thème réinitialisé aux valeurs par défaut.');
    }
  }, [resetToDefault]);

  const colorInputs = useMemo(
    () => [
      { key: 'primary', label: 'Couleur Primaire', description: "Couleur principale de l'interface" },
      { key: 'secondary', label: 'Couleur Secondaire', description: 'Couleur pour les éléments secondaires' },
      { key: 'accent', label: "Couleur d'Accent", description: 'Couleur pour les éléments mis en valeur' },
      { key: 'background', label: 'Arrière-plan', description: 'Couleur de fond principale' },
      { key: 'card', label: 'Cartes', description: 'Couleur de fond des cartes' },
      { key: 'border', label: 'Bordures', description: 'Couleur des bordures' },
    ],
    []
  );

  const fontOptions = useMemo(
    () => [
      'Inter, system-ui, sans-serif', 'Poppins, system-ui, sans-serif', 'Roboto, system-ui, sans-serif',
      'Open Sans, system-ui, sans-serif', 'Montserrat, system-ui, sans-serif', 'JetBrains Mono, monospace',
      'Fira Code, monospace', 'Source Code Pro, monospace',
    ],
    []
  );

  if (!isClient || !currentTheme || !customSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Palette className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Chargement de l&apos;éditeur de thèmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Personnalisation des Thèmes
          </h1>
          <p className="mt-2 text-muted-foreground">
            Personnalisez l&apos;apparence de StreamVerse selon vos préférences.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportTheme} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </Button>
          <Button asChild variant="outline" size="sm">
            <label htmlFor="import-theme-input" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" /> Importer
            </label>
          </Button>
          <input id="import-theme-input" type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
          <Button onClick={handleReset} variant="destructive" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Mode d&apos;Affichage
          </CardTitle>
          <CardDescription>Basculer entre le mode clair et sombre.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Clair</span>
            <Switch checked={isDark} onCheckedChange={handleDarkModeToggle} aria-label="Basculer le mode sombre" />
            <span className="text-sm text-muted-foreground">Sombre</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Thèmes Prédéfinis</CardTitle>
          <CardDescription>Choisissez parmi nos thèmes prédéfinis pour commencer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableThemes.map((theme) => (
              <div
                key={theme.id}
                role="button"
                tabIndex={0}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring ${
                  currentTheme.id === theme.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleThemeChange(theme.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleThemeChange(theme.id)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{theme.name}</h3>
                  {currentTheme.id === theme.id && <Badge variant="default">Actuel</Badge>}
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{theme.description}</p>
                <div className="mb-2 flex gap-1">
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].primary})` }} />
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].secondary})` }} />
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: `hsl(${theme.colors[isDark ? 'dark' : 'light'].accent})` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="colors"><Palette className="mr-2 h-4 w-4" />Couleurs</TabsTrigger>
          <TabsTrigger value="fonts"><Type className="mr-2 h-4 w-4" />Polices</TabsTrigger>
          <TabsTrigger value="effects"><Sparkles className="mr-2 h-4 w-4" />Effets</TabsTrigger>
          <TabsTrigger value="layout"><Settings className="mr-2 h-4 w-4" />Mise en page</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation des Couleurs</CardTitle>
              <CardDescription>Modifiez les couleurs pour créer votre thème unique. Les changements sont appliqués en temps réel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {colorInputs.map(({ key, label, description }) => (
                  <div key={key} className="space-y-2">
                    <label htmlFor={`color-input-${key}`} className="text-sm font-medium">{label}</label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                    <Input
                      id={`color-input-${key}`}
                      placeholder="ex: 262.1 83.3% 57.8%"
                      value={customSettings.colors[key as keyof typeof customSettings.colors] || ''}
                      onChange={(e) => handleColorChange(key as keyof typeof customSettings.colors, e.target.value)}
                      className="flex-1"
                    />
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
              <CardDescription>Choisissez les polices pour les titres, le corps du texte et le code.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['heading', 'body', 'mono'] as const).map((fontType) => (
                <div key={fontType}>
                  <label htmlFor={`font-select-${fontType}`} className="mb-2 block text-sm font-medium">
                    Police {fontType === 'heading' ? 'des Titres' : fontType === 'body' ? 'du Corps' : 'Monospace'}
                  </label>
                  <Select
                    value={customSettings.fonts[fontType]}
                    onValueChange={(value) => handleFontChange(fontType, value)}
                  >
                    <SelectTrigger id={`font-select-${fontType}`}>
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Effets Visuels</CardTitle>
              <CardDescription>Configurez les effets visuels et les animations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="glassmorphism-switch" className="font-medium">Glassmorphisme</label>
                  <p className="text-sm text-muted-foreground">Activer les effets de verre et de transparence.</p>
                </div>
                <Switch
                  id="glassmorphism-switch"
                  checked={customSettings.glassmorphism}
                  onCheckedChange={(value) => handleSettingChange('glassmorphism', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="gradients-switch" className="font-medium">Dégradés</label>
                  <p className="text-sm text-muted-foreground">Utiliser des dégradés de couleurs.</p>
                </div>
                <Switch
                  id="gradients-switch"
                  checked={customSettings.gradients}
                  onCheckedChange={(value) => handleSettingChange('gradients', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mise en Page</CardTitle>
              <CardDescription>Configurez l&apos;apparence générale de l&apos;interface.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="border-radius-select" className="mb-2 block text-sm font-medium">Rayon des Bordures</label>
                <Select
                  value={String(customSettings.borderRadius)}
                  onValueChange={(value) => handleSettingChange('borderRadius', Number(value))}
                >
                  <SelectTrigger id="border-radius-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucun</SelectItem>
                    <SelectItem value="0.3">Petit</SelectItem>
                    <SelectItem value="0.5">Moyen</SelectItem>
                    <SelectItem value="0.75">Grand</SelectItem>
                    <SelectItem value="1">Très grand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Aperçu en Temps Réel</CardTitle>
          <CardDescription>Les modifications sont appliquées automatiquement à l&apos;ensemble de l&apos;application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Exemple de Carte</h3>
                  <p className="text-sm text-muted-foreground">Ceci est un aperçu de votre thème.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Principal</Button>
                <Button variant="secondary" size="sm">Secondaire</Button>
                <Button variant="outline" size="sm">Contour</Button>
              </div>
              <div className="rounded bg-muted p-3">
                <p className="text-sm">Zone de contenu avec un arrière-plan différent.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
