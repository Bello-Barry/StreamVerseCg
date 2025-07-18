'use client';

import React, { useEffect } from 'react';
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

export default function StreamVersePage() {
  const { 
    currentView, 
    searchQuery, 
    setCurrentView, 
    setSearchQuery 
  } = useAppStore();
  
  const { refreshPlaylists } = usePlaylistStore();

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

  const renderCurrentView = () => {
    switch (currentView) {
      case ViewType.HOME:
        return <HomePage />;
      case ViewType.CATEGORIES:
        return <CategoriesPage />;
      case ViewType.FAVORITES:
        return <FavoritesPage />;
      case ViewType.HISTORY:
        return <HistoryPage />;
      case ViewType.SEARCH:
        return <SearchPage />;
      case ViewType.PLAYER:
        return <PlayerPage />;
      case ViewType.PLAYLISTS:
        return <PlaylistsPage />;
      case ViewType.ANALYTICS:
        return <AnalyticsPage />;
      case ViewType.NOTIFICATIONS:
        return <NotificationsPage />;
      case ViewType.THEMES:
        return <ThemesPage />;
      default:
        return <HomePage />;
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
          </div>
        </NotificationProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}

