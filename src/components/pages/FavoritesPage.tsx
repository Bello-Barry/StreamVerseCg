'use client'

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { Heart, Trash2, Download, Upload, TrendingUp, Clock, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ChannelCard from '@/components/ChannelCard'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import type { Channel } from '@/types'

// --- Sous-composants mémoïsés ---

const FavoritesHeader = React.memo(function FavoritesHeader({
  count,
  onExport,
  onImportClick,
  onClearAll,
  loading
}: {
  count: number
  onExport: () => void
  onImportClick: () => void
  onClearAll: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Heart className="h-8 w-8 text-red-500" />
          <span>Favoris Communautaires</span>
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          {count} chaîne{count !== 1 ? 's' : ''} favorite{count !== 1 ? 's' : ''} par la communauté
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onExport} disabled={count === 0 || loading}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button variant="outline" size="sm" onClick={onImportClick} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
        <Button variant="destructive" size="sm" onClick={onClearAll} disabled={count === 0 || loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>
    </div>
  )
})

const FilterControls = React.memo(function FilterControls({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect,
  totalFavorites,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  categories: Record<string, Channel[]>
  selectedCategory: string | null
  onCategorySelect: (category: string | null) => void
  totalFavorites: number
}) {
  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher dans les favoris communautaires..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect(null)}
        >
          Toutes ({totalFavorites})
        </Button>
        {Object.entries(categories).map(([category, channels]) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategorySelect(category)}
          >
            {category}
            <Badge variant="secondary" className="ml-2">
              {channels.length}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  )
})

const FavoritesGrid = React.memo(function FavoritesGrid({
  channels,
  onPlay,
  onToggleFavorite,
  isFavorite,
  showCategory,
  favoriteRecords,
  showVoteCount = false
}: {
  channels: Channel[]
  onPlay: (channel: Channel) => void
  onToggleFavorite: (channel: Channel) => void
  isFavorite: (id: string) => boolean
  showCategory: boolean
  favoriteRecords: any[]
  showVoteCount?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {channels.map((channel) => {
        const favoriteRecord = favoriteRecords.find(f => f.channel_id === channel.id);
        return (
          <div key={channel.id} className="relative">
            <ChannelCard
              channel={channel}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite(channel.id)}
              showCategory={showCategory}
            />
            {showVoteCount && favoriteRecord && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 bg-primary text-primary-foreground"
              >
                <Heart className="h-3 w-3 mr-1" />
                {favoriteRecord.vote_count}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  )
})

const EmptyState = React.memo(function EmptyState({
  reason,
  query,
}: {
  reason: 'no-favorites' | 'no-results' | 'loading'
  query?: string
}) {
  if (reason === 'loading') {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-semibold mb-2">Chargement des favoris...</h3>
        <p className="text-muted-foreground">Récupération des favoris de la communauté.</p>
      </div>
    )
  }

  const isNoResults = reason === 'no-results'
  return (
    <div className="text-center py-12">
      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {isNoResults ? 'Aucun résultat' : 'Aucun favori pour le moment'}
      </h3>
      <p className="text-muted-foreground">
        {isNoResults
          ? `Aucun favori trouvé pour "${query}".`
          : 'Soyez le premier à ajouter des chaînes aux favoris communautaires !'}
      </p>
    </div>
  )
})

// --- Composant principal ---

export default function FavoritesPage() {
  const { channels } = usePlaylistStore()
  const {
    favorites,
    loading,
    error,
    fetchFavorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    getFavoriteChannels,
    getFavoritesByCategory,
    exportFavorites,
    importFavorites,
    getMostPopularFavorites,
    getRecentFavorites
  } = useFavoritesStore()
  const { addToHistory } = useWatchHistoryStore()
  const { setCurrentChannel } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const importInputRef = useRef<HTMLInputElement>(null)

  // Charger les favoris au montage du composant
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const favoriteChannels = useMemo(
    () => getFavoriteChannels(channels),
    [channels, getFavoriteChannels]
  )

  const favoritesByCategory = useMemo(
    () => getFavoritesByCategory(channels),
    [channels, getFavoritesByCategory]
  )

  const popularFavorites = useMemo(() => {
    const popularRecords = getMostPopularFavorites(20);
    const popularIds = popularRecords.map(r => r.channel_id);
    return channels.filter(ch => popularIds.includes(ch.id));
  }, [channels, getMostPopularFavorites])

  const recentFavorites = useMemo(() => {
    const recentRecords = getRecentFavorites(20);
    const recentIds = recentRecords.map(r => r.channel_id);
    return channels.filter(ch => recentIds.includes(ch.id));
  }, [channels, getRecentFavorites])

  const getChannelsForTab = (tab: string) => {
    switch (tab) {
      case 'popular':
        return popularFavorites;
      case 'recent':
        return recentFavorites;
      default:
        return favoriteChannels;
    }
  }

  const filteredChannels = useMemo(() => {
    let filtered = selectedCategory
      ? favoritesByCategory[selectedCategory] || []
      : getChannelsForTab(activeTab)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          (ch.group || '').toLowerCase().includes(query)
      )
    }
    return filtered
  }, [favoriteChannels, favoritesByCategory, popularFavorites, recentFavorites, selectedCategory, searchQuery, activeTab])

  const handlePlayChannel = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel)
      addToHistory(channel, 0)
    },
    [setCurrentChannel, addToHistory]
  )

  const handleToggleFavorite = useCallback(
    async (channel: Channel) => {
      try {
        await toggleFavorite(channel)
        const action = isFavorite(channel.id) ? 'retiré des' : 'ajouté aux'
        toast.success(`${channel.name} ${action} favoris communautaires`)
      } catch (error) {
        toast.error('Erreur lors de la modification des favoris')
      }
    },
    [toggleFavorite, isFavorite]
  )

  const handleClearAllFavorites = useCallback(async () => {
    if (
      favorites.length > 0 &&
      window.confirm(
        `Êtes-vous sûr de vouloir réinitialiser tous les favoris communautaires ? Cette action ne peut pas être annulée.`
      )
    ) {
      try {
        await clearAllFavorites()
        toast.success('Tous les favoris communautaires ont été réinitialisés')
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation des favoris')
      }
    }
  }, [favorites.length, clearAllFavorites])

  const handleExportFavorites = useCallback(() => {
    const dataStr = JSON.stringify(exportFavorites(), null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streamverse-favoris-communautaires-${new Date()
      .toISOString()
      .split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Favoris exportés avec succès')
  }, [exportFavorites])

  const handleImportClick = useCallback(() => importInputRef.current?.click(), [])

  const handleImportFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const favoriteIds = JSON.parse(e.target?.result as string)
          if (
            Array.isArray(favoriteIds) &&
            favoriteIds.every((id) => typeof id === 'string')
          ) {
            await importFavorites(favoriteIds, channels)
            toast.success(`${favoriteIds.length} favoris importés avec succès`)
          } else {
            toast.error(
              "Format de fichier invalide. Le fichier doit être un tableau JSON d'IDs de chaînes."
            )
          }
        } catch {
          toast.error('Erreur lors de la lecture du fichier.')
        }
      }

      reader.readAsText(file)
      event.target.value = '' // Permet de ré-importer le même fichier
    },
    [importFavorites, channels]
  )

  if (loading && favorites.length === 0) {
    return (
      <div className="space-y-6">
        <FavoritesHeader
          count={0}
          onExport={handleExportFavorites}
          onImportClick={handleImportClick}
          onClearAll={handleClearAllFavorites}
          loading={loading}
        />
        <EmptyState reason="loading" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FavoritesHeader
        count={favoriteChannels.length}
        onExport={handleExportFavorites}
        onImportClick={handleImportClick}
        onClearAll={handleClearAllFavorites}
        loading={loading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Erreur lors du chargement des favoris: {error}
          </AlertDescription>
        </Alert>
      )}

      <input
        id="import-favorites"
        type="file"
        accept=".json"
        onChange={handleImportFileSelected}
        ref={importInputRef}
        className="hidden"
      />

      {favoriteChannels.length > 0 ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Tous ({favoriteChannels.length})
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Populaires ({popularFavorites.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Récents ({recentFavorites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <FilterControls
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categories={favoritesByCategory}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                totalFavorites={getChannelsForTab(activeTab).length}
              />

              {filteredChannels.length > 0 ? (
                <FavoritesGrid
                  channels={filteredChannels}
                  onPlay={handlePlayChannel}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                  showCategory={!selectedCategory}
                  favoriteRecords={favorites}
                  showVoteCount={activeTab === 'popular'}
                />
              ) : (
                <EmptyState
                  reason="no-results"
                  query={searchQuery || selectedCategory || ''}
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState reason="no-favorites" />
      )}
    </div>
  )
}