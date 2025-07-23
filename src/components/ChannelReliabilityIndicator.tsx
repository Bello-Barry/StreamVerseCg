'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, XCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useChannelValidator, ChannelStatus } from '@/lib/channelValidator'

interface ChannelReliabilityIndicatorProps {
  channelId: string
  channelUrl: string
  showDetails?: boolean
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg'
}

export function ChannelReliabilityIndicator({
  channelId,
  channelUrl,
  showDetails = false,
  size = 'md'
}: ChannelReliabilityIndicatorProps) {
  const { getChannelStatus } = useChannelValidator()
  const [status, setStatus] = useState<ChannelStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const channelStatus = getChannelStatus(channelId)
    setStatus(channelStatus)
  }, [channelId, getChannelStatus])

  const getStatusIcon = () => {
    if (isLoading) {
      return <Clock className={`animate-spin ${getIconSize()}`} />
    }

    switch (status?.status) {
      case 'online':
        return <CheckCircle className={`text-green-500 ${getIconSize()}`} />
      case 'offline':
        return <XCircle className={`text-red-500 ${getIconSize()}`} />
      case 'checking':
        return <Clock className={`text-yellow-500 animate-pulse ${getIconSize()}`} />
      default:
        return <AlertCircle className={`text-gray-400 ${getIconSize()}`} />
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3'
      case 'lg': return 'h-6 w-6'
      default: return 'h-4 w-4'
    }
  }

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 80) return 'bg-green-500'
    if (reliability >= 60) return 'bg-yellow-500'
    if (reliability >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    switch (status?.status) {
      case 'online':
        return 'En ligne'
      case 'offline':
        return 'Hors ligne'
      case 'checking':
        return 'Vérification...'
      default:
        return 'Statut inconnu'
    }
  }

  const formatLastChecked = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {status && (
                <div className={`w-2 h-2 rounded-full ${getReliabilityColor(status.reliability)}`} />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{getStatusText()}</div>
              {status && (
                <>
                  <div>Fiabilité: {status.reliability}%</div>
                  {status.responseTime && (
                    <div>Temps de réponse: {status.responseTime}ms</div>
                  )}
                  <div>Vérifié: {formatLastChecked(status.lastChecked)}</div>
                  {status.errorMessage && (
                    <div className="text-red-400 text-xs mt-1">
                      {status.errorMessage}
                    </div>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      
      {status && (
        <>
          <Badge 
            variant={status.status === 'online' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {getStatusText()}
          </Badge>
          
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${getReliabilityColor(status.reliability)}`} />
            <span className="text-xs text-muted-foreground">
              {status.reliability}%
            </span>
          </div>

          {status.responseTime && (
            <div className="flex items-center gap-1">
              {status.responseTime < 2000 ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-orange-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {status.responseTime}ms
              </span>
            </div>
          )}

          <span className="text-xs text-muted-foreground">
            {formatLastChecked(status.lastChecked)}
          </span>
        </>
      )}
    </div>
  )
}

// Composant pour afficher les statistiques globales
export function GlobalChannelStats() {
  const { getGlobalStats } = useChannelValidator()
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    unknown: 0,
    averageReliability: 0
  })

  useEffect(() => {
    const updateStats = () => {
      const globalStats = getGlobalStats()
      setStats(globalStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval)
  }, [getGlobalStats])

  if (stats.total === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.online}</div>
        <div className="text-sm text-muted-foreground">En ligne</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
        <div className="text-sm text-muted-foreground">Hors ligne</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-600">{stats.unknown}</div>
        <div className="text-sm text-muted-foreground">Inconnu</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          {Math.round(stats.averageReliability)}%
        </div>
        <div className="text-sm text-muted-foreground">Fiabilité moy.</div>
      </div>
    </div>
  )
}