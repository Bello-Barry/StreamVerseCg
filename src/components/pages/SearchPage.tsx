'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Search, Filter, X, Tv, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ChannelCard from '@/components/ChannelCard';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { SearchFilters, Channel } from '@/types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const SearchPage: React.FC = () => {
  const { channels } = usePlaylistStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addToHistory } = useWatchHistoryStore();
  const {
    searchQuery,
    setCurrentChannel,
    setSearchQuery: setGlobalSearchQuery,
  } = useAppStore();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const languages = new Set<string>();
    const countries = new Set<string>();

    for (const c of channels) {
      if (c.group) categories.add(c.group);
      if (c.language) languages.add(c.language);
      if (c.country) countries.add(c.country);
    }

    return {
      categories: Array.from(categories).sort(),
      languages: Array.from(languages).sort(),
      countries: Array.from(countries).sort(),
    };
  }, [channels]);

  const channelsPreprocessed = useMemo(() => {
    return channels.map((c) => ({
      ...c,
      nameLower: c.name.toLowerCase(),
      groupLower: c.group?.toLowerCase() || '',
    }));
  }, [channels]);

  const searchResults = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    if (!q && !Object.values(filters).some(Boolean)) return [];

    return channelsPreprocessed.filter((c) => {
      if (q && !c.nameLower.includes(q) && !c.groupLower.includes(q))
        return false;
      if (filters.category && c.group !== filters.category) return false;
      if (filters.language && c.language !== filters.language) return false;
      if (filters.country && c.country !== filters.country) return false;
      return true;
    });
  }, [channelsPreprocessed, debouncedSearchQuery, filters]);

  const handlePlayChannel = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel);
      addToHistory(channel, 0);
    },
    [setCurrentChannel, addToHistory]
  );

  const handleToggleFavorite = useCallback(
    (channel: Channel) => {
      toggleFavorite(channel.id);
    },
    [toggleFavorite]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setLocalSearchQuery('');
    setGlobalSearchQuery('');
    inputRef.current?.focus();
  }, [setGlobalSearchQuery]);

  const hasActiveFilters =
    Object.values(filters).some(Boolean) || debouncedSearchQuery.trim();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="flex items-center justify-center space-x-2 text-3xl font-bold mb-2">
          <Search className="h-8 w-8" />
          <span>Recherche de Chaînes</span>
        </h1>
        <p className="text-muted-foreground">
          Trouvez vos chaînes préférées parmi{' '}
          {channels.length.toLocaleString()} chaînes disponibles.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Nom de chaîne, catégorie..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="h-12 pl-10 pr-12 text-lg focus-visible:ring-2"
            aria-label="Rechercher des chaînes"
            tabIndex={0}
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setLocalSearchQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            tabIndex={0}
            aria-label="Afficher/Masquer les filtres"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtres
            {Object.values(filters).filter(Boolean).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              aria-label="Effacer la recherche et les filtres"
            >
              <X className="mr-2 h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {searchResults.length.toLocaleString()} résultat
          {searchResults.length !== 1 ? 's' : ''}
        </div>
      </div>

      {showFilters && (
        <Card className="transition-all animate-in fade-in duration-300">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(['category', 'language', 'country'] as const).map((filterType) => (
                <div key={filterType}>
                  <label
                    htmlFor={`filter-${filterType}`}
                    className="mb-2 block text-sm font-medium capitalize"
                  >
                    {filterType}
                  </label>
                  <Select
                    value={filters[filterType] || ''}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        [filterType]: value || undefined,
                      }))
                    }
                  >
                    <SelectTrigger id={`filter-${filterType}`}>
                      <SelectValue
                        placeholder={`Toutes les ${
                          filterType === 'category' ? 'catégories' : filterType + 's'
                        }`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        Toutes les{' '}
                        {filterType === 'category' ? 'catégories' : filterType + 's'}
                      </SelectItem>
                      {filterOptions[`${filterType}s` as keyof typeof filterOptions].map(
                        (option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {debouncedSearchQuery && (
            <Badge variant="secondary">Recherche : '{debouncedSearchQuery}'</Badge>
          )}
          {Object.entries(filters).map(
            ([key, value]) =>
              value && (
                <Badge
                  key={key}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <span className="capitalize">
                    {key} : {value}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, [key]: undefined }))
                    }
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    aria-label={`Retirer le filtre ${key} : ${value}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
          )}
        </div>
      )}

      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {searchResults.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onPlay={handlePlayChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(channel.id)}
              tabIndex={0}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Tv className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters
              ? "Essayez de modifier ou d'élargir vos critères de recherche."
              : 'Commencez à taper dans la barre de recherche pour trouver des chaînes.'}
          </p>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters}>Effacer la recherche et les filtres</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;