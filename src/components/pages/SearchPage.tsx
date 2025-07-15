'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Search, Filter, X, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ChannelCard from '@/components/ChannelCard';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { SearchFilters } from '@/types';

const SearchPage: React.FC = () => {
  const { channels, categories } = usePlaylistStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();
  const { searchQuery, setCurrentChannel } = useAppStore();
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Synchroniser avec le store global
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Options de filtres
  const filterOptions = useMemo(() => {
    const categories = [...new Set(channels.map(c => c.group).filter(Boolean))].sort();
    const languages = [...new Set(channels.map(c => c.language).filter(Boolean))].sort();
    const countries = [...new Set(channels.map(c => c.country).filter(Boolean))].sort();
    
    return { categories, languages, countries };
  }, [channels]);

  // Résultats de recherche
  const searchResults = useMemo(() => {
    let results = channels;
    
    // Filtrer par texte de recherche
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      results = results.filter(channel =>
        channel.name.toLowerCase().includes(query) ||
        (channel.group || '').toLowerCase().includes(query) ||
        (channel.language || '').toLowerCase().includes(query) ||
        (channel.country || '').toLowerCase().includes(query) ||
        (channel.tvgName || '').toLowerCase().includes(query)
      );
    }
    
    // Appliquer les filtres
    if (filters.category) {
      results = results.filter(channel => channel.group === filters.category);
    }
    
    if (filters.language) {
      results = results.filter(channel => channel.language === filters.language);
    }
    
    if (filters.country) {
      results = results.filter(channel => channel.country === filters.country);
    }
    
    return results;
  }, [channels, localSearchQuery, filters]);

  // Statistiques de recherche
  const searchStats = useMemo(() => {
    const totalResults = searchResults.length;
    const categoriesFound = [...new Set(searchResults.map(c => c.group))].length;
    const languagesFound = [...new Set(searchResults.map(c => c.language).filter(Boolean))].length;
    const countriesFound = [...new Set(searchResults.map(c => c.country).filter(Boolean))].length;
    
    return { totalResults, categoriesFound, languagesFound, countriesFound };
  }, [searchResults]);

  const handlePlayChannel = (channel: any) => {
    setCurrentChannel(channel);
    addToHistory(channel, 0);
  };

  const handleToggleFavorite = (channel: any) => {
    toggleFavorite(channel.id);
  };

  const handleClearFilters = () => {
    setFilters({});
    setLocalSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || localSearchQuery.trim();

  return (
    <div className="space-y-6">
      {/* En-tête de recherche */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center space-x-2">
          <Search className="h-8 w-8" />
          <span>Recherche Avancée</span>
        </h1>
        <p className="text-muted-foreground">
          Trouvez vos chaînes préférées parmi {channels.length} chaînes disponibles
        </p>
      </div>

      {/* Barre de recherche principale */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher des chaînes par nom, catégorie, langue..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-12 h-12 text-lg"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contrôles de filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Effacer tout</span>
            </Button>
          )}
        </div>
        
        {/* Statistiques de recherche */}
        <div className="text-sm text-muted-foreground">
          {searchStats.totalResults} résultat{searchStats.totalResults > 1 ? 's' : ''} trouvé{searchStats.totalResults > 1 ? 's' : ''}
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les catégories</SelectItem>
                    {filterOptions.categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Langue</label>
                <Select
                  value={filters.language || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, language: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les langues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les langues</SelectItem>
                    {filterOptions.languages.map(language => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Pays</label>
                <Select
                  value={filters.country || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, country: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {filterOptions.countries.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {localSearchQuery && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Recherche: "{localSearchQuery}"</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalSearchQuery('')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Catégorie: {filters.category}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, category: undefined }))}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.language && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Langue: {filters.language}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, language: undefined }))}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.country && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Pays: {filters.country}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, country: undefined }))}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Résultats de recherche */}
      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {searchResults.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onPlay={handlePlayChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(channel.id)}
              showCategory={true}
            />
          ))}
        </div>
      ) : (
        /* Message si aucun résultat */
        <div className="text-center py-12">
          <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters 
              ? 'Essayez de modifier vos critères de recherche ou vos filtres.'
              : 'Commencez à taper pour rechercher des chaînes.'
            }
          </p>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters}>
              Effacer tous les filtres
            </Button>
          )}
        </div>
      )}

      {/* Statistiques détaillées */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Statistiques de recherche</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{searchStats.totalResults}</div>
                <div className="text-sm text-muted-foreground">Chaînes trouvées</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{searchStats.categoriesFound}</div>
                <div className="text-sm text-muted-foreground">Catégories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{searchStats.languagesFound}</div>
                <div className="text-sm text-muted-foreground">Langues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{searchStats.countriesFound}</div>
                <div className="text-sm text-muted-foreground">Pays</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;

