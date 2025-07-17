'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAnalytics } from '@/lib/analytics'

interface AnalyticsContextType {
  trackChannelView: (channelId: string, channelName: string, category?: string) => void
  trackChannelPlay: (channelId: string, channelName: string, category?: string) => void
  trackSearch: (query: string, resultsCount: number) => void
  trackFavoriteAdd: (channelId: string, channelName: string) => void
  trackFavoriteRemove: (channelId: string, channelName: string) => void
  trackPlaylistAdd: (playlistName: string, playlistUrl: string) => void
  trackPlaylistRemove: (playlistName: string) => void
  trackPageView: (page: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics()

  useEffect(() => {
    // Track initial page load
    analytics.trackPageView('app_start')
  }, [analytics])

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}

