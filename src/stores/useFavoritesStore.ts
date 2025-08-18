// stores/useFavoritesStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Channel } from '@/types';

interface FavoriteRecord {
  id: number;
  channel_id: string;
  channel_name: string;
  channel_group: string | null;
  created_at: string;
  vote_count: number;
}

interface FavoritesState {
  favorites: FavoriteRecord[];
  loading: boolean;
  error: string | null;
}

interface FavoritesStore extends FavoritesState {
  // Actions de base
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (channel: Channel) => Promise<void>;
  addFavorite: (channel: Channel) => Promise<void>;
  removeFavorite: (channelId: string) => Promise<void>;
  isFavorite: (channelId: string) => boolean;
  
  // Actions étendues
  clearAllFavorites: () => Promise<void>;
  getFavoriteChannels: (allChannels: Channel[]) => Channel[];
  getFavoritesByCategory: (allChannels: Channel[]) => Record<string, Channel[]>;
  getFavoritesCount: () => number;
  exportFavorites: () => string[];
  importFavorites: (favoriteIds: string[], allChannels: Channel[]) => Promise<void>;
  
  // Nouvelles fonctionnalités collaboratives
  getMostPopularFavorites: (limit?: number) => FavoriteRecord[];
  getRecentFavorites: (limit?: number) => FavoriteRecord[];
}

export const useFavoritesStore = create<FavoritesStore>()((set, get) => ({
  favorites: [],
  loading: false,
  error: null,

  // Récupérer tous les favoris depuis Supabase
  fetchFavorites: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('vote_count', { ascending: false });

      if (error) throw error;
      
      set({ favorites: data || [], loading: false });
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false 
      });
    }
  },

  // Basculer le statut favori d'une chaîne
  toggleFavorite: async (channel: Channel) => {
    const { favorites } = get();
    const existingFavorite = favorites.find(f => f.channel_id === channel.id);
    
    if (existingFavorite) {
      await get().removeFavorite(channel.id);
    } else {
      await get().addFavorite(channel);
    }
  },

  // Ajouter une chaîne aux favoris
  addFavorite: async (channel: Channel) => {
    try {
      // Vérifier si la chaîne existe déjà
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('channel_id', channel.id)
        .single();

      if (existing) {
        // Si elle existe, incrémenter le vote_count
        const { error } = await supabase
          .from('favorites')
          .update({ vote_count: existing.vote_count + 1 })
          .eq('channel_id', channel.id);

        if (error) throw error;
      } else {
        // Si elle n'existe pas, la créer
        const { error } = await supabase
          .from('favorites')
          .insert({
            channel_id: channel.id,
            channel_name: channel.name,
            channel_group: channel.group || null,
            vote_count: 1
          });

        if (error) throw error;
      }

      // Recharger les favoris
      await get().fetchFavorites();
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  },

  // Retirer une chaîne des favoris
  removeFavorite: async (channelId: string) => {
    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('channel_id', channelId)
        .single();

      if (existing) {
        if (existing.vote_count > 1) {
          // Si vote_count > 1, décrémenter
          const { error } = await supabase
            .from('favorites')
            .update({ vote_count: existing.vote_count - 1 })
            .eq('channel_id', channelId);

          if (error) throw error;
        } else {
          // Si vote_count = 1, supprimer complètement
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('channel_id', channelId);

          if (error) throw error;
        }

        // Recharger les favoris
        await get().fetchFavorites();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  },

  // Vérifier si une chaîne est dans les favoris
  isFavorite: (channelId: string) => {
    const { favorites } = get();
    return favorites.some(f => f.channel_id === channelId);
  },

  // Supprimer tous les favoris
  clearAllFavorites: async () => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .gte('id', 0); // Supprimer tous les enregistrements

      if (error) throw error;
      
      set({ favorites: [] });
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les favoris:', error);
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  },

  // Obtenir les chaînes favorites à partir de toutes les chaînes
  getFavoriteChannels: (allChannels: Channel[]) => {
    const { favorites } = get();
    const favoriteIds = favorites.map(f => f.channel_id);
    return allChannels.filter(channel => favoriteIds.includes(channel.id));
  },

  // Grouper les favoris par catégorie
  getFavoritesByCategory: (allChannels: Channel[]) => {
    const favoriteChannels = get().getFavoriteChannels(allChannels);
    const categoryMap: Record<string, Channel[]> = {};
    
    favoriteChannels.forEach(channel => {
      const category = channel.group || 'Non défini';
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(channel);
    });
    
    return categoryMap;
  },

  // Obtenir le nombre de favoris
  getFavoritesCount: () => get().favorites.length,

  // Exporter les favoris (IDs seulement)
  exportFavorites: () => get().favorites.map(f => f.channel_id),

  // Importer des favoris
  importFavorites: async (favoriteIds: string[], allChannels: Channel[]) => {
    try {
      const channelsToImport = allChannels.filter(ch => favoriteIds.includes(ch.id));
      
      for (const channel of channelsToImport) {
        await get().addFavorite(channel);
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation des favoris:', error);
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  },

  // Obtenir les favoris les plus populaires
  getMostPopularFavorites: (limit = 10) => {
    const { favorites } = get();
    return favorites
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, limit);
  },

  // Obtenir les favoris récents
  getRecentFavorites: (limit = 10) => {
    const { favorites } = get();
    return favorites
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}));