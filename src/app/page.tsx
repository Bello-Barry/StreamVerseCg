
'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import HomePage from '@/components/pages/HomePage';
import CategoriesPage from '@/components/pages/CategoriesPage';
import FavoritesPage from '@/components/pages/FavoritesPage';
import HistoryPage from '@/components/pages/HistoryPage';
import SearchPage from '@/components/pages/SearchPage';
import PlayerPage from '@/components/pages/PlayerPage';
import PlaylistsPage from '@/components/pages/PlaylistsPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { NotificationsPage } from '@/components/pages/NotificationsPage';
import { ThemesPage } from '@/components/pages/ThemesPage';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { useAppStore } from '@/stores/useAppStore';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import type { AppState, Channel } from '@/types';
import { ViewType } from '@/types';

// Import des nouveaux composants
import { SmartChannelGrid } from '@/components/SmartChannelGrid';
import { ChannelAlternativesModal } from '@/components/ChannelAlternativesModal';

export default function StreamVersePage() {
  const {
    currentView,
    searchQuery,
    setCurrentView,
    setSearchQuery,
    setCurrentChannel
  } = useAppStore();

  const { channels, refreshPlaylists } = usePlaylistStore();

  // États pour le modal d'alternatives
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [failedChannel, setFailedChannel] = useState<Channel | null>(null);

  // Charger les playlists au démarrage
  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as ViewType);
  };

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setCurrentView(ViewType.PLAYER); // Naviguer vers la page du lecteur
  };

  // Gérer l'échec de lecture pour ouvrir le modal d'alternatives
  const handlePlaybackError = (channel: Channel) => {
    setFailedChannel(channel);
    setShowAlternatives(true);
  };

  const handleRetryChannel = (channel: Channel) => {
    // Logique pour réessayer la chaîne, par exemple en la re-sélectionnant
    handleChannelSelect(channel);
    setShowAlternatives(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case ViewType.HOME:
        // Remplacer HomePage par SmartChannelGrid si c'est la vue principale des chaînes
        // Pour cet exemple, nous allons garder HomePage et montrer comment SmartChannelGrid pourrait être utilisé à l'intérieur
        // Si HomePage est votre page d'accueil avec une grille de chaînes, vous pourriez la remplacer par:
        // return <SmartChannelGrid channels={channels} onChannelSelect={handleChannelSelect} showRecommendations={true} enableFilters={true} />;
        return <HomePage onChannelSelect={handleChannelSelect} onPlaybackError={handlePlaybackError} />;
      case ViewType.CATEGORIES:
        return <CategoriesPage />;
      case ViewType.FAVORITES:
        return <FavoritesPage />;
      case ViewType.HISTORY:
        return <HistoryPage />;
      case ViewType.SEARCH:
        return <SearchPage />;
      case ViewType.PLAYER:
        return <PlayerPage onPlaybackError={handlePlaybackError} />;
      case ViewType.PLAYLISTS:
        return <PlaylistsPage />;
      case ViewType.ANALYTICS:
        return <AnalyticsPage />;
      case ViewType.NOTIFICATIONS:
        return <NotificationsPage />;
      case ViewType.THEMES:
        return <ThemesPage />;
      default:
        return <HomePage onChannelSelect={handleChannelSelect} onPlaybackError={handlePlaybackError} />;
    }
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AnalyticsProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-background text-foreground" data-testid="app-container">
            <Header
              onSearch={handleSearch}
              searchQuery={searchQuery}
              currentView={currentView}
              onViewChange={handleViewChange}
            />

            <main className="container mx-auto px-4 py-6">
              {renderCurrentView()}
            </main>

            <Toaster />

            {/* Modal d'alternatives pour les chaînes */}
            <ChannelAlternativesModal
              isOpen={showAlternatives}
              onClose={() => setShowAlternatives(false)}
              failedChannel={failedChannel}
              allChannels={channels} // Passer toutes les chaînes disponibles
              onChannelSelect={handleChannelSelect}
              onRetry={() => {
  if (failedChannel) {
    handleRetryChannel(failedChannel);
  }
}}
            />
          </div>
        </NotificationProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}