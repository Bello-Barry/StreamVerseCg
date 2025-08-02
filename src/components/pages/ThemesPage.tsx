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
import { useThemeStore } from '@/stores/useThemeStore';
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
} from 'lucide-react';
import { toast } from 'sonner';
import type { CustomThemeSettings } from '@/types';

type SettingValue = string | boolean | number;

type ThemeColorKey = 'border' | 'background' | 'primary' | 'secondary' | 'accent' | 'card';

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
  } = useThemeStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleThemeChange = useCallback(
    (themeId: string) => setTheme(themeId),
    [setTheme]
  );

  const handleDarkModeToggle = useCallback(
    (dark: boolean) => setDarkMode(dark),
    [setDarkMode]
  );

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
            const success = importTheme(content);
            if (success) {
              toast.success('Thème importé et appliqué avec succès !');
            } else {
              toast.error("Erreur lors de l'importation du thème", {
                description: 'Le fichier est peut-être corrompu ou invalide.',
              });
            }
          } catch (error) {
            toast.error("Erreur critique à l'importation", {
              description:
                error instanceof Error
                  ? error.message
                  : 'Une erreur inconnue est survenue.',
            });
          }
        };
        reader.readAsText(file);
      }
    },
    [importTheme]
  );

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir réinitialiser tous les paramètres de thème ? Cette action est irréversible."
      )
    ) {
      resetToDefault();
      toast.success('Thème réinitialisé aux valeurs par défaut.');
    }
  }, [resetToDefault]);

  const colorInputs: { key: ThemeColorKey; label: string; description: string }[] = [
  { key: 'primary', label: 'Couleur Primaire', description: "Couleur principale de l'interface" },
  { key: 'secondary', label: 'Couleur Secondaire', description: 'Couleur pour les éléments secondaires' },
  { key: 'accent', label: "Couleur d'Accent", description: 'Couleur pour les éléments mis en valeur' },
  { key: 'background', label: 'Arrière-plan', description: 'Couleur de fond principale' },
  { key: 'card', label: 'Cartes', description: 'Couleur de fond des cartes' },
  { key: 'border', label: 'Bordures', description: 'Couleur des bordures' },
];

  const fontOptions = useMemo(
    () => [
      'Inter, system-ui, sans-serif',
      'Poppins, system-ui, sans-serif',
      'Roboto, system-ui, sans-serif',
      'Open Sans, system-ui, sans-serif',
      'Montserrat, system-ui, sans-serif',
      'JetBrains Mono, monospace',
      'Fira Code, monospace',
      'Source Code Pro, monospace',
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
      {/* Barre de contrôle */}
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

<Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" /> Couleurs
          </TabsTrigger>
          <TabsTrigger value="fonts">
            <Type className="mr-2 h-4 w-4" /> Polices
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {colorInputs.map(({ key, label, description }) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="color"
                  value={customSettings.colors[key as keyof typeof customSettings.colors] || '#ffffff'}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="h-10 w-16 p-0"
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fonts" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(['heading', 'body', 'mono'] as const).map((fontKey) => (
            <Card key={fontKey}>
              <CardHeader>
                <CardTitle>
                  {fontKey === 'heading' ? 'Police des Titres' : fontKey === 'body' ? 'Police du Corps' : 'Police Mono'}
                </CardTitle>
                <CardDescription>Sélectionnez une police pour {fontKey}</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={customSettings.fonts[fontKey]}
                  onValueChange={(value) => handleFontChange(fontKey, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une police" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mode Sombre</CardTitle>
              <CardDescription>Activez ou désactivez le thème sombre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Sun className="h-5 w-5" />
                <Switch checked={isDark} onCheckedChange={handleDarkModeToggle} />
                <Moon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Effet Glassmorphism</CardTitle>
              <CardDescription>Ajoute un effet de flou et de transparence</CardDescription>
            </CardHeader>
            <CardContent>
              <Switch
                checked={customSettings.glassmorphism}
                onCheckedChange={(v) => handleSettingChange('glassmorphism', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gradients</CardTitle>
              <CardDescription>Utilise des dégradés dans le thème</CardDescription>
            </CardHeader>
            <CardContent>
              <Switch
                checked={customSettings.gradients}
                onCheckedChange={(v) => handleSettingChange('gradients', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arrondi</CardTitle>
              <CardDescription>Rayon d’arrondi global pour les éléments</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={0}
                max={30}
                step={1}
                value={customSettings.borderRadius}
                onChange={(e) => handleSettingChange('borderRadius', Number(e.target.value))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Aperçu */}
      <div className="rounded-2xl border bg-card p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Aperçu</h2>
          <Badge variant="outline" className="flex items-center gap-2 text-xs">
            <Eye className="h-4 w-4" />
            {currentTheme.name} {isDark && '(sombre)'}
          </Badge>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Voici un aperçu de votre thème personnalisé. Les couleurs, polices et paramètres s’appliquent globalement
            dans l’application.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" /> Bouton
            </Button>
            <Input placeholder="Champ de texte" />
            <Badge>Badge</Badge>
          </div>
        </div>
      </div>

    </div>
  );
}