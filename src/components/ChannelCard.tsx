'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Play, Heart, MoreVertical, Tv, Globe, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChannelCardProps, Quality } from '@/types'; // Import ajouté
import { cn } from '@/lib/utils';
import { ChannelReliabilityIndicator } from '@/components/ChannelReliabilityIndicator';
import { useTranslations } from 'next-intl';

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onPlay,
  onToggleFavorite,
  isFavorite,
  showCategory = true,
  showReliabilityIndicator = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('ChannelCard');

  // Mémorisation des mappings
  const categoryColors = useMemo(() => ({
    'News': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Sports': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Entertainment': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Movies': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Music': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'Documentary': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Kids': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'General': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'Undefined': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }), []);

  const countryFlags = useMemo(() => ({
    'France': '🇫🇷',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺'
  }), []);

  // Map pour afficher la qualité de manière lisible
  const qualityMap = useMemo(() => ({
    [Quality.HIGH]: 'HD',
    [Quality.MEDIUM]: 'SD',
    [Quality.LOW]: 'LD',
    [Quality.AUTO]: 'Auto'
  }), []);

  const handlePlay = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    setIsLoading(true);
    onPlay(channel);
    
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(5);
    }
  }, [onPlay, channel]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onToggleFavorite(channel);
  }, [onToggleFavorite, channel]);

  // Gestion du focus TV étendue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === cardRef.current) {
        if (e.key === 'Enter') {
          handlePlay();
        }
        if (e.key === ' ') {
          e.preventDefault();
          setIsFocused(prev => !prev);
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          // Logique de navigation entre cartes (à gérer dans le composant parent)
        }
      }
    };

    const card = cardRef.current;
    card?.addEventListener('keydown', handleKeyDown);
    
    return () => card?.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay]);

  const isValidImageUrl = (url: string | undefined): boolean => {
    return !!url && url.startsWith('http');
  };

  const cardClasses = cn(
    "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105",
    "border-2 hover:border-primary/50 focus:outline-none",
    isHovered && "shadow-xl",
    isFocused && "ring-4 ring-primary/50 scale-[1.03]"
  );

  return (
    <Card 
      ref={cardRef}
      className={cardClasses}
      role="button"
      tabIndex={0}
      aria-label={`${channel.name}, ${t('liveBadge')}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePlay}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlay(e);
        }
      }}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-t-lg">
          {isValidImageUrl(channel.tvgLogo) && !imageError ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              )}
              <Image
                src={channel.tvgLogo!}
                alt={channel.name}
                fill
                priority={false}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={(e) => {
                  setImageError(true);
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
              <Tv className="h-12 w-12 text-primary/60" />
            </div>
          )}

          {/* Overlay interactif */}
          <div className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 z-20",
            (isHovered || isFocused) ? "opacity-100" : "opacity-0"
          )}>
            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground min-h-12 min-w-12 touch-target hover:animate-pulse focus:ring-4 focus:ring-white focus:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay(e);
              }}
              aria-label={t('watchButton', { channel: channel.name })}
            >
              <Play className="h-6 w-6 ml-1" fill="currentColor" />
            </Button>
          </div>

          {/* Badge LIVE */}
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="destructive" className="text-xs">
              🔴 {t('liveBadge')}
            </Badge>
          </div>

          {/* Indicateur de fiabilité */}
          {showReliabilityIndicator && (
            <div className="absolute top-2 right-12 z-10">
              <ChannelReliabilityIndicator
                channelId={channel.id}
                channelUrl={channel.url}
                showDetails={false}
                compact={true}
              />
            </div>
          )}

          {/* Bouton favori */}
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full bg-black/50 hover:bg-black/70 transition-colors min-h-8 min-w-8 touch-target",
                isFavorite && "text-red-500 hover:text-red-600"
              )}
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')}
              aria-pressed={isFavorite}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isFavorite && "fill-current animate-pulse"
                )} 
              />
            </Button>
          </div>

          {/* Badge de qualité - CORRECTION APPLIQUÉE */}
          {channel.quality && ( // Solution temporaire - voir explication
{channel.quality && channel.quality !== Quality.AUTO && (
  <Badge className="absolute bottom-2 left-2 bg-background/80 text-foreground z-10">
    {qualityMap[channel.quality]}
  </Badge>
)}
          )}
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
                  className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity min-h-8 min-w-8 touch-target md:opacity-70"
                  onClick={(e) => e.preventDefault()}
                  aria-label={t('moreOptions')}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePlay} className="cursor-pointer">
                  <Play className="mr-2 h-4 w-4" />
                  {t('watchButton')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite} className="cursor-pointer">
                  <Heart className="mr-2 h-4 w-4" />
                  {isFavorite ? t('removeFavorite') : t('addFavorite')}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  {t('shareButton')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
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
                className={cn("text-xs", categoryColors[channel.group] || categoryColors['General'])}
              >
                {t(`categories.${channel.group}`, { defaultValue: channel.group })}
              </Badge>
            )}

            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              {channel.country && (
                <div className="flex items-center space-x-1">
                  <span>{countryFlags[channel.country] || '🌍'}</span>
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
              {t('sourceLabel')}: {channel.playlistSource}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelCard;