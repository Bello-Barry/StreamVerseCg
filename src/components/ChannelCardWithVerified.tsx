import { CheckCircle } from 'lucide-react';
import { useVerifiedChannelsStore } from '@/stores/useVerifiedChannelsStore';
import { ChannelCard } from './ChannelCard'; // Assurez-vous d'importer correctement votre ChannelCard existant

export function ChannelCardWithVerified({ channel, ...props }: any) {
  const { isVerified } = useVerifiedChannelsStore();
  const verified = isVerified(channel.id);

  return (
    <div className="relative">
      {verified && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Vérifié
          </div>
        </div>
      )}
      <ChannelCard channel={channel} {...props} />
    </div>
  );
}