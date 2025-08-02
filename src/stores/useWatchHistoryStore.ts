import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WatchHistoryState, WatchEntry, WatchStats, Channel } from '@/types';

interface WatchHistoryStore extends WatchHistoryState {
  // Actions étendues
  removeFromHistory: (entryId: string) => void;
  clearOldHistory: (daysOld: number) => void;
  getRecentChannels: (limit?: number) => Channel[];
  getMostWatchedChannels: (limit?: number) => Channel[];
  getWatchTimeByCategory: () => Record<string, number>;
  getWatchingStreak: () => number;
  getTotalWatchTime: () => number;
  getWatchHistoryByDate: (date: Date) => WatchEntry[];
  getWatchHistoryByChannel: (channelId: string) => WatchEntry[];
  exportHistory: () => WatchEntry[];
  importHistory: (entries: WatchEntry[]) => void;
}

const MAX_HISTORY_ENTRIES = 1000; // Limite pour éviter une croissance excessive

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      
      // Actions de base
      addToHistory: (channel, duration) => {
        const newEntry: WatchEntry = {
          id: `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          channel,
          timestamp: new Date(),
          duration,
          completed: duration > 300 // Considéré comme "terminé" si regardé plus de 5 minutes
        };
        
        set((state) => {
          // Supprimer l'ancienne entrée pour la même chaîne si elle existe dans les 5 dernières minutes
          const recentThreshold = new Date(Date.now() - 5 * 60 * 1000);
          const filteredHistory = state.history.filter(entry => 
            !(entry.channel.id === channel.id && entry.timestamp > recentThreshold)
          );
          
          const newHistory = [newEntry, ...filteredHistory];
          
          // Limiter le nombre d'entrées
          if (newHistory.length > MAX_HISTORY_ENTRIES) {
            newHistory.splice(MAX_HISTORY_ENTRIES);
          }
          
          return { history: newHistory };
        });
      },
      
      clearHistory: () => set({ history: [] }),
      
      getWatchStats: (): WatchStats => {
        const { history } = get();
        
        // Temps total de visionnage
        const totalWatchTime = history.reduce((total, entry) => total + entry.duration, 0);
        
        // Catégories favorites (par temps de visionnage)
        const categoryTime: Record<string, number> = {};
        history.forEach(entry => {
          const category = entry.channel.group || 'Undefined';
          categoryTime[category] = (categoryTime[category] || 0) + entry.duration;
        });
        
        const favoriteCategories = Object.entries(categoryTime)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category]) => category);
        
        // Chaînes les plus regardées
        const channelTime: Record<string, { channel: Channel; time: number }> = {};
        history.forEach(entry => {
          if (!channelTime[entry.channel.id]) {
            channelTime[entry.channel.id] = { channel: entry.channel, time: 0 };
          }
          channelTime[entry.channel.id].time += entry.duration;
        });
        
        const mostWatchedChannels = Object.values(channelTime)
          .sort((a, b) => b.time - a.time)
          .slice(0, 10)
          .map(item => item.channel);
        
        // Série de visionnage (jours consécutifs avec au moins une session)
        const watchingStreak = get().getWatchingStreak();
        
        return {
          totalWatchTime,
          favoriteCategories,
          mostWatchedChannels,
          watchingStreak
        };
      },
      
      // Actions étendues
      removeFromHistory: (entryId) => set((state) => ({
        history: state.history.filter(entry => entry.id !== entryId)
      })),
      
      clearOldHistory: (daysOld) => {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        set((state) => ({
          history: state.history.filter(entry => entry.timestamp > cutoffDate)
        }));
      },
      
      getRecentChannels: (limit = 10) => {
        const { history } = get();
        const seenChannels = new Set<string>();
        const recentChannels: Channel[] = [];
        
        for (const entry of history) {
          if (!seenChannels.has(entry.channel.id)) {
            seenChannels.add(entry.channel.id);
            recentChannels.push(entry.channel);
            
            if (recentChannels.length >= limit) break;
          }
        }
        
        return recentChannels;
      },
      
      getMostWatchedChannels: (limit = 10) => {
        const { history } = get();
        const channelTime: Record<string, { channel: Channel; time: number }> = {};
        
        history.forEach(entry => {
          if (!channelTime[entry.channel.id]) {
            channelTime[entry.channel.id] = { channel: entry.channel, time: 0 };
          }
          channelTime[entry.channel.id].time += entry.duration;
        });
        
        return Object.values(channelTime)
          .sort((a, b) => b.time - a.time)
          .slice(0, limit)
          .map(item => item.channel);
      },
      
      getWatchTimeByCategory: () => {
        const { history } = get();
        const categoryTime: Record<string, number> = {};
        
        history.forEach(entry => {
          const category = entry.channel.group || 'Undefined';
          categoryTime[category] = (categoryTime[category] || 0) + entry.duration;
        });
        
        return categoryTime;
      },
      
      getWatchingStreak: () => {
        const { history } = get();
        if (history.length === 0) return 0;
        
        // Grouper par jour
        const dayGroups: Record<string, WatchEntry[]> = {};
        history.forEach(entry => {
          const dayKey = entry.timestamp.toISOString().split('T')[0];
          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = [];
          }
          dayGroups[dayKey].push(entry);
        });
        
        // Calculer la série
        const sortedDays = Object.keys(dayGroups).sort().reverse();
        let streak = 0;
        const currentDate = new Date(); // Corrigé : déclaré en const
        
        for (const day of sortedDays) {
          const dayDate = new Date(day);
          const diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === streak) {
            streak++;
          } else if (diffDays > streak) {
            break;
          }
        }
        
        return streak;
      },
      
      getTotalWatchTime: () => {
        const { history } = get();
        return history.reduce((total, entry) => total + entry.duration, 0);
      },
      
      getWatchHistoryByDate: (date) => {
        const { history } = get();
        const targetDate = date.toISOString().split('T')[0];
        
        return history.filter(entry => 
          entry.timestamp.toISOString().split('T')[0] === targetDate
        );
      },
      
      getWatchHistoryByChannel: (channelId) => {
        const { history } = get();
        return history.filter(entry => entry.channel.id === channelId);
      },
      
      exportHistory: () => get().history,
      
      importHistory: (entries) => set({ history: entries })
    }),
    {
      name: 'streamverse-watch-history-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Limiter la persistance aux 500 dernières entrées pour éviter des problèmes de performance
        history: state.history.slice(0, 500)
      })
    }
  )
);