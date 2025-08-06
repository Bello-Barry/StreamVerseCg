'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Palette,
  Droplet,
  Sun,
  Moon,
  Monitor,
  Maximize2,
  Plus,
  Save,
  Brush,
  ChevronDown,
  Text,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import type { ThemeDefinition, Theme, ThemeColors } from '@/types';
import { useAppStore } from '@/stores/useAppStore';

// Définition de thèmes par défaut pour la démonstration
const defaultThemes: ThemeDefinition[] = [
  {
    id: 'streamverse-default',
    name: 'StreamVerse Par défaut',
    colors: {
      primary: '#0D9488', // teal-600
      secondary: '#E2E8F0', // slate-200
      background: '#0F172A', // slate-900
      text: '#F1F5F9', // slate-100
      card: '#1E293B', // slate-800
    },
    fonts: {
      heading: 'font-sans',
      body: 'font-sans',
      mono: 'font-mono',
    },
    glassmorphism: false,
    gradients: false,
    borderRadius: 0.5,
  },
];

type CustomTheme = {
  name: string;
  colors: ThemeColors;
};

const ThemesPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { userPreferences, updateUserPreferences } = useAppStore();
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeColors, setNewThemeColors] = useState<ThemeColors>({
    primary: '#007BFF',
    secondary: '#6C757D',
    background: '#FFFFFF',
    text: '#212529',
    card: '#F8F9FA',
  });

  const handleCreateTheme = () => {
    if (!newThemeName.trim()) {
      toast.error('Le nom du thème ne peut pas être vide.');
      return;
    }
    const newCustomTheme: CustomTheme = {
      name: newThemeName,
      colors: newThemeColors,
    };
    setCustomThemes([...customThemes, newCustomTheme]);
    setNewThemeName('');
    toast.success(`Le thème "${newThemeName}" a été créé.`);
  };

  const handleSaveTheme = () => {
    toast.info('La sauvegarde de thème n\'est pas encore implémentée.');
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setNewThemeColors((prevColors) => ({ ...prevColors, [key]: value }));
  };

  const currentTheme = userPreferences.theme;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palette className="h-8 w-8" />
          Thèmes & Apparence
        </h1>
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brush className="h-5 w-5 text-primary" />
              Thèmes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="theme-select" className="min-w-[100px]">Thème de l'application</Label>
              <Select value={currentTheme} onValueChange={(value) => setTheme(value as Theme)}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Theme.LIGHT}><Sun className="h-4 w-4 mr-2" /> Clair</SelectItem>
                  <SelectItem value={Theme.DARK}><Moon className="h-4 w-4 mr-2" /> Sombre</SelectItem>
                  <SelectItem value={Theme.SYSTEM}><Monitor className="h-4 w-4 mr-2" /> Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {customThemes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mt-4">Mes thèmes personnalisés</h3>
                  {customThemes.map((theme) => (
                    <div key={theme.name} className="flex items-center justify-between p-2 border rounded-md mt-2">
                      <span>{theme.name}</span>
                      <div className="flex items-center gap-2">
                         <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: theme.colors.primary }}
                          title="Couleur Primaire"
                        />
                        <Button variant="outline" size="sm">Appliquer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between mt-4">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un thème personnalisé
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <Input
                  placeholder="Nom du thème"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(newThemeColors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                        className="h-10 w-10 p-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleCreateTheme} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer ce thème
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Text className="h-5 w-5 text-primary" />
              Paramètres d'affichage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                <Label>Mode plein écran par défaut</Label>
              </div>
              <Switch
                checked={userPreferences.fullscreenOnPlay}
                onCheckedChange={(checked) => updateUserPreferences({ fullscreenOnPlay: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4" />
                <Label>Afficher le glassmorphism (Effet de verre)</Label>
              </div>
              <Switch
                checked={userPreferences.glassmorphism}
                onCheckedChange={(checked) => updateUserPreferences({ glassmorphism: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ThemesPage;
