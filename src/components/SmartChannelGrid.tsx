'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRecommendationStore } from '@/stores/useRecommendationStore';
import ChannelCard from '@/components/ChannelCard';
import { cn } from '@/lib/utils';

const getColumnCount = () => {
  if (typeof window === 'undefined') return 2;
  if (window.innerWidth >= 1280) return 4;
  if (window.innerWidth >= 768) return 3;
  return 2;
};

export default function SmartChannelGrid() {
  const parentRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(0);
  const columnCountRef = useRef<number>(getColumnCount());

  const {
    recommendedChannels,
    isLoading,
    retryRecommendation,
    toggleFavorite,
    favorites,
    playChannel,
  } = useRecommendationStore();

  const cardHeight = 220;

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(recommendedChannels.length / columnCountRef.current),
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardHeight + 16,
    overscan: 6,
  });

  // Gestion du focus TV/clavier
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const total = recommendedChannels.length;
      const cols = columnCountRef.current;
      const current = focusedIndex.current;

      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowRight':
          focusedIndex.current = (current + 1) % total;
          break;
        case 'ArrowLeft':
          focusedIndex.current = (current - 1 + total) % total;
          break;
        case 'ArrowDown':
          focusedIndex.current = (current + cols) % total;
          break;
        case 'ArrowUp':
          focusedIndex.current = (current - cols + total) % total;
          break;
      }

      const el = document.querySelector(`[data-index='${focusedIndex.current}']`) as HTMLElement;
      el?.focus();
    },
    [recommendedChannels.length]
  );

  useEffect(() => {
    const current = parentRef.current;
    current?.addEventListener('keydown', handleKeyDown);
    return () => current?.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const resize = () => {
      columnCountRef.current = getColumnCount();
      rowVirtualizer.measure();
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [rowVirtualizer]);

  if (isLoading) return <p className="text-center py-6 text-muted-foreground">Chargement…</p>;

  if (recommendedChannels.length === 0)
    return (
      <div className="text-center py-10 text-muted-foreground">
        Aucune recommandation disponible.
        <button
          onClick={retryRecommendation}
          className="text-primary underline ml-2"
        >
          Réessayer
        </button>
      </div>
    );

  return (
    <div
      ref={parentRef}
      tabIndex={0}
      className="outline-none overflow-auto h-full focus:outline-none"
      role="grid"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((row) => {
          const start = row.index * columnCountRef.current;
          const end = start + columnCountRef.current;
          const items = recommendedChannels.slice(start, end);

          return (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: 0,
                transform: `translateY(${row.start}px)`,
                width: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCountRef.current}, minmax(0, 1fr))`,
                gap: '0.75rem',
                padding: '0.75rem',
              }}
            >
              {items.map((channel, i) => {
                const index = start + i;
                return (
                  <div
                    key={channel.id}
                    data-index={index}
                    tabIndex={index === 0 ? 0 : -1}
                    className={cn('focus:ring-2 focus:ring-primary rounded-xl outline-none')}
                  >
                    <ChannelCard
                      channel={channel}
                      onPlay={playChannel}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.includes(channel.id)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}