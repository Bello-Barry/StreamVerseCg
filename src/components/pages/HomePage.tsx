// Indique que c'est un composant client, nécessaire pour les hooks et l'interactivité.
'use client'

import React, { useMemo, useCallback } from 'react'
import { Tv, TrendingUp, Clock, Heart, Grid3X3, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ChannelCard from '@/components/ChannelCard'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import { ViewType } from '@/types'
import type { Channel, Category } from '@/types' // Assumons que Category est aussi exporté de types

// --- Sous-composants pour la lisibilité et la réutilisabilité ---

interface StatCardProps {
  icon: React.ElementType
  title: string
  value: string | number
}

// Composant pour une carte de statistique, memoizé pour la performance
const StatCard = React.memo(function StatCard({ icon: Icon, title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  )
})

interface ChannelSectionProps {
  title: string
  icon: React.ElementType
  badgeText: string
  badgeVariant: 'secondary' | 'destructive' | 'outline'
  channels: Channel[]
  onPlay: (channel: Channel) => void
  onToggleFavorite: (channel: Channel) => void
  isFavorite: (channelId: string) => boolean
}

// Composant pour une section de chaînes, memoizé pour la performance
const ChannelSection = React.memo(function ChannelSection({
  title,
  icon: Icon,
  badgeText,
  badgeVariant,
  channels,
  onPlay,
  onToggleFavorite,
  isFavorite,
}: ChannelSectionProps) {
  if (channels.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Badge variant={badgeVariant}>{badgeText}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onPlay={onPlay}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(channel.id)}
            showCategory={true}
          />
        ))}
      </div>
    </section>
  )
})

// --- Composant principal ---

export default function HomePage() {
  // Hooks des stores Zustand
  const { channels, categories, loading } = usePlaylistStore()
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore()
  const { getRecentChannels, getMostWatchedChannels, addToHistory } = useWatchHistoryStore()
  const { setCurrentChannel, setCurrentView } = useAppStore()

  // Calculs memoizés pour les données dérivées
  const stats = useMemo(() => ({
    totalChannels: channels.length,
    totalCategories: (categories as Category[]).length, // Typage pour plus de sécurité
    totalFavorites: favorites.length,
    totalHistory: getRecentChannels(Infinity).length, // Obtenir toute la longueur
  }), [channels.length, (categories as Category[]).length, favorites.length, getRecentChannels])

  const recommendedChannels = useMemo(() => {
    const recent = getRecentChannels(6)
    const mostWatched = getMostWatchedChannels(6)
    const otherChannels = channels
      .filter(ch => !recent.find(r => r.id === ch.id) && !mostWatched.find(m => m.id === ch.id))
      .sort(() => 0.5 - Math.random()) // Tri aléatoire stable
      .slice(0, 6)
    
    // Fusionner et dédoublonner
    const all = [...recent, ...mostWatched, ...otherChannels];
    return Array.from(new Map(all.map(item => [item.id, item])).values()).slice(0, 12);
  }, [channels, getRecentChannels, getMostWatchedChannels])

  const trendingChannels = useMemo(() => {
    const popularCategories = [...(categories as Category[])]
      .sort((a, b) => (b.channels?.length ?? 0) - (a.channels?.length ?? 0))
      .slice(0, 3)

    return popularCategories
      .flatMap(category => category.channels?.slice(0, 4) ?? [])
      .slice(0, 8)
  }, [categories])

  const discoveryChannels = useMemo(() => {
    return channels
      .filter(channel => !favorites.includes(channel.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
  }, [channels, favorites])

  // Callbacks memoizés pour éviter les re-créations inutiles
  const handlePlayChannel = useCallback((channel: Channel) => {
    setCurrentChannel(channel)
    addToHistory(channel, 0)
  }, [setCurrentChannel, addToHistory])

  const handleToggleFavorite = useCallback((channel: Channel) => {
    toggleFavorite(channel.id)
  }, [toggleFavorite])

  // État de chargement initial
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des chaînes...</p>
        </div>
      </div>
    )
  }

  // État où aucune chaîne n'est chargée
  if (channels.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête et statistiques */}
      <div className="text-center py-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Bienvenue sur StreamVerse</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Découvrez et regardez vos chaînes IPTV préférées
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <StatCard icon={Tv} title="Chaînes" value={stats.totalChannels} />
          <StatCard icon={Grid3X3} title="Catégories" value={stats.totalCategories} />
          <StatCard icon={Heart} title="Favoris" value={stats.totalFavorites} />
          <StatCard icon={Clock} title="Historique" value={stats.totalHistory} />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" size="lg" className="h-20 flex flex-col space-y-2" onClick={() => setCurrentView(ViewType.CATEGORIES)}>
          <Grid3X3 className="h-6 w-6" /> <span>Explorer les catégories</span>
        </Button>
        <Button variant="outline" size="lg" className="h-20 flex flex-col space-y-2" onClick={() => setCurrentView(ViewType.FAVORITES)}>
          <Heart className="h-6 w-6" /> <span>Mes favoris</span>
        </Button>
        <Button variant="outline" size="lg" className="h-20 flex flex-col space-y-2" onClick={() => setCurrentView(ViewType.PLAYLISTS)}>
          <Tv className="h-6 w-6" /> <span>Gérer les playlists</span>
        </Button>
      </div>

      {/* Sections de chaînes */}
      <ChannelSection
        title="Recommandé pour vous"
        icon={Play}
        badgeText="Personnalisé"
        badgeVariant="secondary"
        channels={recommendedChannels}
        onPlay={handlePlayChannel}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
      />
      <ChannelSection
        title="Tendances"
        icon={TrendingUp}
        badgeText="Populaire"
        badgeVariant="destructive"
        channels={trendingChannels}
        onPlay={handlePlayChannel}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
      />
      <ChannelSection
        title="À découvrir"
        icon={Tv}
        badgeText="Nouveautés"
        badgeVariant="outline"
        channels={discoveryChannels}
        onPlay={handlePlayChannel}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
      />
    </div>
  )
}