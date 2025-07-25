
// 4. Store étendu pour gérer les chaînes vérifiées
// stores/useVerifiedChannelsStore.ts
import { create } from 'zustand';
import { Channel } from '@/types';

interface VerifiedChannelsStore {
  verifiedChannels: Channel[];
  loading: boolean;
  lastUpdated: string;
  
  // Actions
  setVerifiedChannels: (channels: Channel[]) => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (date: string) => void;
  
  // Helpers
  isVerified: (channelId: string) => boolean;
  getVerifiedChannel: (channelId: string) => Channel | undefined;
  getVerifiedCount: () => number;
}

export const useVerifiedChannelsStore = create<VerifiedChannelsStore>((set, get) => ({
  verifiedChannels: [],
  loading: true,
  lastUpdated: '',
  
  setVerifiedChannels: (channels) => set({ verifiedChannels: channels }),
  setLoading: (loading) => set({ loading }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  
  isVerified: (channelId) => {
    return get().verifiedChannels.some(ch => ch.id === channelId);
  },
  
  getVerifiedChannel: (channelId) => {
    return get().verifiedChannels.find(ch => ch.id === channelId);
  },
  
  getVerifiedCount: () => get().verifiedChannels.length,
}));

// 5. Composant ChannelCard modifié pour afficher le badge vérifié
// Modification à apporter dans ton ChannelCard existant
export function ChannelCardWithVerified({ channel, ...props }: any) {
  const { isVerified } = useVerifiedChannelsStore();
  const verified = isVerified(channel.id);

  return (
    <div className="relative">
      {/* Badge vérifié en overlay */}
      {verified && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Vérifié
          </div>
        </div>
      )}
      
      {/* Ton ChannelCard existant */}
      <ChannelCard channel={channel} {...props} />
    </div>
  );
}