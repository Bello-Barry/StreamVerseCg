'use client'

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { 
  Heart, 
  Trash2, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  Shield, 
  AlertCircle, 
  Search,
  Filter,
  Grid3X3,
  List,
  RefreshCw,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import ChannelCard from '@/components/ChannelCard' // On suppose que ce composant existe
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import type { Channel } from '@/types'

// --- Types pour les améliorations ---
type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'category' | 'recent' | 'most-watched'
type FilterOption = 'all' | 'verified' | 'unverified'

// Types pour l'import/export
type ExportedChannel = Omit<Channel, 'tvg'> & { verified: boolean; exportedAt: string }
type ExportDataV2 = {
  version: string
  exportDate: string
  totalFavorites: number
  verifiedCount: number
  favorites: ExportedChannel[]
}
type OldExportData = string[]

// --- Store simulé pour les chaînes vérifiées ---
// NOTE: Pour une vraie application, ceci devrait être un vrai store Zustand
// pour éviter de recharger le fichier à chaque rendu.
const useVerifiedChannelsStore = () => {
  const [verifiedChannelIds, setVerifiedChannelIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVerified = async () => {
      try {
        const response = await fetch('/verified-channels.json')
        if (response.ok) {
          const data = await response.json()
          const channelIds = data.channels?.map((ch: { id: string }) => ch.id) || []
          setVerifiedChannelIds(new Set(channelIds))
        }
      } catch (error) {
        console.error('Erreur chargement chaînes vérifiées:', error)
      } finally {
        setLoading(false)
      }
    }
    loadVerified()
  }, [])

  const isVerified = useCallback((channelId: string) => verifiedChannelIds.has(channelId), [verifiedChannelIds])

  return { verifiedChannelIds, loading, isVerified }
}


// --- Composants Enfants Mémoïsés ---

const AdminPanel = React.memo(function AdminPanel({ className }: { className?: string }) {
  const [adminSecret, setAdminSecret] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string>('')
  const [showSecret, setShowSecret] = useState(false)
  
  const { channels } = usePlaylistStore()
  const { favorites } = useFavoritesStore()

  useEffect(() => {
    const saved = localStorage.getItem('streamverse-last-generated')
    if (saved) setLastGenerated(saved)
  }, [])

  const generateVerifiedChannels = async () => {
    if (!adminSecret.trim()) {
      toast.error('Veuillez entrer la clé secrète admin')
      return
    }
    if (favorites.length === 0) {
      toast.error('Aucun favori à exporter pour la génération')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/generate-verified-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: adminSecret, favorites, allChannels: channels }),
      })
      const result = await response.json()
      if (response.ok) {
        const timestamp = new Date().toLocaleString('fr-FR')
        setLastGenerated(timestamp)
        localStorage.setItem('streamverse-last-generated', timestamp)
        toast.success(`✅ Fichier généré avec succès ! ${result.channelsCount} chaînes vérifiées`)
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(result.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      toast.error('Erreur réseau lors de la génération')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" /> Panneau Admin
        </CardTitle>
        <CardDescription>
          Générer le fichier des chaînes vérifiées depuis vos {favorites.length} favoris.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="admin-secret" className="text-sm font-medium flex items-center justify-between">
            <span>Clé secrète admin :</span>
            <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)} className="h-6 w-6">
              <span className="sr-only">{showSecret ? 'Cacher' : 'Afficher'} la clé</span>
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </label>
          <Input id="admin-secret" type={showSecret ? 'text' : 'password'} placeholder="Entrez la clé secrète..." value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} />
        </div>
        <Button onClick={generateVerifiedChannels} disabled={isGenerating || !adminSecret.trim() || favorites.length === 0} className="w-full" size="lg">
          {isGenerating ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Génération...</>) : (<><CheckCircle className="h-4 w-4 mr-2" /> Générer verified-channels.json</>)}
        </Button>
        {lastGenerated && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle className="h-4 w-4" />
            <div><div className="font-medium">Dernière génération réussie</div><div className="text-xs">{lastGenerated}</div></div>
          </div>
        )}
        <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
          <span>Cette action remplace <code>public/verified-channels.json</code> et rend vos favoris visibles à tous comme "vérifiés".</span>
        </div>
      </CardContent>
    </Card>
  )
})

const ChannelCardWithVerified = React.memo(function ChannelCardWithVerified({ channel, onPlay, onToggleFavorite, isFavorite, showCategory, viewMode = 'grid', isChannelVerified }: { channel: Channel, onPlay: (channel: Channel) => void, onToggleFavorite: (channel: Channel) => void, isFavorite: boolean, showCategory?: boolean, viewMode?: ViewMode, isChannelVerified: boolean }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
        <img src={channel.logo || '/placeholder-channel.png'} alt={channel.name} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate flex items-center gap-2">{channel.name} {isChannelVerified && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}</h3>
          {showCategory && channel.group && (<p className="text-sm text-muted-foreground truncate">{channel.group}</p>)}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" onClick={() => onPlay(channel)}>Regarder</Button>
          <Button size="icon" variant={isFavorite ? 'destructive' : 'outline'} onClick={() => onToggleFavorite(channel)} aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="relative">
      {isChannelVerified && (
        <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Vérifié
        </Badge>
      )}
      <ChannelCard channel={channel} onPlay={onPlay} onToggleFavorite={onToggleFavorite} isFavorite={isFavorite} showCategory={showCategory} />
    </div>
  )
})

const AdvancedStats = React.memo(function AdvancedStats({ totalFavorites, categories, verifiedCount }: { totalFavorites: number; categories: Record<string, Channel[]>; verifiedCount: number }) {
  const categoriesCount = Object.keys(categories).length
  const verificationRate = totalFavorites > 0 ? Math.round((verifiedCount / totalFavorites) * 100) : 0
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{totalFavorites}</div><div className="text-sm text-muted-foreground">Favoris</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{verifiedCount}</div><div className="text-sm text-muted-foreground">Vérifiées</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{categoriesCount}</div><div className="text-sm text-muted-foreground">Catégories</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{verificationRate}%</div><div className="text-sm text-muted-foreground">Taux Vérif.</div></CardContent></Card>
    </div>
  )
})

const AdvancedFilterControls = React.memo(function AdvancedFilterControls({ searchQuery, onSearchChange, sortBy, onSortChange, filterBy, onFilterChange, viewMode, onViewModeChange, onClearFilters }: { searchQuery: string; onSearchChange: (value: string) => void; sortBy: SortOption; onSortChange: (sort: SortOption) => void; filterBy: FilterOption; onFilterChange: (filter: FilterOption) => void; viewMode: ViewMode; onViewModeChange: (mode: ViewMode) => void; onClearFilters: () => void; }) {
  const hasActiveFilters = searchQuery || filterBy !== 'all'
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <label htmlFor="search-favorites" className="sr-only">Rechercher dans les favoris</label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="search-favorites" placeholder="Rechercher..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}><SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Trier par..." /></SelectTrigger><SelectContent><SelectItem value="name">Nom A-Z</SelectItem><SelectItem value="category">Catégorie</SelectItem><SelectItem value="recent">Récents</SelectItem><SelectItem value="most-watched">Plus vus</SelectItem></SelectContent></Select>
          <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}><SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Filtrer par..." /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="verified">Vérifiés</SelectItem><SelectItem value="unverified">Non vérifiés</SelectItem></SelectContent></Select>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1"><Button aria-label="Afficher en grille" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('grid')} className="h-8 w-8"><Grid3X3 className="h-4 w-4" /></Button><Button aria-label="Afficher en liste" variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button></div>
        </div>
      </div>
      {hasActiveFilters && (<div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap"><Filter className="h-4 w-4" /><span>Filtres actifs:</span>{searchQuery && <Badge variant="outline">Recherche: "{searchQuery}"</Badge>}{filterBy !== 'all' && <Badge variant="outline">Type: {filterBy}</Badge>}<Button variant="ghost" size="sm" onClick={onClearFilters} className="h-auto p-1 text-xs"><X className="h-3 w-3 mr-1" />Effacer</Button></div>)}
    </div>
  )
})

const EmptyState = React.memo(function EmptyState({ reason, onClearFilters }: { reason: 'no-favorites' | 'no-results'; onClearFilters: () => void; }) {
  const isNoResults = reason === 'no-results'
  return (
    <Card className="border-dashed"><CardContent className="text-center py-12"><Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">{isNoResults ? 'Aucun résultat trouvé' : 'Aucun favori pour le moment'}</h3><p className="text-muted-foreground mb-4">{isNoResults ? 'Essayez de modifier vos filtres ou votre recherche.' : 'Cliquez sur le cœur d\'une chaîne pour l\'ajouter.'}</p>{isNoResults && (<Button variant="outline" onClick={onClearFilters}><RefreshCw className="h-4 w-4 mr-2" />Effacer les filtres</Button>)}</CardContent></Card>
  )
})

// --- Composant Principal ---
export default function FavoritesPage() {
  const { channels } = usePlaylistStore()
  const { favorites, toggleFavorite, isFavorite, clearAllFavorites, importFavorites } = useFavoritesStore()
  const { addToHistory } = useWatchHistoryStore()
  const { setCurrentChannel } = useAppStore()
  const { isVerified } = useVerifiedChannelsStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null)

  const favoriteChannels = useMemo(() => {
    const favoriteSet = new Set(favorites)
    return channels.filter(ch => favoriteSet.has(ch.id))
  }, [channels, favorites])

  const favoritesByCategory = useMemo(() => {
    return favoriteChannels.reduce<Record<string, Channel[]>>((acc, ch) => {
      const category = ch.group || 'Sans catégorie'
      if (!acc[category]) acc[category] = []
      acc[category].push(ch)
      return acc
    }, {})
  }, [favoriteChannels])

  const verifiedFavoritesCount = useMemo(() => favoriteChannels.filter(ch => isVerified(ch.id)).length, [favoriteChannels, isVerified])

  const filteredAndSortedChannels = useMemo(() => {
    let filtered = selectedCategory ? favoritesByCategory[selectedCategory] || [] : favoriteChannels
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(ch => ch.name.toLowerCase().includes(query) || (ch.group || '').toLowerCase().includes(query))
    }
    if (filterBy === 'verified') {
      filtered = filtered.filter(ch => isVerified(ch.id))
    } else if (filterBy === 'unverified') {
      filtered = filtered.filter(ch => !isVerified(ch.id))
    }

    // NOTE: Le tri "récent" et "plus vus" est simulé. Il faudrait une vraie logique
    // se basant sur les données de `useWatchHistoryStore` ou des métadonnées de favoris.
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'category': return (a.group || 'z').localeCompare(b.group || 'z', 'fr');
        case 'name':
        default: return a.name.localeCompare(b.name, 'fr');
      }
    })
  }, [favoriteChannels, favoritesByCategory, selectedCategory, searchQuery, filterBy, sortBy, isVerified])
  
  const handleClearFilters = useCallback(() => {
      setSearchQuery('')
      setSelectedCategory(null)
      setFilterBy('all')
  }, [])

  const handlePlayChannel = useCallback((channel: Channel) => {
    setCurrentChannel(channel)
    addToHistory(channel, 0)
    toast.info(`Lecture de : ${channel.name}`)
  }, [setCurrentChannel, addToHistory])

  const handleToggleFavorite = useCallback((channel: Channel) => {
    const currentlyFavorite = isFavorite(channel.id)
    toggleFavorite(channel.id)
    toast.success(`${channel.name} ${currentlyFavorite ? 'retiré des' : 'ajouté aux'} favoris`)
  }, [toggleFavorite, isFavorite])

  const handleClearAllFavorites = useCallback(() => {
    if (favorites.length > 0 && window.confirm(`⚠️ Attention ! Êtes-vous sûr de vouloir supprimer vos ${favorites.length} favoris ? Cette action est irréversible.`)) {
      clearAllFavorites()
      toast.success('Tous les favoris ont été supprimés')
    }
  }, [favorites.length, clearAllFavorites])

  const handleExportFavorites = useCallback(() => {
    if (favoriteChannels.length === 0) {
      toast.error("Aucun favori à exporter.")
      return
    }

    const favoriteChannelsData: ExportedChannel[] = favoriteChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      url: channel.url,
      logo: channel.logo,
      group: channel.group,
      verified: isVerified(channel.id),
      exportedAt: new Date().toISOString()
    }))

    const exportData: ExportDataV2 = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      totalFavorites: favoriteChannels.length,
      verifiedCount: verifiedFavoritesCount,
      favorites: favoriteChannelsData, // CORRECTION DU BUG
    }
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streamverse-favoris-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    link.remove()
    toast.success(`✅ ${favoriteChannels.length} favoris exportés avec succès`)
  }, [favoriteChannels, verifiedFavoritesCount, isVerified])

  const handleImportFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        let idsToImport: string[] = []
        
        // Détecte le nouveau format (v2)
        if (data && typeof data === 'object' && data.version === '2.0.0' && Array.isArray(data.favorites)) {
          idsToImport = (data as ExportDataV2).favorites.map(fav => fav.id)
        } 
        // Détecte l'ancien format (simple tableau d'IDs)
        else if (Array.isArray(data) && data.every(id => typeof id === 'string')) {
          idsToImport = data as OldExportData
        } else {
          throw new Error("Format de fichier non reconnu.")
        }

        const newCount = importFavorites(idsToImport)
        toast.success(`${newCount.added} nouveaux favoris importés.`, {
          description: `${newCount.skipped} favoris étaient déjà présents.`
        })
      } catch (err) {
        toast.error("Erreur lors de la lecture du fichier.", {
          description: err instanceof Error ? err.message : "Le format est peut-être invalide."
        })
      } finally {
        if(event.target) event.target.value = ''
      }
    }
    reader.readAsText(file)
  }, [importFavorites])

  return (
    <div className="space-y-6">
      <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                  <h1 className="text-4xl font-bold flex items-center space-x-3"><Heart className="h-9 w-9 text-red-500" /><span>Mes Favoris</span></h1>
                  <p className="text-lg text-muted-foreground mt-1">{favoriteChannels.length} chaîne{favoriteChannels.length !== 1 ? 's' : ''} dans votre collection</p>
              </div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <Button variant="outline" size="sm" onClick={handleExportFavorites} disabled={favoriteChannels.length === 0}><Download className="h-4 w-4 mr-2" />Exporter</Button>
                  <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Importer</Button>
                  <Collapsible open={showAdminPanel} onOpenChange={setShowAdminPanel}>
                      <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" disabled={favoriteChannels.length === 0}><Settings className="h-4 w-4 mr-2" />Admin</Button>
                      </CollapsibleTrigger>
                  </Collapsible>
                  <Button variant="destructive" size="sm" onClick={handleClearAllFavorites} disabled={favoriteChannels.length === 0}><Trash2 className="h-4 w-4 mr-2" />Tout supprimer</Button>
              </div>
          </div>
          <CollapsibleContent><AdminPanel className="mt-4" /></CollapsibleContent>
      </header>

      <input id="import-favorites" type="file" accept=".json,application/json" onChange={handleImportFileSelected} ref={importInputRef} className="hidden" />

      {favoriteChannels.length > 0 ? (
        <main className="space-y-6">
          <AdvancedStats totalFavorites={favoriteChannels.length} categories={favoritesByCategory} verifiedCount={verifiedFavoritesCount} />
          
          <div className="space-y-4">
              <AdvancedFilterControls searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} filterBy={filterBy} onFilterChange={setFilterBy} viewMode={viewMode} onViewModeChange={setViewMode} onClearFilters={handleClearFilters} />
              
              <div className="flex flex-wrap gap-2">
                  <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>Toutes ({filteredAndSortedChannels.length})</Button>
                  {Object.entries(favoritesByCategory).sort(([catA], [catB]) => catA.localeCompare(catB, 'fr')).map(([category, channels]) => (<Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(category)}>{category}<Badge variant="secondary" className="ml-2">{channels.length}</Badge></Button>))}
              </div>
          </div>
          
          {filteredAndSortedChannels.length > 0 ? (
            viewMode === 'list' ? (
                <div className="space-y-2">
                    {filteredAndSortedChannels.map((channel) => <ChannelCardWithVerified key={channel.id} channel={channel} onPlay={handlePlayChannel} onToggleFavorite={handleToggleFavorite} isFavorite={isFavorite(channel.id)} showCategory={!selectedCategory} viewMode="list" isChannelVerified={isVerified(channel.id)} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredAndSortedChannels.map((channel) => <ChannelCardWithVerified key={channel.id} channel={channel} onPlay={handlePlayChannel} onToggleFavorite={handleToggleFavorite} isFavorite={isFavorite(channel.id)} showCategory={!selectedCategory} viewMode="grid" isChannelVerified={isVerified(channel.id)} />)}
                </div>
            )
          ) : (<EmptyState reason="no-results" onClearFilters={handleClearFilters} />)}
        </main>
      ) : (
        <EmptyState reason="no-favorites" onClearFilters={handleClearFilters} />
      )}
    </div>
  )
}