export interface NotificationData {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  timestamp: number
  type: 'info' | 'success' | 'warning' | 'error' | 'channel_update' | 'playlist_update'
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationSettings {
  enabled: boolean
  channelUpdates: boolean
  playlistUpdates: boolean
  favoriteChannelUpdates: boolean
  systemNotifications: boolean
  sound: boolean
  vibrate: boolean
}

class NotificationService {
  private permission: NotificationPermission = 'default'
  private settings: NotificationSettings
  private notifications: NotificationData[] = []
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.settings = this.loadSettings()
    this.initializePermission()
    this.registerServiceWorker()
  }

  private loadSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem('streamverse_notification_settings')
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error)
    }
    return this.getDefaultSettings()
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      channelUpdates: true,
      playlistUpdates: true,
      favoriteChannelUpdates: true,
      systemNotifications: true,
      sound: true,
      vibrate: true
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('streamverse_notification_settings', JSON.stringify(this.settings))
    } catch (error) {
      console.warn('Failed to save notification settings:', error)
    }
  }

  private async initializePermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = Notification.permission
      if (this.permission === 'default') {
        // Don't request permission automatically, let user enable it
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered successfully')
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    
    if (permission === 'granted') {
      this.settings.enabled = true
      this.saveSettings()
      return true
    }

    return false
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  async showNotification(data: Omit<NotificationData, 'id' | 'timestamp'>): Promise<void> {
    if (!this.settings.enabled || this.permission !== 'granted') {
      return
    }

    const notification: NotificationData = {
      ...data,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    // Check if this type of notification is enabled
    if (!this.isNotificationTypeEnabled(notification.type)) {
      return
    }

    this.notifications.push(notification)
    this.saveNotifications()

    // Show browser notification
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/icon-72x72.png',
        image: notification.image,
        tag: notification.tag,
        data: notification.data,
        actions: notification.actions,
        vibrate: this.settings.vibrate ? [200, 100, 200] : undefined,
        silent: !this.settings.sound,
        requireInteraction: notification.type === 'error',
        timestamp: notification.timestamp
      })
    } else {
      // Fallback to regular notification
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        tag: notification.tag,
        data: notification.data,
        vibrate: this.settings.vibrate ? [200, 100, 200] : undefined,
        silent: !this.settings.sound
      })

      // Auto-close after 5 seconds for non-error notifications
      if (notification.type !== 'error') {
        setTimeout(() => browserNotification.close(), 5000)
      }
    }
  }

  private isNotificationTypeEnabled(type: NotificationData['type']): boolean {
    switch (type) {
      case 'channel_update':
        return this.settings.channelUpdates
      case 'playlist_update':
        return this.settings.playlistUpdates
      case 'info':
      case 'success':
      case 'warning':
      case 'error':
        return this.settings.systemNotifications
      default:
        return true
    }
  }

  private saveNotifications(): void {
    try {
      // Keep only last 50 notifications
      const notificationsToStore = this.notifications.slice(-50)
      localStorage.setItem('streamverse_notifications', JSON.stringify(notificationsToStore))
    } catch (error) {
      console.warn('Failed to save notifications:', error)
    }
  }

  getNotifications(): NotificationData[] {
    return [...this.notifications].reverse() // Most recent first
  }

  clearNotifications(): void {
    this.notifications = []
    localStorage.removeItem('streamverse_notifications')
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.data = { ...notification.data, read: true }
      this.saveNotifications()
    }
  }

  // Predefined notification methods
  async notifyChannelUpdate(channelName: string, playlistName: string): Promise<void> {
    await this.showNotification({
      type: 'channel_update',
      title: 'Nouvelle chaîne disponible',
      body: `${channelName} a été ajoutée à ${playlistName}`,
      icon: '/icons/icon-192x192.png',
      tag: 'channel_update',
      data: { channelName, playlistName }
    })
  }

  async notifyPlaylistUpdate(playlistName: string, channelCount: number): Promise<void> {
    await this.showNotification({
      type: 'playlist_update',
      title: 'Playlist mise à jour',
      body: `${playlistName} contient maintenant ${channelCount} chaînes`,
      icon: '/icons/icon-192x192.png',
      tag: 'playlist_update',
      data: { playlistName, channelCount }
    })
  }

  async notifyFavoriteChannelUpdate(channelName: string): Promise<void> {
    if (!this.settings.favoriteChannelUpdates) return

    await this.showNotification({
      type: 'channel_update',
      title: 'Chaîne favorite mise à jour',
      body: `${channelName} est maintenant disponible`,
      icon: '/icons/icon-192x192.png',
      tag: 'favorite_update',
      data: { channelName },
      actions: [
        { action: 'play', title: 'Regarder', icon: '/icons/play.png' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    })
  }

  async notifyError(message: string, details?: any): Promise<void> {
    await this.showNotification({
      type: 'error',
      title: 'Erreur StreamVerse',
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'error',
      data: { details }
    })
  }

  async notifySuccess(message: string, details?: any): Promise<void> {
    await this.showNotification({
      type: 'success',
      title: 'StreamVerse',
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'success',
      data: { details }
    })
  }

  // Schedule notifications (for future features)
  scheduleNotification(data: Omit<NotificationData, 'id' | 'timestamp'>, delay: number): void {
    setTimeout(() => {
      this.showNotification(data)
    }, delay)
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  // Get permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// React hook for notifications
export function useNotifications() {
  return {
    requestPermission: notificationService.requestPermission.bind(notificationService),
    showNotification: notificationService.showNotification.bind(notificationService),
    getSettings: notificationService.getSettings.bind(notificationService),
    updateSettings: notificationService.updateSettings.bind(notificationService),
    getNotifications: notificationService.getNotifications.bind(notificationService),
    clearNotifications: notificationService.clearNotifications.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    notifyChannelUpdate: notificationService.notifyChannelUpdate.bind(notificationService),
    notifyPlaylistUpdate: notificationService.notifyPlaylistUpdate.bind(notificationService),
    notifyFavoriteChannelUpdate: notificationService.notifyFavoriteChannelUpdate.bind(notificationService),
    notifyError: notificationService.notifyError.bind(notificationService),
    notifySuccess: notificationService.notifySuccess.bind(notificationService),
    isSupported: notificationService.isSupported.bind(notificationService),
    getPermissionStatus: notificationService.getPermissionStatus.bind(notificationService)
  }
}

