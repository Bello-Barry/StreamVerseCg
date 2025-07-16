'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Clock, Trash2, Calendar, TrendingUp, BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ChannelCard from '@/components/ChannelCard'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from 'sonner'
import type { Channel } from '@/types'
import Image from 'next/image'

const HistoryPage: React.FC = () => {
  const { 
    history, 
    clearHistory, 
    removeFromHistory,
    getWatchStats,
    getRecentChannels,
    getMostWatchedChannels,
    getWatchTimeByCategory,
    getTotalWatchTime,
    exportHistory
  } = useWatchHistoryStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { setCurrentChannel } = useAppStore()
  
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'duration' | 'name'>('recent')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Statistiques de visionnage
  const watchStats = useMemo(() => isClient ? getWatchStats() : {}, [getWatchStats, isClient])
  const totalWatchTime = useMemo(() => isClient ? getTotalWatchTime() : 0, [getTotalWatchTime, isClient])
  const watchTimeByCategory = useMemo(() => isClient ? getWatchTimeByCategory() : {}, [getWatchTimeByCategory, isClient])

  // Historique filtré
  const filteredHistory = useMemo(() => {
    if (!isClient) return []

    let filtered = [...history]
    
    // Filtrer par période
    const now = new Date()
    switch (timeFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        filtered = filtered.filter(entry => entry.timestamp >= today)
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(entry => entry.timestamp >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(entry => entry.timestamp >= monthAgo)
        break
    }
    
    // Trier
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        break
      case 'duration':
        filtered.sort((a, b) => b.duration - a.duration)
        break
      case 'name':
        filtered.sort((a, b) => a.channel.name.localeCompare(b.channel.name))
        break
    }
    
    return filtered
  }, [history, timeFilter, sortBy, isClient])

  // Chaînes uniques de l'historique filtré
  const uniqueChannels = useMemo(() => {
    if (!isClient) return []

    const channelMap = new Map()
    
    filteredHistory.forEach(entry => {
      const existing = channelMap.get(entry.channel.id)
      if (!existing || entry.timestamp > existing.timestamp) {
        channelMap.set(entry.channel.id, entry)
      }
    })
    
    return Array.from(channelMap.values()).map(entry => entry.channel)
  }, [filteredHistory, isClient])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (date: Date) => {
    if (!isClient) return ''
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Aujourd&apos;hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const handlePlayChannel = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  const handleToggleFavorite = (channel: Channel) => {
    toggleFavorite(channel.id)
  }

  const handleClearHistory = () => {
    if (!isClient || history.length === 0) return
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer tout l&apos;historique (${history.length} entrées) ?`)) {
      clearHistory()
      toast.success('Historique supprimé')
    }
  }

  const handleExportHistory = () => {
    if (!isClient) return
    const historyData = exportHistory()
    const dataStr = JSON.stringify(historyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streamverse-historique-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Historique exporté avec succès')
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement de l&apos;historique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Clock className="h-8 w-8" />
            <span>Historique de visionnage</span>
          </h1>
          <p className="text-muted-foreground">
            {history.length} session{history.length !== 1 && 's'} de visionnage
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportHistory}
            disabled={history.length === 0}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Tout supprimer</span>
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{formatDuration(totalWatchTime)}</div>
            <div className="text-sm text-muted-foreground">Temps total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{watchStats.watchingStreak}</div>
            <div className="text-sm text-muted-foreground">Jours consécutifs</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{watchStats.favoriteCategories.length}</div>
            <div className="text-sm text-muted-foreground">Catégories regardées</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{uniqueChannels.length}</div>
            <div className="text-sm text-muted-foreground">Chaînes uniques</div>
          </CardContent>
        </Card>
      </div>

      {/* Temps de visionnage par catégorie */}
      {Object.keys(watchTimeByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Temps de visionnage par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(watchTimeByCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, time]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ 
                            width: `${(time / Math.max(1, ...Object.values(watchTimeByCategory))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[60px]">
                        {formatDuration(time)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 ? (
        <>
          {/* Contrôles de filtrage */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setTimeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout l&apos;historique</SelectItem>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Trier par:</span>
                <Select value={sortBy} onValueChange={(value: 'recent' | 'duration' | 'name') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Récent</SelectItem>
                    <SelectItem value="duration">Durée</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredHistory.length} entrée{filteredHistory.length !== 1 && 's'} trouvée{filteredHistory.length !== 1 && 's'}
            </div>
          </div>

          {/* Liste de l'historique */}
          {filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Logo de la chaîne */}
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {entry.channel.tvgLogo ? (
                            <Image
                              src={entry.channel.tvgLogo}
                              alt={entry.channel.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Clock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Informations */}
                        <div className="flex-1">
                          <h3 className="font-semibold">{entry.channel.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatDate(entry.timestamp)}</span>
                            <span>•</span>
                            <span>{formatDuration(entry.duration)}</span>
                            {entry.channel.group && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.channel.group}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayChannel(entry.channel)}
                        >
                          Regarder
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromHistory(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aucune entrée trouvée pour la période sélectionnée.
              </p>
              <Button
                variant="ghost"
                onClick={() => setTimeFilter('all')}
                className="mt-2"
              >
                Voir tout l&apos;historique
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Message si aucun historique */
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun historique pour le moment</h3>
          <p className="text-muted-foreground mb-6">
            Votre historique de visionnage apparaîtra ici au fur et à mesure que vous regardez des chaînes.
          </p>
          <Button onClick={() => window.history.back()}>
            Retour à l&apos;accueil
          </Button>
        </div>
      )}
    </div>
  )
}

export default HistoryPage