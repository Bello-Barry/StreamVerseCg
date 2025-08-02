export interface AnalyticsEvent {
  id: string
  type:
    | 'channel_view'
    | 'channel_play'
    | 'search'
    | 'favorite_add'
    | 'favorite_remove'
    | 'playlist_add'
    | 'playlist_remove'
    | 'page_view'
    | 'session_end' // ✅ Ajouté ici
  data: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

export interface AnalyticsMetrics {
  totalEvents: number
  uniqueUsers: number
  topChannels: Array<{ id: string; name: string; views: number; plays: number }>
  topSearches: Array<{ query: string; count: number }>
  pageViews: Record<string, number>
  favoriteStats: { adds: number; removes: number }
  playlistStats: { adds: number; removes: number }
  sessionDuration: number
  deviceTypes: Record<string, number>
  timeRanges: Record<string, number>
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private userId?: string
  private sessionStart: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStart = Date.now()
    this.loadStoredEvents()
    this.setupBeforeUnload()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadStoredEvents(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('streamverse_analytics')
      if (stored) {
        this.events = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load analytics data:', error)
    }
  }

  private saveEvents(): void {
    if (typeof window === 'undefined') return
    
    try {
      // Keep only last 1000 events to prevent storage overflow
      const eventsToStore = this.events.slice(-1000)
      localStorage.setItem('streamverse_analytics', JSON.stringify(eventsToStore))
    } catch (error) {
      console.warn('Failed to save analytics data:', error)
    }
  }

  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') return
    
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        duration: Date.now() - this.sessionStart,
        eventsCount: this.events.length
      })
      this.saveEvents()
    })
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  trackEvent(type: AnalyticsEvent['type'], data: Record<string, any> = {}): void {
    if (typeof window === 'undefined') return
    
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    }

    this.events.push(event)
    this.saveEvents()

    // In a real app, you would send this to your analytics server
    console.log('Analytics Event:', event)
  }

  trackChannelView(channelId: string, channelName: string, category?: string): void {
    this.trackEvent('channel_view', {
      channelId,
      channelName,
      category
    })
  }

  trackChannelPlay(channelId: string, channelName: string, category?: string): void {
    this.trackEvent('channel_play', {
      channelId,
      channelName,
      category
    })
  }

  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent('search', {
      query,
      resultsCount
    })
  }

  trackFavoriteAdd(channelId: string, channelName: string): void {
    this.trackEvent('favorite_add', {
      channelId,
      channelName
    })
  }

  trackFavoriteRemove(channelId: string, channelName: string): void {
    this.trackEvent('favorite_remove', {
      channelId,
      channelName
    })
  }

  trackPlaylistAdd(playlistName: string, playlistUrl: string): void {
    this.trackEvent('playlist_add', {
      playlistName,
      playlistUrl
    })
  }

  trackPlaylistRemove(playlistName: string): void {
    this.trackEvent('playlist_remove', {
      playlistName
    })
  }

  trackPageView(page: string): void {
    this.trackEvent('page_view', {
      page
    })
  }

  getMetrics(): AnalyticsMetrics {
    const now = Date.now()
    const channelViews = new Map<string, { name: string; views: number; plays: number }>()
    const searches = new Map<string, number>()
    const pageViews: Record<string, number> = {}
    let favoriteAdds = 0
    let favoriteRemoves = 0
    let playlistAdds = 0
    let playlistRemoves = 0
    const deviceTypes: Record<string, number> = {}
    const timeRanges: Record<string, number> = {
      '0-6': 0,
      '6-12': 0,
      '12-18': 0,
      '18-24': 0
    }

    const uniqueUsers = new Set<string>()

    this.events.forEach(event => {
      if (event.userId) {
        uniqueUsers.add(event.userId)
      } else {
        uniqueUsers.add(event.sessionId)
      }

      // Track device types
      const userAgent = event.data.userAgent || ''
      if (userAgent.includes('Mobile')) {
        deviceTypes.mobile = (deviceTypes.mobile || 0) + 1
      } else if (userAgent.includes('Tablet')) {
        deviceTypes.tablet = (deviceTypes.tablet || 0) + 1
      } else {
        deviceTypes.desktop = (deviceTypes.desktop || 0) + 1
      }

      // Track time ranges
      const hour = new Date(event.timestamp).getHours()
      if (hour >= 0 && hour < 6) timeRanges['0-6']++
      else if (hour >= 6 && hour < 12) timeRanges['6-12']++
      else if (hour >= 12 && hour < 18) timeRanges['12-18']++
      else timeRanges['18-24']++

      switch (event.type) {
        case 'channel_view':
          const viewKey = event.data.channelId
          if (!channelViews.has(viewKey)) {
            channelViews.set(viewKey, {
              name: event.data.channelName,
              views: 0,
              plays: 0
            })
          }
          channelViews.get(viewKey)!.views++
          break

        case 'channel_play':
          const playKey = event.data.channelId
          if (!channelViews.has(playKey)) {
            channelViews.set(playKey, {
              name: event.data.channelName,
              views: 0,
              plays: 0
            })
          }
          channelViews.get(playKey)!.plays++
          break

        case 'search':
          const query = event.data.query.toLowerCase()
          searches.set(query, (searches.get(query) || 0) + 1)
          break

        case 'page_view':
          const page = event.data.page
          pageViews[page] = (pageViews[page] || 0) + 1
          break

        case 'favorite_add':
          favoriteAdds++
          break

        case 'favorite_remove':
          favoriteRemoves++
          break

        case 'playlist_add':
          playlistAdds++
          break

        case 'playlist_remove':
          playlistRemoves++
          break
      }
    })

    const topChannels = Array.from(channelViews.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.views + b.plays) - (a.views + a.plays))
      .slice(0, 10)

    const topSearches = Array.from(searches.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: this.events.length,
      uniqueUsers: uniqueUsers.size,
      topChannels,
      topSearches,
      pageViews,
      favoriteStats: { adds: favoriteAdds, removes: favoriteRemoves },
      playlistStats: { adds: playlistAdds, removes: playlistRemoves },
      sessionDuration: now - this.sessionStart,
      deviceTypes,
      timeRanges
    }
  }

  exportData(): string {
    return JSON.stringify({
      events: this.events,
      metrics: this.getMetrics(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  clearData(): void {
    this.events = []
    localStorage.removeItem('streamverse_analytics')
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  return {
    trackChannelView: analytics.trackChannelView.bind(analytics),
    trackChannelPlay: analytics.trackChannelPlay.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackFavoriteAdd: analytics.trackFavoriteAdd.bind(analytics),
    trackFavoriteRemove: analytics.trackFavoriteRemove.bind(analytics),
    trackPlaylistAdd: analytics.trackPlaylistAdd.bind(analytics),
    trackPlaylistRemove: analytics.trackPlaylistRemove.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    getMetrics: analytics.getMetrics.bind(analytics),
    exportData: analytics.exportData.bind(analytics),
    clearData: analytics.clearData.bind(analytics)
  }
}

