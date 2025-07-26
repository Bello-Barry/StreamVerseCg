import { useEffect } from 'react';
import { useVerifiedChannelsStore } from '@/stores/useVerifiedChannelsStore';

export function useVerifiedChannels() {
  const {
    verifiedChannels,
    loading,
    lastUpdated,
    loadVerifiedChannels,
    isVerified,
    getVerifiedChannel,
    getVerifiedCount,
    getAllVerifiedChannels
  } = useVerifiedChannelsStore();

  useEffect(() => {
    loadVerifiedChannels();
  }, [loadVerifiedChannels]);

  return {
    verifiedChannels,
    loading,
    lastUpdated,
    isVerified,
    getVerifiedChannel,
    getVerifiedCount,
    getAllVerifiedChannels,
    reload: loadVerifiedChannels
  };
}
