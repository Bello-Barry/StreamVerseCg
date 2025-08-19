'use client';

import React, { useMemo, useEffect } from 'react';
import {
  Tv,
  TrendingUp,
  Clock,
  Heart,
  Grid3X3,
  Play,
  Star,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChannelCard from '@/components/ChannelCard';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { ViewType, Channel } from '@/types';
import { toast } from 'sonner';

interface HomePageProps {
  onChannelSelect?: (channel: Channel) => void;
  onPlaybackError?: (channel: Channel) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onChannelSelect }) => {
  const { channels, categories, loading } = usePlaylistStore();
  const { favorites, toggleFavorite, isFavorite, getMostPopularFavorites, fetchFavorites } = useFavoritesStore();
  const { getRecentChannels, addToHistory } = useWatchHistoryStore();
  const { setCurrentChannel, setCurrentView } = useAppStore();

  // On récupère les favoris au chargement de la page pour avoir les données à jour
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Chaînes les plus populaires de la communauté (plus de votes)
  const mostPopularFavorites = useMemo(() => {
    const popularRecords = getMostPopularFavorites(12);
    const popularIds = popularRecords.map(rec => rec.channel_id);
    return channels.filter(ch => popularIds.includes(ch.id));
  }, [channels, getMostPopularFavorites, favorites]); // Ajout de `favorites` pour recalculer si les données changent

  // Chaînes à découvrir (non favorites, triées aléatoirement)
  const discoveryChannels = useMemo(() => {
    // CORRECTION URGENTE:
    // Utiliser la fonction isFavorite() du store pour vérifier si une chaîne est un favori.
    // Cela corrige l'erreur de typage 'Argument of type 'string' is not assignable to parameter of type 'FavoriteRecord'.'
    return channels
      .filter((ch) => !isFavorite(ch.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }, [channels, isFavorite]);

  // Chaînes en tendances (catégories les plus peuplées)
  const trendingChannels = useMemo(() => {
    const popular = categories.sort((a, b) => b.count - a.count).slice(0, 3);
    return popular.flatMap((cat) => cat.channels.slice(0, 4)).slice(0, 8);
  }, [categories]);

  const stats = useMemo(
    () => ({
      totalChannels: channels.length,
      totalCategories: categories.length,
      totalFavorites: favorites.length,
      totalHistory: getRecentChannels().length,
    }),
    [channels.length, categories.length, favorites.length, getRecentChannels]
  );

  const handlePlayChannel = (channel: Channel) => {
    if (onChannelSelect) {
      onChannelSelect(channel);
    } else {
      setCurrentChannel(channel);
    }
    addToHistory(channel, 0);
  };

  const handleToggleFavorite = async (channel: Channel) => {
    try {
      await toggleFavorite(channel);
      const action = isFavorite(channel.id) ? 'retiré des' : 'ajouté aux';
      toast.success(`${channel.name} ${action} favoris communautaires`);
    } catch (error) {
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des chaînes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center py-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Bienvenue sur StreamVerse</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Découvrez et regardez vos chaînes IPTV préférées
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <CardStat icon={<Tv />} value={stats.totalChannels} label="Chaînes" />
          <CardStat icon={<Grid3X3 />} value={stats.totalCategories} label="Catégories" />
          <CardStat icon={<Heart />} value={stats.totalFavorites} label="Favoris" />
          <CardStat icon={<Clock />} value={stats.totalHistory} label="Historique" />
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          icon={<Grid3X3 className="h-6 w-6" />}
          label="Explorer les catégories"
          onClick={() => setCurrentView(ViewType.CATEGORIES)}
        />
        <QuickAction
          icon={<Heart className="h-6 w-6" />}
          label="Mes favoris"
          onClick={() => setCurrentView(ViewType.FAVORITES)}
        />
        <QuickAction
          icon={<Tv className="h-6 w-6" />}
          label="Gérer les playlists"
          onClick={() => setCurrentView(ViewType.PLAYLISTS)}
        />
      </div>

      {/* Section Chaînes Populaires (Communauté) */}
      {mostPopularFavorites.length > 0 && (
        <ChannelSection
          title="Chaînes Populaires"
          icon={<Star />}
          badge="Top Votes"
          badgeVariant="destructive"
          channels={mostPopularFavorites}
          onPlay={handlePlayChannel}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* Tendances */}
      {trendingChannels.length > 0 && (
        <ChannelSection
          title="Tendances"
          icon={<TrendingUp />}
          badge="Par Catégorie"
          badgeVariant="secondary"
          channels={trendingChannels}
          onPlay={handlePlayChannel}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* À découvrir */}
      {discoveryChannels.length > 0 && (
        <ChannelSection
          title="À découvrir"
          icon={<Zap />}
          badge="Aléatoire"
          badgeVariant="outline"
          channels={discoveryChannels}
          onPlay={handlePlayChannel}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* Aucun contenu */}
      {channels.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tv className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Aucune chaîne disponible
          </h3>
          <p className="text-muted-foreground mb-6">
            Ajoutez des playlists pour commencer à regarder vos chaînes préférées.
          </p>
          <Button onClick={() => setCurrentView(ViewType.PLAYLISTS)}>
            Gérer les playlists
          </Button>
        </div>
      )}
    </div>
  );
};

export default HomePage;

/* 🔧 Sous-composants réutilisables */

type CardStatProps = {
  icon: React.ReactNode;
  value: number;
  label: string;
};

const CardStat = React.memo(({ icon, value, label }: CardStatProps) => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="h-8 w-8 mx-auto mb-2 text-primary">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
));

type QuickActionProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const QuickAction = React.memo(({ icon, label, onClick }: QuickActionProps) => (
  <Button
    variant="outline"
    size="lg"
    className="h-20 flex flex-col space-y-2"
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Button>
));

type ChannelSectionProps = {
  title: string;
  icon: React.ReactNode;
  badge: string;
  badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive';
  channels: Channel[];
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  isFavorite: (channelId: string) => boolean;
};

const ChannelSection = React.memo(({
  title,
  icon,
  badge,
  badgeVariant = 'secondary',
  channels,
  onPlay,
  onToggleFavorite,
  isFavorite,
}: ChannelSectionProps) => (
  <section>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 text-primary">{icon}</div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <Badge variant={badgeVariant}>{badge}</Badge>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          onPlay={onPlay}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite(channel.id)}
          showCategory
        />
      ))}
    </div>
  </section>
));
