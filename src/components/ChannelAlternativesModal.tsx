'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import {
  Play,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Star,
  Wifi,
  Clock,
  X,
  CheckCircle,
} from 'lucide-react'

import { ChannelReliabilityIndicator } from '@/components/ChannelReliabilityIndicator'
import type { Channel } from '@/types'
import { useSmartRecommendation } from '@/lib/smartChannelRecommendation'
import { useChannelValidator } from '@/lib/channelValidator'

interface ChannelAlternativesModalProps {
  isOpen: boolean
  onClose: () => void
  failedChannel: Channel | null
  allChannels: Channel[]
  onChannelSelect: (channel: Channel) => void
  onRetry: () => void
}

export function ChannelAlternativesModal({
  isOpen,
  onClose,
  failedChannel,
  allChannels,
  onChannelSelect,
  onRetry,
}: ChannelAlternativesModalProps) {
  const [alternatives, setAlternatives] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null)

  const { getChannelAlternatives } = useSmartRecommendation()
  const { validateChannel } = useChannelValidator()

  useEffect(() => {
    if (isOpen && failedChannel) {
      loadAlternatives()
    }
  }, [isOpen, failedChannel])

  const loadAlternatives = async () => {
    if (!failedChannel) return

    setIsLoading(true)
    try {
      const recommendedAlternatives = getChannelAlternatives(
        failedChannel,
        allChannels,
        8
      )

      setAlternatives(recommendedAlternatives)

      recommendedAlternatives.forEach(async (channel) => {
        try {
          await validateChannel(channel.id, channel.url)
        } catch (error) {
          console.error(`Erreur lors de la validation de ${channel.name}:`, error)
        }
      })
    } catch (error) {
      console.error('Erreur lors du chargement des alternatives:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAlternativeSelect = (channel: Channel) => {
    setSelectedAlternative(channel.id)
    onChannelSelect(channel)
    onClose()
  }

  const handleRetry = () => {
    onRetry()
    onClose()
  }

  if (!failedChannel) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Problème de Lecture
          </DialogTitle>
          <DialogDescription>
            La chaîne "{failedChannel.name}" ne peut pas être lue actuellement. Voici quelques alternatives que vous pourriez apprécier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chaîne en échec */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{failedChannel.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {failedChannel.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChannelReliabilityIndicator
                    channelId={failedChannel.id}
                    channelUrl={failedChannel.url}
                    showDetails={true}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conseils de dépannage */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                Conseils de Dépannage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Vérifiez votre connexion Internet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <span>Essayez de recharger la page</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Attendez quelques minutes et réessayez</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-purple-500" />
                    <span>Essayez une chaîne alternative ci-dessous</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternatives recommandées */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Chaînes Alternatives Recommandées
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Recherche d'alternatives...
                </span>
              </div>
            ) : alternatives.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">
                    Aucune alternative trouvée pour cette chaîne.
                    <br />
                    Essayez de naviguer dans les catégories pour trouver d'autres chaînes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternatives.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAlternative === channel.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleAlternativeSelect(channel)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {channel.tvgLogo ? (
                              <img
                                src={channel.tvgLogo}
                                alt={channel.name}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <Play className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium">{channel.name}</h5>
                            <p className="text-xs text-muted-foreground">
                              {channel.category}
                            </p>
                          </div>
                        </div>
                        <ChannelReliabilityIndicator
                          channelId={channel.id}
                          channelUrl={channel.url}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {channel.category === failedChannel.category && (
                            <Badge variant="secondary" className="text-xs">
                              Même catégorie
                            </Badge>
                          )}
                          {channel.language && (
                            <Badge variant="outline" className="text-xs">
                              {channel.language}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer la chaîne originale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}