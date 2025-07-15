'use client';

import React, { useMemo, useState } from 'react';
import { Heart, Trash2, Download, Upload, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChannelCard from '@/components/ChannelCard';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

const FavoritesPage: React.FC = () => {
  const { channels } = usePlaylistStore();
  const { 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    clearAllFavorites,
    getFavoriteChannels,
    getFavoritesByCategory,
    exportFavorites,
    importFavorites
  } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();
  const { setCurrentChannel } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Chaînes favorites
  const favoriteChannels = useMemo(() => {
    return getFavoriteChannels(channels);
  }, [channels, getFavoriteChannels]);

  // Favoris par catégorie
  const favoritesByCategory = useMemo(() => {
    return getFavoritesByCategory(channels);
  }, [channels, getFavoritesByCategory]);

  // Chaînes filtrées
  const filteredChannels = useMemo(() => {
    let filtered = favoriteChannels;
    
    // Filtrer par catégorie sélectionnée
    if (selectedCategory) {
      filtered = favoritesByCategory[selectedCategory] || [];
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(channel =>
        channel.name.toLowerCase().includes(query) ||
        (channel.group || '').toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [favoriteChannels, favoritesByCategory, selectedCategory, searchQuery]);

  const handlePlayChannel = (channel: any) => {
    setCurrentChannel(channel);
    addToHistory(channel, 0);
  };

  const handleToggleFavorite = (channel: any) => {
    toggleFavorite(channel.id);
    toast.success('Retiré des favoris');
  };

  const handleClearAllFavorites = () => {
    if (favorites.length === 0) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer tous vos ${favorites.length} favoris ?`)) {
      clearAllFavorites();
      toast.success('Tous les favoris ont été supprimés');
    }
  };

  const handleExportFavorites = () => {
    const favoriteIds = exportFavorites();
    const dataStr = JSON.stringify(favoriteIds, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamverse-favoris-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Favoris exportés avec succès');
  };

  const handleImportFavorites = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const favoriteIds = JSON.parse(e.target?.result as string);
        if (Array.isArray(favoriteIds)) {
          importFavorites(favoriteIds);
          toast.success(`${favoriteIds.length} favoris importés avec succès`);
        } else {
          toast.error('Format de fichier invalide');
        }
      } catch (error) {
        toast.error('Erreur lors de l\'importation du fichier');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Heart className="h-8 w-8 text-red-500" />
            <span>Mes Favoris</span>
          </h1>
          <p className="text-muted-foreground">
            {favoriteChannels.length} chaîne{favoriteChannels.length > 1 ? 's' : ''} favorite{favoriteChannels.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFavorites}
            disabled={favorites.length === 0}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-favorites')?.click()}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Importer</span>
          </Button>
          
          <input
            id="import-favorites"
            type="file"
            accept=".json"
            onChange={handleImportFavorites}
            className="hidden"
          />
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllFavorites}
            disabled={favorites.length === 0}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Tout supprimer</span>
          </Button>
        </div>
      </div>

      {favoriteChannels.length > 0 ? (
        <>
          {/* Contrôles de filtrage */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher dans vos favoris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filtres par catégorie */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Toutes ({favoriteChannels.length})
              </Button>
              
              {Object.entries(favoritesByCategory).map(([category, channels]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center space-x-1"
                >
                  <span>{category}</span>
                  <Badge variant="secondary" className="ml-1">
                    {channels.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Statistiques par catégorie */}
          {Object.keys(favoritesByCategory).length > 1 && !selectedCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5" />
                  <span>Répartition par catégorie</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(favoritesByCategory)
                    .sort(([,a], [,b]) => b.length - a.length)
                    .map(([category, channels]) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {channels.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {category}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grille des chaînes */}
          {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredChannels.map((channel) => (
                <ChannelCard
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
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `Aucun favori trouvé pour "${searchQuery}"`
                  : `Aucun favori dans la catégorie "${selectedCategory}"`
                }
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-2"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Message si aucun favori */
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun favori pour le moment</h3>
          <p className="text-muted-foreground mb-6">
            Ajoutez des chaînes à vos favoris en cliquant sur le cœur lors de la navigation.
          </p>
          <Button onClick={() => window.history.back()}>
            Retour à l'accueil
          </Button>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;

