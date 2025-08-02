'use client'

import { useState, useEffect, JSX } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, Users, Eye, Heart, Search, Clock, Smartphone, Monitor, Tablet, Download, Trash2
} from 'lucide-react'
import { useAnalytics, AnalyticsMetrics } from '@/lib/analytics'

export function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const { getMetrics, exportData, clearData } = useAnalytics()

  useEffect(() => {
    const loadMetrics = () => {
      setMetrics(getMetrics())
    }

    loadMetrics()
    const interval = setInterval(loadMetrics, 5000)

    return () => clearInterval(interval)
  }, [getMetrics])

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `streamverse-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearData = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données d\u2019analytics ?')) {
      clearData()
      setMetrics(getMetrics())
    }
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
  }

  const getDeviceIcon = (device: string): JSX.Element => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des analytics…</p>
        </div>
      </div>
    )
  }

  const maxViewsPlays = Math.max(...metrics.topChannels.map(c => c.views + c.plays)) || 1
  const maxSearchCount = Math.max(...metrics.topSearches.map(s => s.count)) || 1
  const maxPageViews = Math.max(...Object.values(metrics.pageViews)) || 1
  const maxDeviceCount = Math.max(...Object.values(metrics.deviceTypes)) || 1
  const maxTimeRange = Math.max(...Object.values(metrics.timeRanges)) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Analytics & Métriques
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivi d&rsquo;usage et statistiques de l&rsquo;application
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleClearData} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        </div>
      </div>

      {/* Cartes globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.sessionDuration)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoris Ajoutés</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.favoriteStats.adds}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.favoriteStats.removes} supprimés
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chaînes Populaires
            </CardTitle>
            <CardDescription>
              Chaînes les plus vues et regardées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topChannels.slice(0, 5).map((channel, index) => (
                <div key={channel.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.views} vues • {channel.plays} lectures
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{channel.views + channel.plays}</div>
                    <Progress 
                      value={(channel.views + channel.plays) / maxViewsPlays * 100} 
                      className="w-16 h-2 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherches Populaires
            </CardTitle>
            <CardDescription>
              Termes de recherche les plus utilisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topSearches.slice(0, 5).map((search, index) => (
                <div key={search.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm">{search.query}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{search.count}</div>
                    <Progress 
                      value={search.count / maxSearchCount * 100} 
                      className="w-16 h-2 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Page Views */}
        <Card>
          <CardHeader>
            <CardTitle>Vues par Page</CardTitle>
            <CardDescription>
              Répartition du trafic par page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.pageViews)
                .sort(([, a], [, b]) => b - a)
                .map(([page, views]) => (
                <div key={page} className="flex items-center justify-between">
                  <span className="font-medium text-sm capitalize">{page}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{views}</span>
                    <Progress 
                      value={views / maxPageViews * 100} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle>Types d&rsquo;Appareils</CardTitle>
            <CardDescription>
              Répartition par type d&rsquo;appareil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.deviceTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="font-medium text-sm capitalize">{device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{count}</span>
                    <Progress 
                      value={count / maxDeviceCount * 100} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Ranges */}
      <Card>
        <CardHeader>
          <CardTitle>Activité par Heure</CardTitle>
          <CardDescription>
            Répartition de l&rsquo;activité selon les tranches horaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.timeRanges).map(([range, count]) => (
              <div key={range} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{range}h</div>
                <Progress 
                  value={count / maxTimeRange * 100} 
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}