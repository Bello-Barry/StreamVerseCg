'use client'

import React, { useMemo, useState, useCallback, useRef } from 'react'
import { Heart, Trash2, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
}: {
  count: number
  onExport: () => void
  onImportClick: () => void
  onClearAll: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Heart className="h-8 w-8 text-red-500" />
          <span>Mes Favoris</span>
        </h1>
        <p className="text-muted-foreground">
          {count} chaîne{count !== 1 ? 's' : ''} favorite{count !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onExport} disabled={count === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button variant="outline" size="sm" onClick={onImportClick}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
        <Button variant="destructive" size="sm" onClick={onClearAll} disabled={count === 0}>
          <Trash2 className="h-4 w-4 mr-2" />
          Tout supprimer
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
        placeholder="Rechercher dans vos favoris..."
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
}: {
  channels: Channel[]
  onPlay: (channel: Channel) => void
  onToggleFavorite: (channel: Channel) => void
  isFavorite: (id: string) => boolean
  showCategory: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          onPlay={onPlay}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite(channel.id)}
          showCategory={showCategory}
        />
      ))}
    </div>
  )
})

const EmptyState = React.memo(function EmptyState({
  reason,
  query,
}: {
  reason: 'no-favorites' | 'no-results'
  query?: string
}) {
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
          : 'Ajoutez des chaînes à vos favoris en cliquant sur le cœur.'}
      </p>
    </div>
  )
})

// --- Composant principal ---

export default function FavoritesPage() {
  const { channels } = usePlaylistStore()
  const {
    favorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    getFavoriteChannels,
    getFavoritesByCategory,
    exportFavorites,
    importFavorites
  } = useFavoritesStore()
  const { addToHistory } = useWatchHistoryStore()
  const { setCurrentChannel } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const favoriteChannels = useMemo(
    () => getFavoriteChannels(channels),
    [channels, getFavoriteChannels]
  )

  const favoritesByCategory = useMemo(
    () => getFavoritesByCategory(channels),
    [channels, getFavoritesByCategory]
  )

  const filteredChannels = useMemo(() => {
    let filtered = selectedCategory
      ? favoritesByCategory[selectedCategory] || []
      : favoriteChannels
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          (ch.group || '').toLowerCase().includes(query)
      )
    }
    return filtered
  }, [favoriteChannels, favoritesByCategory, selectedCategory, searchQuery])

  const handlePlayChannel = useCallback(
    (channel: Channel) => {
      setCurrentChannel(channel)
      addToHistory(channel, 0)
    },
    [setCurrentChannel, addToHistory]
  )

  const handleToggleFavorite = useCallback(
    (channel: Channel) => {
      toggleFavorite(channel.id)
      toast.success(`${channel.name} retiré des favoris`)
    },
    [toggleFavorite]
  )

  const handleClearAllFavorites = useCallback(() => {
    if (
      favorites.length > 0 &&
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer tous vos ${favorites.length} favoris ?`
      )
    ) {
      clearAllFavorites()
      toast.success('Tous les favoris ont été supprimés')
    }
  }, [favorites.length, clearAllFavorites])

  const handleExportFavorites = useCallback(() => {
    const dataStr = JSON.stringify(exportFavorites(), null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streamverse-favoris-${new Date()
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const favoriteIds = JSON.parse(e.target?.result as string)
          if (
            Array.isArray(favoriteIds) &&
            favoriteIds.every((id) => typeof id === 'string')
          ) {
            importFavorites(favoriteIds)
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
    [importFavorites]
  )

  return (
    <div className="space-y-6">
      <FavoritesHeader
        count={favoriteChannels.length}
        onExport={handleExportFavorites}
        onImportClick={handleImportClick}
        onClearAll={handleClearAllFavorites}
      />

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
          <FilterControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={favoritesByCategory}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            totalFavorites={favoriteChannels.length}
          />

          {filteredChannels.length > 0 ? (
            <FavoritesGrid
              channels={filteredChannels}
              onPlay={handlePlayChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite}
              showCategory={!selectedCategory}
            />
          ) : (
            <EmptyState
              reason="no-results"
              query={searchQuery || selectedCategory || ''}
            />
          )}
        </>
      ) : (
        <EmptyState reason="no-favorites" />
      )}
    </div>
  )
}