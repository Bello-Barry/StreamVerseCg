
// 3. Composant Admin à ajouter à ta page favoris
// components/AdminPanel.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

interface AdminPanelProps {
  className?: string;
}

export function AdminPanel({ className }: AdminPanelProps) {
  const [adminSecret, setAdminSecret] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string>('');
  
  const { channels } = usePlaylistStore();
  const { favorites } = useFavoritesStore();

  const generateVerifiedChannels = async () => {
    if (!adminSecret.trim()) {
      toast.error('Veuillez entrer la clé secrète admin');
      return;
    }

    if (favorites.length === 0) {
      toast.error('Aucun favori à exporter');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/generate-verified-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: adminSecret,
          favorites,
          allChannels: channels,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `✅ Fichier généré avec succès ! ${result.channelsCount} chaînes vérifiées`
        );
        setLastGenerated(new Date().toLocaleString('fr-FR'));
        
        // Optionnel: recharger la page pour voir les changements
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(result.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      toast.error('Erreur réseau lors de la génération');
      console.error('Erreur:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          Panneau Admin
        </CardTitle>
        <CardDescription>
          Générer le fichier des chaînes vérifiées à partir de vos favoris actuels ({favorites.length} chaînes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="admin-secret" className="text-sm font-medium">
            Clé secrète admin :
          </label>
          <Input
            id="admin-secret"
            type="password"
            placeholder="Entrez la clé secrète..."
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
          />
        </div>

        <Button 
          onClick={generateVerifiedChannels} 
          disabled={isGenerating || !adminSecret.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Générer verified-channels.json
            </>
          )}
        </Button>

        {lastGenerated && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Dernière génération : {lastGenerated}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Cette action va créer/remplacer le fichier public/verified-channels.json
        </div>
      </CardContent>
    </Card>
  );
}
