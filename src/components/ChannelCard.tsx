'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Heart, MoreVertical, Tv, Globe, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChannelCardProps } from '@/types';
import { cn } from '@/lib/utils';

// Import du nouvel indicateur de fiabilité
import { ChannelReliabilityIndicator } from '@/components/ChannelReliabilityIndicator';

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onPlay,
  onToggleFavorite,
  isFavorite,
  showCategory = true,
  showReliabilityIndicator = true // Nouvelle prop pour contrôler l'affichage de l'indicateur
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePlay = () => {
    onPlay(channel);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(channel);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'News': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Sports': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Entertainment': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Movies': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Music': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'Documentary': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Kids': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'General': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'Undefined': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors['General'];
  };

  const getCountryFlag = (country: string) => {
    const flags = {
      'France': '🇫🇷',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺'
    };
    return flags[country as keyof typeof flags] || '🌍';
  };

  const isValidImageUrl = (url: string | undefined) => {
    return !!url && url.startsWith('http');
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105",
        "border-2 hover:border-primary/50",
        isHovered && "shadow-xl"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
    >
      <CardContent className="p-0">
        {/* Image/Logo de la chaîne */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-t-lg">
          {isValidImageUrl(channel.tvgLogo) && !imageError ? (
            <Image
              src={channel.tvgLogo ?? '/placeholder.svg'}
              alt={channel.name}
              fill
              onError={() => {
                console.warn(`Erreur chargement logo: ${channel.tvgLogo}`);
                setImageError(true);
              }}
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="h-12 w-12 text-primary/60" />
            </div>
          )}

          {/* Overlay avec boutons */}
          <div className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
            >
              <Play className="h-6 w-6 ml-1" fill="currentColor" />
            </Button>
          </div>

          {/* Badge de statut en direct */}
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="text-xs">
              🔴 LIVE
            </Badge>
          </div>

          {/* Indicateur de fiabilité - Nouveau */}
          {showReliabilityIndicator && (
            <div className="absolute top-2 right-12">
              <ChannelReliabilityIndicator
                channelId={channel.id}
                channelUrl={channel.url}
                showDetails={false} // Affichage compact sur la carte
                compact={true}
              />
            </div>
          )}

          {/* Bouton favoris */}
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full bg-black/50 hover:bg-black/70 transition-colors",
                isFavorite && "text-red-500 hover:text-red-600"
              )}
              onClick={handleToggleFavorite}
            >
              <Heart 
                className={cn(
                  "h-4 w-4",
                  isFavorite && "fill-current"
                )} 
              />
            </Button>
          </div>
        </div>

        {/* Informations de la chaîne */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {channel.name}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePlay}>
                  <Play className="mr-2 h-4 w-4" />
                  Regarder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite}>
                  <Heart className="mr-2 h-4 w-4" />
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Partager
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            {/* Indicateur de fiabilité détaillé - Nouveau */}
            {showReliabilityIndicator && (
              <div className="mb-2">
                <ChannelReliabilityIndicator
                  channelId={channel.id}
                  channelUrl={channel.url}
                  showDetails={true}
                  compact={false}
                />
              </div>
            )}

            {showCategory && channel.group && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getCategoryColor(channel.group))}
              >
                {channel.group}
              </Badge>
            )}

            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              {channel.country && (
                <div className="flex items-center space-x-1">
                  <span>{getCountryFlag(channel.country)}</span>
                  <span>{channel.country}</span>
                </div>
              )}
              {channel.language && (
                <div className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>{channel.language}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground truncate">
              Source: {channel.playlistSource}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelCard;