'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useNotifications, NotificationData, NotificationSettings } from '@/lib/notifications'
import { Bell, BellOff, Settings, Trash2, Check, X, Play, Volume2, VolumeX, Smartphone } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const {
    requestPermission,
    getSettings,
    updateSettings,
    getNotifications,
    clearNotifications,
    markAsRead,
    getPermissionStatus,
    isSupported: checkSupported,
    notifySuccess,
    notifyError
  } = useNotifications()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const loadData = () => {
      setNotifications(getNotifications())
      setSettings(getSettings())
      setPermissionStatus(getPermissionStatus())
      setIsSupported(checkSupported())
    }

    loadData()
    const interval = setInterval(loadData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isClient, getNotifications, getSettings, getPermissionStatus, checkSupported])

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      setPermissionStatus('granted')
      notifySuccess('Notifications activées avec succès!')
    } else {
      notifyError('Permission refusée pour les notifications')
    }
  }

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return
    
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateSettings(newSettings)
  }

  const handleClearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les notifications ?')) {
      clearNotifications()
      setNotifications([])
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, data: { ...n.data, read: true } }
          : n
      )
    )
  }

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-500" />
      case 'error': return <X className="h-4 w-4 text-red-500" />
      case 'warning': return <Bell className="h-4 w-4 text-yellow-500" />
      case 'channel_update': return <Play className="h-4 w-4 text-blue-500" />
      case 'playlist_update': return <Settings className="h-4 w-4 text-purple-500" />
      default: return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getNotificationBadgeVariant = (type: NotificationData['type']) => {
    switch (type) {
      case 'success': return 'default'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'channel_update': return 'default'
      case 'playlist_update': return 'secondary'
      default: return 'outline'
    }
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Chargement...</h3>
          <p className="text-muted-foreground">
            Initialisation des notifications
          </p>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Notifications non supportées</h3>
          <p className="text-muted-foreground">
            Votre navigateur ne supporte pas les notifications push.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos préférences de notifications et consultez l'historique
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleClearAll} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Tout effacer
          </Button>
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            État des Permissions
          </CardTitle>
          <CardDescription>
            Statut actuel des permissions de notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Autorisées</span>
                </div>
              ) : permissionStatus === 'denied' ? (
                <div className="flex items-center gap-2 text-red-600">
                  <X className="h-4 w-4" />
                  <span className="font-medium">Refusées</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">En attente</span>
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {permissionStatus === 'granted' 
                  ? 'Vous recevrez des notifications'
                  : permissionStatus === 'denied'
                  ? 'Notifications bloquées par le navigateur'
                  : 'Cliquez pour autoriser les notifications'
                }
              </span>
            </div>
            {permissionStatus !== 'granted' && (
              <Button onClick={handleRequestPermission} size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Autoriser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Préférences
            </CardTitle>
            <CardDescription>
              Configurez les types de notifications que vous souhaitez recevoir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications activées</div>
                <div className="text-sm text-muted-foreground">
                  Activer ou désactiver toutes les notifications
                </div>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(value) => handleSettingChange('enabled', value)}
                disabled={permissionStatus !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mises à jour des chaînes</div>
                <div className="text-sm text-muted-foreground">
                  Nouvelles chaînes ajoutées aux playlists
                </div>
              </div>
              <Switch
                checked={settings.channelUpdates}
                onCheckedChange={(value) => handleSettingChange('channelUpdates', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mises à jour des playlists</div>
                <div className="text-sm text-muted-foreground">
                  Modifications des playlists existantes
                </div>
              </div>
              <Switch
                checked={settings.playlistUpdates}
                onCheckedChange={(value) => handleSettingChange('playlistUpdates', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Chaînes favorites</div>
                <div className="text-sm text-muted-foreground">
                  Notifications pour vos chaînes favorites
                </div>
              </div>
              <Switch
                checked={settings.favoriteChannelUpdates}
                onCheckedChange={(value) => handleSettingChange('favoriteChannelUpdates', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications système</div>
                <div className="text-sm text-muted-foreground">
                  Erreurs, succès et informations générales
                </div>
              </div>
              <Switch
                checked={settings.systemNotifications}
                onCheckedChange={(value) => handleSettingChange('systemNotifications', value)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <div>
                    <div className="font-medium">Son</div>
                    <div className="text-sm text-muted-foreground">
                      Jouer un son avec les notifications
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.sound}
                  onCheckedChange={(value) => handleSettingChange('sound', value)}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Vibration</div>
                    <div className="text-sm text-muted-foreground">
                      Vibrer sur les appareils mobiles
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.vibrate}
                  onCheckedChange={(value) => handleSettingChange('vibrate', value)}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des Notifications</span>
            <Badge variant="secondary">{notifications.length}</Badge>
          </CardTitle>
          <CardDescription>
            Toutes vos notifications récentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune notification pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    notification.data?.read 
                      ? 'bg-muted/30' 
                      : 'bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                          {notification.type}
                        </Badge>
                        {!notification.data?.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(notification.timestamp, { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}