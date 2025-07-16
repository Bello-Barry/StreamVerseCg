'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Tv, TrendingUp, Clock, Heart, Grid3X3, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChannelCard from '@/components/ChannelCard'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import { ViewType } from '@/types'
import type { Channel } from '@/types'

const HomePage: React.FC = () => {
  const { channels, categories, loading } = usePlaylistStore()
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore()
  const { getRecentChannels, getMostWatchedChannels, addToHistory } = useWatchHistoryStore()
  const { setCurrentChannel, setCurrentView } = useAppStore()
  
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Statistiques générales
  const stats = useMemo(() => ({
    totalChannels: channels.length,
    totalCategories: categories.length,
    totalFavorites: favorites.length,
    totalHistory: getRecentChannels().length
  }), [channels.length, categories.length, favorites.length, getRecentChannels])

  // Chaînes recommandées (mix de populaires et récentes)
  const recommendedChannels = useMemo(() => {
    if (!isClient) return []
    
    const recentChannels = getRecentChannels(6)
    const mostWatched = getMostWatchedChannels(6)
    const randomChannels = channels
      .filter(channel => !recentChannels.includes(channel) && !mostWatched.includes(channel))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
    
    return [...recentChannels, ...mostWatched, ...randomChannels].slice(0, 12)
  }, [channels, getRecentChannels, getMostWatchedChannels, isClient])

  // Chaînes tendances (catégories populaires)
  const trendingChannels = useMemo(() => {
    if (!isClient) return []
    
    const popularCategories = categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
    
    const trending = popularCategories.flatMap(category => 
      category.channels.slice(0, 4)
    )
    
    return trending.slice(0, 8)
  }, [categories, isClient])

  // Nouvelles découvertes (chaînes aléatoires)
  const discoveryChannels = useMemo(() => {
    if (!isClient) return []
    
    return channels
      .filter(channel => !favorites.includes(channel.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
  }, [channels, favorites, isClient])

  const handlePlayChannel = (channel: Channel) => {
    setCurrentChannel(channel)
    addToHistory(channel, 0)
  }

  const handleToggleFavorite = (channel: Channel) => {
    toggleFavorite(channel.id)
  }

  if (loading || !isClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des chaînes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <div className="text-center py-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">
          Bienvenue sur StreamVerse
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Découvrez et regardez vos chaînes IPTV préférées
        </p>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <Tv className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalChannels}</div>
              <div className="text-sm text-muted-foreground">Chaînes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Grid3X3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <div className="text-sm text-muted-foreground">Catégories</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalFavorites}</div>
              <div className="text-sm text-muted-foreground">Favoris</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalHistory}</div>
              <div className="text-sm text-muted-foreground">Historique</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-20 flex flex-col space-y-2"
          onClick={() => setCurrentView(ViewType.CATEGORIES)}
        >
          <Grid3X3 className="h-6 w-6" />
          <span>Explorer les catégories</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-20 flex flex-col space-y-2"
          onClick={() => setCurrentView(ViewType.FAVORITES)}
        >
          <Heart className="h-6 w-6" />
          <span>Mes favoris</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-20 flex flex-col space-y-2"
          onClick={() => setCurrentView(ViewType.PLAYLISTS)}
        >
          <Tv className="h-6 w-6" />
          <span>Gérer les playlists</span>
        </Button>
      </div>

      {/* Recommandé pour vous */}
      {recommendedChannels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Play className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recommandé pour vous</h2>
            </div>
            <Badge variant="secondary">Personnalisé</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendedChannels.map((channel) => (
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
        </section>
      )}

      {/* Tendances */}
      {trendingChannels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Tendances</h2>
            </div>
            <Badge variant="destructive">Populaire</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingChannels.map((channel) => (
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
        </section>
      )}

      {/* À découvrir */}
      {discoveryChannels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Tv className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">À découvrir</h2>
            </div>
            <Badge variant="outline">Nouveautés</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {discoveryChannels.map((channel) => (
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
        </section>
      )}

      {/* Message si aucune chaîne */}
      {channels.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune chaîne disponible</h3>
          <p className="text-muted-foreground mb-6">
            Ajoutez des playlists pour commencer à regarder vos chaînes préférées.
          </p>
          <Button onClick={() => setCurrentView(ViewType.PLAYLISTS)}>
            Gérer les playlists
          </Button>
        </div>
      )}
    </div>
  )
}

export default HomePage