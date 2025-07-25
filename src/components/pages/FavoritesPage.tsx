'use client'

import React, { useMemo, useState, useCallback, useRef } from 'react'
import { Heart, Trash2, Download, Upload, Settings, CheckCircle, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import ChannelCard from '@/components/ChannelCard'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import type { Channel } from '@/types'

// --- Composant AdminPanel ---
const AdminPanel = React.memo(function AdminPanel({ className }: { className?: string }) {
  const [adminSecret, setAdminSecret] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string>('')
  
  const { channels } = usePlaylistStore()
  const { favorites } = useFavoritesStore()

  const generateVerifiedChannels = async () => {
    if (!adminSecret.trim()) {
      toast.error('Veuillez entrer la clé secrète admin')
      return
    }

    if (favorites.length === 0) {
      toast.error('Aucun favori à exporter')
      return
    }

    setIsGenerating(true)

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
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(
          `✅ Fichier généré avec succès ! ${result.channelsCount} chaînes vérifiées`
        )
        setLastGenerated(new Date().toLocaleString('fr-FR'))
        
        // Optionnel: recharger la page pour voir les changements
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(result.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      toast.error('Erreur réseau lors de la génération')
      console.error('Erreur:', error)
    } finally {
      setIsGenerating(false)
    }
  }

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
  )
})

// --- Composant Statistiques ---
const FavoritesStats = React.memo(function FavoritesStats({
  totalFavorites,
  categories
}: {
  totalFavorites: number
  categories: Record<string, Channel[]>
}) {
  const categoriesCount = Object.keys(categories).length
  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => b.length - a.length)[0]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">{totalFavorites}</div>
        <div className="text-sm text-muted-foreground">Chaînes favorites</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">{categoriesCount}</div>
        <div className="text-sm text-muted-foreground">Catégories</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">
          {topCategory ? topCategory[1].length : 0}
        </div>
        <div className="text-sm text-muted-foreground">
          {topCategory ? `${topCategory[0]} (top)` : 'Aucune catégorie'}
        </div>
      </div>
    </div>
  )
})

// --- Sous-composants mémoïsés existants ---
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
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  return (
    <div className="space-y-4">
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            disabled={count === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
          <Button variant="destructive" size="sm" onClick={onClearAll} disabled={count === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Tout supprimer
          </Button>
        </div>
      </div>

      {/* Panneau admin collapsible */}
      <Collapsible open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <CollapsibleContent>
          <AdminPanel className="mt-4" />
        </CollapsibleContent>
      </Collapsible>
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
          <FavoritesStats 
            totalFavorites={favoriteChannels.length}
            categories={favoritesByCategory}
          />

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