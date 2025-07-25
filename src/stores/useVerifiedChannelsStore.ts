import { create } from 'zustand';
import { Channel } from '@/types';

interface VerifiedChannelsStore {
  verifiedChannels: Channel[];
  loading: boolean;
  lastUpdated: string;
  
  setVerifiedChannels: (channels: Channel[]) => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (date: string) => void;
  
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