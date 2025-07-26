// app/verified-channels/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle, Search, Tv, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChannelCardWithVerified } from '@/components/ChannelCardWithVerified';
import { useVerifiedChannels } from '@/hooks/useVerifiedChannels';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import type { Channel } from '@/types';

export default function VerifiedChannelsPage() {
  const { 
    verifiedChannels, 
    loading, 
    lastUpdated, 
    getVerifiedCount,
    reload 
  } = useVerifiedChannels();
  
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();
  const { setCurrentChannel } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Grouper par catégorie
  const channelsByCategory = useMemo(() => {
    const groups: Record<string, Channel[]> = {};
    verifiedChannels.forEach(channel => {
      const category = channel.group || 'Autres';
      if (!groups[category]) groups[category] = [];
      groups[category].push(channel);
    });
    return groups;
  }, [verifiedChannels]);

  // Filtrer les chaînes
  const filteredChannels = useMemo(() => {
    let filtered = selectedCategory 
      ? channelsByCategory[selectedCategory] || []
      : verifiedChannels;
      
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(query) ||
        (ch.group || '').toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [verifiedChannels, channelsByCategory, selectedCategory, searchQuery]);

  const handlePlayChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    addToHistory(channel, 0);
    toast.success(`Lecture de ${channel.name}`);
  };

  const handleToggleFavorite = (channel: Channel) => {
    toggleFavorite(channel.id);
    const action = isFavorite(channel.id) ? 'retiré des' : 'ajouté aux';
    toast.success(`${channel.name} ${action} favoris`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des chaînes vérifiées...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Chaînes Vérifiées
          </h1>
          <p className="text-muted-foreground">
            {getVerifiedCount()} chaînes testées et validées
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
        <Button onClick={reload} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {verifiedChannels.length > 0 ? (
        <>
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>Répartition des chaînes vérifiées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getVerifiedCount()}</div>
                  <div className="text-sm text-muted-foreground">Chaînes totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(channelsByCategory).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Catégories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-muted-foreground">Taux de qualité</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtres */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une chaîne vérifiée..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Toutes ({getVerifiedCount()})
              </Button>
              {Object.entries(channelsByCategory).map(([category, channels]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {channels.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Grille des chaînes */}
          {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredChannels.map((channel) => (
                <ChannelCardWithVerified
                  key={channel.id}
                  channel={channel}
                  onPlay={handlePlayChannel}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite(channel.id)}
                  showCategory={!selectedCategory}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Aucune chaîne trouvée pour "{searchQuery || selectedCategory}".
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune chaîne vérifiée</h3>
          <p className="text-muted-foreground">
            Le fichier des chaînes vérifiées n'a pas encore été généré.
          </p>
        </div>
      )}
    </div>
  );
}