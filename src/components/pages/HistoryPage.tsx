'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Trash2, Tv } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore';
import { useAppStore } from '@/stores/useAppStore';
import { ViewType, Channel } from '@/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface PartialChannel {
  id: string;
  name: string;
  tvgLogo?: string;
  group?: string;
}

const HistoryPage: React.FC = () => {
  const { history, clearHistory } = useWatchHistoryStore();
  const { setCurrentChannel, setCurrentView } = useAppStore();

  const [sortBy, setSortBy] = useState<'recent' | 'duration' | 'name'>('recent');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredHistory = useMemo(() => {
    if (!isClient) return [];

    const getDateLimit = () => {
      const limit = new Date();
      switch (timeFilter) {
        case 'today':
          limit.setHours(0, 0, 0, 0);
          break;
        case 'week':
          limit.setDate(limit.getDate() - 7);
          break;
        case 'month':
          limit.setMonth(limit.getMonth() - 1);
          break;
      }
      return limit;
    };

    const limit = getDateLimit();

    return history
      .filter((entry) => {
        if (timeFilter === 'all') return true;
        return new Date(entry.timestamp) >= limit;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'duration':
            return b.duration - a.duration;
          case 'name':
            return a.channel.name.localeCompare(b.channel.name);
          case 'recent':
          default:
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
      });
  }, [history, timeFilter, sortBy, isClient]);

  const handlePlayChannel = (channel: PartialChannel) => {
    const fullChannel: Channel = {
      ...channel,
      url: '', // 🛠️ à adapter si tu as une URL
      playlistSource: '', // 🛠️ à adapter selon la source
    };

    setCurrentChannel(fullChannel);
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success('Historique vidé');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Clock className="h-6 w-6 text-primary" />
          <span>Historique de lecture</span>
        </h1>

        {history.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearHistory}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Vider</span>
          </Button>
        )}
      </div>

      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setTimeFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer par date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">Dernier mois</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'recent' | 'duration' | 'name') => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="duration">Durée</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center space-x-4">
                <Image
                  src={entry.channel.tvgLogo || '/placeholder.svg'}
                  alt={entry.channel.name}
                  width={60}
                  height={60}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold truncate">
                    {entry.channel.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Durée : {Math.round(entry.duration)}s
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Vu le {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePlayChannel(entry.channel)}
                >
                  <Tv className="h-5 w-5 text-primary" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun historique</h3>
          <p className="text-muted-foreground mb-6">
            Vous n&apos;avez encore rien regardé récemment.
          </p>
          <Button onClick={() => setCurrentView(ViewType.PLAYLISTS)}>
            Gérer les playlists
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;