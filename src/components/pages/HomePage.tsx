'use client';

import React, { useMemo, useEffect } from 'react';
import {
  Tv,
  TrendingUp,
  Clock,
  Heart,
  Grid3X3,
  Play,
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

import { SmartChannelGrid } from '@/components/SmartChannelGrid';
import { useRecommendationStore } from '@/stores/useRecommendationStore';

interface HomePageProps {
  onChannelSelect?: (channel: Channel) => void;
  onPlaybackError?: (channel: Channel) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onChannelSelect, onPlaybackError }) => {
  const { channels, categories, loading } = usePlaylistStore();
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const { getRecentChannels, getMostWatchedChannels, addToHistory } = useWatchHistoryStore();
  const { setCurrentChannel, setCurrentView } = useAppStore();

  const recommendations = useRecommendationStore((state) => state.recommendations);
  const setRecommendations = useRecommendationStore((state) => state.setRecommendations);

  // Charger les recommandations intelligentes quand les chaînes sont prêtes
  useEffect(() => {
    if (channels.length > 0) {
      setRecommendations(channels, {
        preferredCategories: ['Sports', 'News'],
      });
    }
  }, [channels]);

  const recommendedChannels = useMemo(() => {
    return recommendations.slice(0, 12);
  }, [recommendations]);

  const trendingChannels = useMemo(() => {
    const popular = categories.sort((a, b) => b.count - a.count).slice(0, 3);
    return popular.flatMap((cat) => cat.channels.slice(0, 4)).slice(0, 8);
  }, [categories]);

  const discoveryChannels = useMemo(() => {
    return channels
      .filter((ch) => !favorites.includes(ch.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }, [channels, favorites]);

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

  const handleToggleFavorite = (channel: Channel) => {
    toggleFavorite(channel.id);
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
          Découvrez et regardez vos chaînes IPTV préférées avec des recommandations intelligentes
        </p>

        {/* Statistiques */}
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

      {/* Recommandations intelligentes */}
      {recommendedChannels.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 text-primary">
                <Play />
              </div>
              <h2 className="text-2xl font-bold">Chaînes Recommandées</h2>
            </div>
            <Badge variant="secondary">Intelligent</Badge>
          </div>

          <SmartChannelGrid
            channels={recommendedChannels}
            onChannelSelect={handlePlayChannel}
            showRecommendations={true}
            enableFilters={true}
            maxChannelsToShow={12}
          />
        </section>
      )}

      {/* Tendances */}
      {trendingChannels.length > 0 && (
        <ChannelSection
          title="Tendances"
          icon={<TrendingUp />}
          badge="Populaire"
          badgeVariant="destructive"
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
          icon={<Tv />}
          badge="Nouveautés"
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

const CardStat = ({ icon, value, label }: CardStatProps) => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="h-8 w-8 mx-auto mb-2 text-primary">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

type QuickActionProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const QuickAction = ({ icon, label, onClick }: QuickActionProps) => (
  <Button
    variant="outline"
    size="lg"
    className="h-20 flex flex-col space-y-2"
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </Button>
);

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

const ChannelSection = ({
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
);