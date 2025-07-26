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
  loadVerifiedChannels: () => Promise<void>;
  
  // Helpers
  isVerified: (channelId: string) => boolean;
  getVerifiedChannel: (channelId: string) => Channel | undefined;
  getVerifiedCount: () => number;
  getAllVerifiedChannels: () => Channel[];
}

export const useVerifiedChannelsStore = create<VerifiedChannelsStore>((set, get) => ({
  verifiedChannels: [],
  loading: true,
  lastUpdated: '',
  
  setVerifiedChannels: (channels) => set({ verifiedChannels: channels }),
  setLoading: (loading) => set({ loading }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  
  loadVerifiedChannels: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/verified-channels.json');
      if (response.ok) {
        const data = await response.json();
        set({ 
          verifiedChannels: data.channels || [],
          lastUpdated: data.lastUpdated || '',
          loading: false
        });
      } else {
        console.log('Pas de chaînes vérifiées trouvées');
        set({ loading: false });
      }
    } catch (error) {
      console.error('Erreur chargement chaînes vérifiées:', error);
      set({ loading: false });
    }
  },
  
  isVerified: (channelId) => {
    return get().verifiedChannels.some(ch => ch.id === channelId);
  },
  
  getVerifiedChannel: (channelId) => {
    return get().verifiedChannels.find(ch => ch.id === channelId);
  },
  
  getVerifiedCount: () => get().verifiedChannels.length,
  
  getAllVerifiedChannels: () => get().verifiedChannels,
}));
