export interface NotificationData {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, unknown>
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

interface ErrorDetails {
  message?: string
  code?: number
  stack?: string
  [key: string]: unknown
}

class NotificationService {
  private permission: NotificationPermission =
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'

  private settings: NotificationSettings
  private notifications: NotificationData[] = []
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.settings = this.loadSettings()
    if (typeof window !== 'undefined') {
      this.initializePermission()
      this.registerServiceWorker()
    }
  }

  private loadSettings(): NotificationSettings {
    if (typeof window === 'undefined') return this.getDefaultSettings()
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
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('streamverse_notification_settings', JSON.stringify(this.settings))
    } catch (error) {
      console.warn('Failed to save notification settings:', error)
    }
  }

  private async initializePermission(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    this.permission = Notification.permission
  }

  private async registerServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
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
    if (typeof window === 'undefined' || !this.settings.enabled || this.permission !== 'granted') {
      return
    }

    const notification: NotificationData = {
      ...data,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    if (!this.isNotificationTypeEnabled(notification.type)) {
      return
    }

    this.notifications.push(notification)
    this.saveNotifications()

    const options: NotificationOptions = {
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      tag: notification.tag,
      data: notification.data,
      silent: !this.settings.sound,
      // @ts-ignore – actions is not in official NotificationOptions yet
      timestamp: notification.timestamp
    }

    if ('image' in Notification.prototype && notification.image) {
      // @ts-expect-error image is not yet in the standard lib
      options.image = notification.image
    }

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(notification.title, options)
    } else {
      const browserOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        tag: notification.tag,
        data: notification.data,
        silent: !this.settings.sound
      }

      // @ts-ignore – actions is not in official NotificationOptions yet
      browserOptions.actions = notification.actions

      const browserNotification = new Notification(notification.title, browserOptions)

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
    if (typeof window === 'undefined') return
    try {
      const notificationsToStore = this.notifications.slice(-50)
      localStorage.setItem('streamverse_notifications', JSON.stringify(notificationsToStore))
    } catch (error) {
      console.warn('Failed to save notifications:', error)
    }
  }

  getNotifications(): NotificationData[] {
    if (typeof window === 'undefined') return []
    return [...this.notifications].reverse()
  }

  clearNotifications(): void {
    if (typeof window === 'undefined') return
    this.notifications = []
    localStorage.removeItem('streamverse_notifications')
  }

  markAsRead(notificationId: string): void {
    if (typeof window === 'undefined') return
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.data = {
        ...(notification.data || {}),
        read: true
      }
      this.saveNotifications()
    }
  }

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

  async notifyError(message: string, details?: ErrorDetails): Promise<void> {
    await this.showNotification({
      type: 'error',
      title: 'Erreur StreamVerse',
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'error',
      data: { details }
    })
  }

  async notifySuccess(message: string, details?: Record<string, unknown>): Promise<void> {
    await this.showNotification({
      type: 'success',
      title: 'StreamVerse',
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'success',
      data: { details }
    })
  }

  scheduleNotification(data: Omit<NotificationData, 'id' | 'timestamp'>, delay: number): void {
    if (typeof window === 'undefined') return
    setTimeout(() => {
      this.showNotification(data)
    }, delay)
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission
  }
}

export const notificationService = new NotificationService()

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