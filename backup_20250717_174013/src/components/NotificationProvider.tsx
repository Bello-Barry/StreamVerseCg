'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useNotifications } from '@/lib/notifications'

// Définition des types pour les détails d'erreur
interface ErrorDetails {
  message: string;
  code?: number;
  stack?: string;
  [key: string]: unknown;
}

interface NotificationContextType {
  requestPermission: () => Promise<boolean>
  notifyChannelUpdate: (channelName: string, playlistName: string) => Promise<void>
  notifyPlaylistUpdate: (playlistName: string, channelCount: number) => Promise<void>
  notifyFavoriteChannelUpdate: (channelName: string) => Promise<void>
  notifyError: (message: string, details?: ErrorDetails) => Promise<void>
  notifySuccess: (message: string, details?: Record<string, unknown>) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications()

  useEffect(() => {
    // Initialize notifications on app start
    if (notifications.isSupported() && notifications.getPermissionStatus() === 'granted') {
      notifications.notifySuccess('StreamVerse est prêt!')
    }
  }, [notifications])

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}