// Indique que c'est un composant client
'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Clock, Trash2, Calendar, TrendingUp, BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWatchHistoryStore, HistoryEntry } from '@/stores/useWatchHistoryStore' // Assumons que HistoryEntry est exporté
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import type { Channel } from '@/types'
import Image from 'next/image'

// --- Fonctions utilitaires ---

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR')
}

// --- Sous-composants mémoïsés pour la performance ---

const HistoryHeader = React.memo(function HistoryHeader({
  historyCount,
  onExport,
  onClear,
}: {
  historyCount: number
  onExport: () => void
  onClear: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Clock className="h-8 w-8" />
          <span>Historique de visionnage</span>
        </h1>
        <p className="text-muted-foreground">
          {historyCount} session{historyCount !== 1 && 's'} de visionnage
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onExport} disabled={historyCount === 0} className="flex items-center space-x-2">
          <Download className="h-4 w-4" /> <span>Exporter</span>
        </Button>
        <Button variant="destructive" size="sm" onClick={onClear} disabled={historyCount === 0} className="flex items-center space-x-2">
          <Trash2 className="h-4 w-4" /> <span>Tout supprimer</span>
        </Button>
      </div>
    </div>
  )
})

const StatsGrid = React.memo(function StatsGrid({
  totalWatchTime,
  watchingStreak,
  favoriteCategoriesCount,
  uniqueChannelsCount,
}: {
  totalWatchTime: number
  watchingStreak: number
  favoriteCategoriesCount: number
  uniqueChannelsCount: number
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card><CardContent className="p-4 text-center"><Clock className="h-8 w-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{formatDuration(totalWatchTime)}</div><div className="text-sm text-muted-foreground">Temps total</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{watchingStreak}</div><div className="text-sm text-muted-foreground">Jours consécutifs</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{favoriteCategoriesCount}</div><div className="text-sm text-muted-foreground">Catégories vues</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><Calendar className="h-8 w-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{uniqueChannelsCount}</div><div className="text-sm text-muted-foreground">Chaînes uniques</div></CardContent></Card>
    </div>
  )
})

const HistoryItemCard = React.memo(function HistoryItemCard({
  entry,
  onPlay,
  onRemove,
}: {
  entry: HistoryEntry
  onPlay: (channel: Channel) => void
  onRemove: (id: string) => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {entry.channel.tvgLogo ? (
                <Image src={entry.channel.tvgLogo} alt={entry.channel.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{entry.channel.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground flex-wrap">
                <span>{formatDate(new Date(entry.timestamp))}</span>
                <span>•</span>
                <span>{formatDuration(entry.duration)}</span>
                {entry.channel.group && (
                  <><span>•</span><Badge variant="outline" className="text-xs">{entry.channel.group}</Badge></>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => onPlay(entry.channel)}>Regarder</Button>
            <Button variant="ghost" size="icon" onClick={() => onRemove(entry.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

const EmptyState = React.memo(function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="text-center py-12">
      <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {isFiltered ? "Aucune entrée trouvée" : "Aucun historique pour le moment"}
      </h3>
      <p className="text-muted-foreground">
        {isFiltered
          ? "Essayez d'ajuster vos filtres ou de revenir à l'historique complet."
          : "Votre historique apparaîtra ici une fois que vous aurez regardé des chaînes."}
      </p>
    </div>
  )
})

// --- Composant principal ---

export default function HistoryPage() {
  // Hooks des stores
  const { history, clearHistory, removeFromHistory, getWatchStats, getTotalWatchTime, exportHistory } = useWatchHistoryStore()
  const { setCurrentChannel } = useAppStore()

  // États locaux pour le filtrage et le tri
  type TimeFilter = 'all' | 'today' | 'week' | 'month'
  type SortBy = 'recent' | 'duration' | 'name'
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  // Calculs mémoïsés pour les statistiques et les listes
  const watchStats = useMemo(() => getWatchStats(), [getWatchStats])
  const totalWatchTime = useMemo(() => getTotalWatchTime(), [getTotalWatchTime])

  const filteredHistory = useMemo(() => {
    let filtered = [...history]
    const now = Date.now()

    // Filtrage par temps
    if (timeFilter !== 'all') {
      let timeLimit = 0
      if (timeFilter === 'today') timeLimit = new Date().setHours(0, 0, 0, 0)
      else if (timeFilter === 'week') timeLimit = now - 7 * 24 * 60 * 60 * 1000
      else if (timeFilter === 'month') timeLimit = now - 30 * 24 * 60 * 60 * 1000
      filtered = filtered.filter(entry => new Date(entry.timestamp).getTime() >= timeLimit)
    }

    // Tri
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'duration': return b.duration - a.duration
        case 'name': return a.channel.name.localeCompare(b.channel.name)
        case 'recent':
        default: return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      }
    })
  }, [history, timeFilter, sortBy])

  const uniqueChannelsCount = useMemo(() => new Set(history.map(entry => entry.channel.id)).size, [history])

  // Callbacks mémoïsés
  const handlePlayChannel = useCallback((channel: Channel) => setCurrentChannel(channel), [setCurrentChannel])
  const handleRemoveFromHistory = useCallback((id: string) => removeFromHistory(id), [removeFromHistory])

  const handleClearHistory = useCallback(() => {
    if (history.length > 0 && window.confirm(`Êtes-vous sûr de vouloir supprimer tout l'historique (${history.length} entrées) ?`)) {
      clearHistory()
      toast.success('Historique supprimé')
    }
  }, [history.length, clearHistory])

  const handleExportHistory = useCallback(() => {
    const historyData = exportHistory()
    const dataStr = JSON.stringify(historyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streamverse-historique-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Historique exporté avec succès')
  }, [exportHistory])

  return (
    <div className="space-y-6">
      <HistoryHeader historyCount={history.length} onExport={handleExportHistory} onClear={handleClearHistory} />
      
      {history.length > 0 && (
        <StatsGrid
          totalWatchTime={totalWatchTime}
          watchingStreak={watchStats.watchingStreak}
          favoriteCategoriesCount={watchStats.favoriteCategories.length}
          uniqueChannelsCount={uniqueChannelsCount}
        />
      )}

      {history.length > 0 ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout l'historique</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Récent</SelectItem>
                  <SelectItem value="duration">Durée</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredHistory.length} entrée{filteredHistory.length !== 1 && 's'}
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((entry) => (
                <HistoryItemCard key={entry.id} entry={entry} onPlay={handlePlayChannel} onRemove={handleRemoveFromHistory} />
              ))}
            </div>
          ) : (
            <EmptyState isFiltered={true} />
          )}
        </>
      ) : (
        <EmptyState isFiltered={false} />
      )}
    </div>
  )
}