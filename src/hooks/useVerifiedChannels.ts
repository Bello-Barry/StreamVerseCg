// 1. Nouveau hook pour gérer les chaînes vérifiées + favoris personnels
// hooks/useVerifiedChannels.ts
import { useState, useEffect } from 'react';
import { Channel } from '@/types';

interface VerifiedChannelsData {
  lastUpdated: string;
  channels: Channel[];
  version: string;
}

export function useVerifiedChannels() {
  const [verifiedChannels, setVerifiedChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadVerifiedChannels();
  }, []);

  const loadVerifiedChannels = async () => {
    try {
      const response = await fetch('/verified-channels.json');
      if (response.ok) {
        const data: VerifiedChannelsData = await response.json();
        setVerifiedChannels(data.channels);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Erreur chargement chaînes vérifiées:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    verifiedChannels,
    loading,
    lastUpdated,
    reload: loadVerifiedChannels
  };
}
