// 3. Composant ChannelCard modifié avec badge vérifié
// components/ChannelCardWithVerified.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useVerifiedChannelsStore } from '@/stores/useVerifiedChannelsStore';
import ChannelCard from '@/components/ChannelCard';
import type { Channel } from '@/types';

interface ChannelCardWithVerifiedProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  isFavorite: boolean;
  showCategory?: boolean;
}

export function ChannelCardWithVerified({ 
  channel, 
  onPlay, 
  onToggleFavorite, 
  isFavorite, 
  showCategory 
}: ChannelCardWithVerifiedProps) {
  const { isVerified } = useVerifiedChannelsStore();
  const verified = isVerified(channel.id);

  return (
    <div className="relative">
      {/* Badge vérifié en overlay */}
      {verified && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <CheckCircle className="h-3 w-3" />
            <span className="font-medium">Vérifié</span>
          </div>
        </div>
      )}
      
      {/* Ton ChannelCard existant */}
      <ChannelCard 
        channel={channel}
        onPlay={onPlay}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
        showCategory={showCategory}
      />
    </div>
  );
}
