'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Filter, 
  Search, 
  Star, 
  Zap, 
  TrendingUp, 
  Clock, 
  Wifi,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Grid3X3,
  List
} from 'lucide-react'
import ChannelCard from '@/components/ChannelCard'
import ChannelCardSkeleton from '@/components/ChannelCardSkeleton'
import { ChannelReliabilityIndicator, GlobalChannelStats } from '@/components/ChannelReliabilityIndicator'
import type { Channel } from '@/types'
import { useChannelValidator } from '@/lib/channelValidator'
import { useSmartRecommendation } from '@/lib/smartChannelRecommendation'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { motion } from 'framer-motion'

interface SmartChannelGridProps {
  channels: Channel[]
  onChannelSelect: (channel: Channel) => void
  showRecommendations?: boolean
  enableFilters?: boolean
  defaultView?: 'grid' | 'list'
  maxChannelsToShow?: number
}

type SortOption = 'name' | 'reliability' | 'category' | 'recent' | 'popular'
type FilterOption = 'all' | 'online' | 'reliable' | 'favorites'

export function SmartChannelGrid({
  channels,
  onChannelSelect,
  showRecommendations = true,
  enableFilters = true,
  defaultView = 'grid'
}: SmartChannelGridProps) {
  // Récupération du mode de vue depuis le localStorage
  const savedViewMode = typeof window !== 'undefined' 
    ? localStorage.getItem('channelViewMode') as 'grid' | 'list' | null
    : null
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('reliability')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(savedViewMode || defaultView)
  const [showOnlyReliable, setShowOnlyReliable] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const gridRef = useRef<HTMLDivElement>(null)

  const { getChannelStatus, validateChannels, getReliableChannels } = useChannelValidator()
  const { 
    getSmartRecommendations, 
    getReliableChannelsByCategory,
    updateWatchHistory,
    getPopularChannels 
  } = useSmartRecommendation()
  
  // Utilisation correcte du store Zustand
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore()

  // Sauvegarde du mode de vue dans localStorage
  useEffect(() => {
    if (viewMode) {
      localStorage.setItem('channelViewMode', viewMode)
    }
  }, [viewMode])

  // Navigation TV avec clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gridRef.current) return
      
      // Vérifie si l'élément est focus pour éviter les conflits
      if (gridRef.current.contains(document.activeElement)) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setCurrentPage(p => Math.min(totalPages, p + 1))
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setCurrentPage(p => Math.max(1, p - 1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [totalPages])

  // Catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(channels.map(c => c.category || '').filter(Boolean))].sort()
    return ['all', ...cats]
  }, [channels])

  // Filtrer et trier les chaînes
  const filteredAndSortedChannels = useMemo(() => {
    let filtered = channels

    // Filtrage par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(channel =>
        channel.name.toLowerCase().includes(term) ||
        (channel.category || '').toLowerCase().includes(term) ||
        (channel.group || '').toLowerCase().includes(term)
      )
    }

    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(channel => channel.category === selectedCategory)
    }

    // Filtrage par statut
    if (filterBy !== 'all') {
      filtered = filtered.filter(channel => {
        const status = getChannelStatus(channel.id)
        
        switch (filterBy) {
          case 'online':
            return status?.status === 'online'
          case 'reliable':
            return status && status.reliability >= 70
          case 'favorites':
            return favorites.includes(channel.id)
          default:
            return true
        }
      })
    }

    // Filtrage par fiabilité
    if (showOnlyReliable) {
      filtered = filtered.filter(channel => {
        const status = getChannelStatus(channel.id)
        return status && status.reliability >= 60
      })
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      const statusA = getChannelStatus(a.id)
      const statusB = getChannelStatus(b.id)

      switch (sortBy) {
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '')
        
        case 'reliability':
          const reliabilityA = statusA?.reliability || 0
          const reliabilityB = statusB?.reliability || 0
          if (reliabilityA !== reliabilityB) {
            return reliabilityB - reliabilityA
          }
          // Si même fiabilité, trier par statut (online en premier)
          if (statusA?.status === 'online' && statusB?.status !== 'online') return -1
          if (statusA?.status !== 'online' && statusB?.status === 'online') return 1
          return 0
        
        case 'category':
          const catCompare = (a.category || '').localeCompare(b.category || '')
          if (catCompare !== 0) return catCompare
          return a.name.localeCompare(b.name)
        
        case 'recent':
          // Tri par dernière vérification (plus récent en premier)
          const timeA = statusA?.lastChecked?.getTime() || 0
          const timeB = statusB?.lastChecked?.getTime() || 0
          return timeB - timeA
        
        case 'popular':
          // Utilisation du vrai score de popularité
          return (b.popularityScore || 0) - (a.popularityScore || 0)
        
        default:
          return 0
      }
    })

    return sorted
  }, [
    channels, 
    searchTerm, 
    selectedCategory, 
    sortBy, 
    filterBy, 
    showOnlyReliable, 
    getChannelStatus, 
    favorites
  ])

  // Pagination
  const paginatedChannels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedChannels.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedChannels, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedChannels.length / itemsPerPage)

  // Recommandations intelligentes
  const recommendations = useMemo(() => {
    if (!showRecommendations) return []
    
    return getSmartRecommendations(channels, {
      maxRecommendations: 10,
      minReliability: 50,
      excludeOfflineChannels: true,
      boostPopularChannels: true
    })
  }, [channels, getSmartRecommendations, showRecommendations])

  // Chaînes populaires
  const popularChannels = useMemo(() => {
    return getPopularChannels(channels, 8)
  }, [channels, getPopularChannels])

  // Chaînes fiables par catégorie
  const reliableByCategory = useMemo(() => {
    if (selectedCategory === 'all') return []
    return getReliableChannelsByCategory(channels, selectedCategory, 5)
  }, [channels, selectedCategory, getReliableChannelsByCategory])

  // Validation en lot des chaînes visibles
  const validateVisibleChannels = useCallback(async () => {
    if (isValidating) return
    
    setIsValidating(true)
    try {
      const channelsToValidate = paginatedChannels
        .filter(channel => {
          const status = getChannelStatus(channel.id)
          return !status || (Date.now() - (status.lastChecked?.getTime() || 0)) > 300000
        })
        .slice(0, 10)
        .map(channel => ({ id: channel.id, url: channel.url }))

      if (channelsToValidate.length > 0) {
        await validateChannels(channelsToValidate)
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
    } finally {
      setIsValidating(false)
    }
  }, [paginatedChannels, getChannelStatus, validateChannels, isValidating])

  // Gestion de la sélection de chaîne
  const handleChannelSelect = useCallback((channel: Channel) => {
    updateWatchHistory(channel.id, channel.category ?? 'inconnue')
    onChannelSelect(channel)
  }, [updateWatchHistory, onChannelSelect])

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy, filterBy, showOnlyReliable])

  return (
    <div 
      className="space-y-6 bg-neutral-900 text-neutral-100 tv:bg-zinc-950 tv:text-zinc-50"
      ref={gridRef}
    >
      {/* Statistiques globales */}
      <GlobalChannelStats />

      {/* Onglets principaux */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes les chaînes</TabsTrigger>
          <TabsTrigger value="recommended">Recommandées</TabsTrigger>
          <TabsTrigger value="popular">Populaires</TabsTrigger>
          <TabsTrigger value="reliable">Fiables</TabsTrigger>
        </TabsList>

        {/* Contenu de l'onglet "Toutes les chaînes" */}
        <TabsContent value="all" className="space-y-4">
          {enableFilters && (
            <Card className="tv:bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres et Recherche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des chaînes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    aria-label="Rechercher des chaînes"
                  />
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'Toutes les catégories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reliability">Fiabilité</SelectItem>
                      <SelectItem value="name">Nom</SelectItem>
                      <SelectItem value="category">Catégorie</SelectItem>
                      <SelectItem value="recent">Récemment vérifié</SelectItem>
                      <SelectItem value="popular">Popularité</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrer par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="reliable">Fiables</SelectItem>
                      <SelectItem value="favorites">Favoris</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      aria-label="Basculer entre vue grille et liste"
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateVisibleChannels}
                      disabled={isValidating}
                      aria-label="Valider les chaînes visibles"
                    >
                      <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Options avancées */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="reliable-only"
                      checked={showOnlyReliable}
                      onCheckedChange={setShowOnlyReliable}
                    />
                    <label htmlFor="reliable-only" className="text-sm">
                      Chaînes fiables uniquement
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résultats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredAndSortedChannels.length} chaîne(s) trouvée(s)
                {searchTerm && ` pour "${searchTerm}"`}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    aria-label="Page précédente"
                  >
                    Précédent
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Page suivante"
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>

            {/* Grille/Liste des chaînes */}
            {paginatedChannels.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune chaîne trouvée</h3>
                  <p className="text-muted-foreground text-center">
                    Essayez de modifier vos critères de recherche ou de filtrage.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-2"
              }>
                {isValidating && [...Array(10)].map((_, i) => (
                  <ChannelCardSkeleton key={`skeleton-${i}`} compact={viewMode === 'list'} />
                ))}
                
                {paginatedChannels.map((channel) => (
                  <motion.div
                    key={`${channel.id}-${currentPage}`}
                    className="relative"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ChannelCard
                      channel={channel}
                      onPlay={() => handleChannelSelect(channel)}
                      onToggleFavorite={() => toggleFavorite(channel.id)}
                      isFavorite={isFavorite(channel.id)}
                      showReliabilityIndicator={true}
                      compact={viewMode === 'list'}
                    />
                    <div className="absolute top-2 right-2">
                      <ChannelReliabilityIndicator
                        channelId={channel.id}
                        channelUrl={channel.url}
                        size="sm"
                      />
                    </div>
                    
                    {/* Badge pour nouvelles chaînes (ajoutées récemment) */}
                    {channel.isNew && (
                      <Badge variant="new" className="absolute top-2 left-2">
                        Nouveau
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contenu de l'onglet "Recommandées" */}
        <TabsContent value="recommended" className="space-y-4">
          <Card className="tv:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recommandations Personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Regardez quelques chaînes pour obtenir des recommandations personnalisées.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommendations.map((channel, index) => (
                    <motion.div 
                      key={`${channel.id}-rec-${index}`}
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ChannelCard
                        channel={channel}
                        onPlay={() => handleChannelSelect(channel)}
                        onToggleFavorite={() => toggleFavorite(channel.id)}
                        isFavorite={isFavorite(channel.id)}
                        showReliabilityIndicator={true}
                        compact={viewMode === 'list'}
                      />
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Recommandé
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenu de l'onglet "Populaires" */}
        <TabsContent value="popular" className="space-y-4">
          <Card className="tv:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Chaînes Populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {popularChannels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune donnée de popularité disponible pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {popularChannels.map((channel, index) => (
                    <motion.div 
                      key={`${channel.id}-pop-${index}`}
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ChannelCard
                        channel={channel}
                        onPlay={() => handleChannelSelect(channel)}
                        onToggleFavorite={() => toggleFavorite(channel.id)}
                        isFavorite={isFavorite(channel.id)}
                        showReliabilityIndicator={true}
                        compact={viewMode === 'list'}
                      />
                      <Badge className="absolute top-2 left-2" variant="default">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Populaire
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenu de l'onglet "Fiables" */}
        <TabsContent value="reliable" className="space-y-4">
          <Card className="tv:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Chaînes les Plus Fiables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const reliableChannels = getReliableChannels(70)
                const channelsWithDetails = reliableChannels
                  .map(status => channels.find(c => c.id === status.id))
                  .filter((channel): channel is Channel => channel !== undefined)

                return channelsWithDetails.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune chaîne fiable détectée. Les chaînes seront validées automatiquement.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {channelsWithDetails.map((channel, index) => (
                      <motion.div 
                        key={`${channel.id}-rel-${index}`}
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <ChannelCard
                          channel={channel}
                          onPlay={() => handleChannelSelect(channel)}
                          onToggleFavorite={() => toggleFavorite(channel.id)}
                          isFavorite={isFavorite(channel.id)}
                          showReliabilityIndicator={true}
                          compact={viewMode === 'list'}
                        />
                        <Badge className="absolute top-2 left-2" variant="default">
                          <Zap className="h-3 w-3 mr-1" />
                          Fiable
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}