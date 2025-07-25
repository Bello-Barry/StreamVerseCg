'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tv, Play, Heart, MoreVertical, Trash2 } from 'lucide-react';
import { Channel } from '@/types';
import { usePlaylistStore } from '@/stores/usePlaylistStore';

import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useState } from 'react';
import Image from 'next/image';

type Props = {
  channel: Channel;
};

export function ChannelCard({ channel }: Props) {
  const [imgError, setImgError] = useState(false);
  const { play } = usePlaylistStore();
  const { isFavorite, toggleFavorite, removeFavorite } = useFavoritesStore();

  const handlePlay = () => play(channel);

  return (
    <Card
      tabIndex={0}
      role="button"
      aria-label={`Lire la chaîne ${channel.name}`}
      onClick={handlePlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handlePlay();
      }}
      className="relative flex flex-col items-center justify-between gap-2 rounded-2xl border p-2 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:scale-105"
    >
      <div className="relative w-full aspect-video overflow-hidden rounded-md bg-muted">
        {!imgError ? (
          <Image
            src={channel.logo ?? '/placeholder.png'}
            alt={imgError ? 'Logo indisponible' : `Logo de ${channel.name}`}
            fill
            className="object-contain p-2 transition-opacity duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
            <Tv className="h-10 w-10" />
          </div>
        )}

        {channel.isLive && (
          <Badge className="absolute left-2 top-2 bg-red-600 text-white">
            LIVE
          </Badge>
        )}

        {isFavorite(channel) && (
          <div className="absolute right-2 top-2">
            <Heart className="h-5 w-5 text-pink-500" fill="currentColor" />
          </div>
        )}
      </div>

      <div className="w-full text-center">
        <p className="text-sm font-semibold line-clamp-2" title={channel.name}>
          {channel.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1" title={`${channel.country} • ${channel.language} • ${channel.category}`}>
          {channel.country} • {channel.language} • {channel.category}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label={isFavorite(channel) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite(channel)}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel);
          }}
        >
          <Heart
            className="h-5 w-5"
            fill={isFavorite(channel) ? 'currentColor' : 'none'}
          />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          aria-label="Lire la chaîne"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
        >
          <Play className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Ouvrir le menu"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                removeFavorite(channel);
              }}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer des favoris
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}