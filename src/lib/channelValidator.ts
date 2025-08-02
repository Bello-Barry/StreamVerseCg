'use client'

export interface ChannelStatus {
  id: string
  url: string
  status: 'online' | 'offline' | 'checking' | 'unknown'
  lastChecked: Date
  responseTime?: number
  errorMessage?: string
  reliability: number // Score de 0 à 100
}

export interface ValidationResult {
  channelId: string
  isWorking: boolean
  responseTime: number
  errorMessage?: string
}

class ChannelValidator {
  private statusCache: Map<string, ChannelStatus> = new Map()
  private validationQueue: Set<string> = new Set()
  private isValidating = false
  private maxConcurrentChecks = 5
  private checkTimeout = 10000 // 10 secondes
  private cacheExpiry = 300000 // 5 minutes

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadCacheFromStorage()
      // Validation périodique toutes les 10 minutes
      setInterval(() => this.validatePopularChannels(), 600000)
    }
  }

  /**
   * Valide une chaîne spécifique
   */
  async validateChannel(channelId: string, url: string): Promise<ValidationResult> {
    const startTime = Date.now()
    
    try {
      // Vérifier si l'URL est valide
      if (!this.isValidUrl(url)) {
        return {
          channelId,
          isWorking: false,
          responseTime: 0,
          errorMessage: 'URL invalide'
        }
      }

      // Utiliser une requête HEAD pour vérifier la disponibilité
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.checkTimeout)

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // Pour éviter les problèmes CORS
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      // Mettre à jour le cache
      this.updateChannelStatus(channelId, url, {
        status: 'online',
        responseTime,
        lastChecked: new Date(),
        reliability: this.calculateReliability(channelId, true, responseTime)
      })

      return {
        channelId,
        isWorking: true,
        responseTime
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

      // Mettre à jour le cache
      this.updateChannelStatus(channelId, url, {
        status: 'offline',
        responseTime,
        lastChecked: new Date(),
        errorMessage,
        reliability: this.calculateReliability(channelId, false, responseTime)
      })

      return {
        channelId,
        isWorking: false,
        responseTime,
        errorMessage
      }
    }
  }

  /**
   * Valide plusieurs chaînes en parallèle
   */
  async validateChannels(channels: Array<{id: string, url: string}>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    const batches = this.createBatches(channels, this.maxConcurrentChecks)

    for (const batch of batches) {
      const batchPromises = batch.map(channel => 
        this.validateChannel(channel.id, channel.url)
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            channelId: batch[index].id,
            isWorking: false,
            responseTime: 0,
            errorMessage: 'Erreur de validation'
          })
        }
      })

      // Pause entre les batches pour éviter la surcharge
      await this.delay(1000)
    }

    return results
  }

  /**
   * Obtient le statut d'une chaîne depuis le cache
   */
  getChannelStatus(channelId: string): ChannelStatus | null {
    const status = this.statusCache.get(channelId)
    
    if (!status) return null

    // Vérifier si le cache est expiré
    const now = Date.now()
    const lastChecked = status.lastChecked.getTime()
    
    if (now - lastChecked > this.cacheExpiry) {
      return { ...status, status: 'unknown' }
    }

    return status
  }

  /**
   * Obtient les chaînes les plus fiables
   */
  getReliableChannels(minReliability = 70): ChannelStatus[] {
    return Array.from(this.statusCache.values())
      .filter(status => status.reliability >= minReliability)
      .sort((a, b) => b.reliability - a.reliability)
  }

  /**
   * Obtient les statistiques globales
   */
  getGlobalStats(): {
    total: number
    online: number
    offline: number
    unknown: number
    averageReliability: number
  } {
    const statuses = Array.from(this.statusCache.values())
    const total = statuses.length
    const online = statuses.filter(s => s.status === 'online').length
    const offline = statuses.filter(s => s.status === 'offline').length
    const unknown = statuses.filter(s => s.status === 'unknown').length
    
    const averageReliability = total > 0 
      ? statuses.reduce((sum, s) => sum + s.reliability, 0) / total 
      : 0

    return { total, online, offline, unknown, averageReliability }
  }

  /**
   * Valide les chaînes populaires en arrière-plan
   */
  private async validatePopularChannels(): Promise<void> {
    if (this.isValidating) return

    this.isValidating = true

    try {
      // Récupérer les chaînes les plus consultées depuis le localStorage
      const popularChannels = this.getPopularChannelsFromHistory()
      
      if (popularChannels.length > 0) {
        await this.validateChannels(popularChannels)
        this.saveCacheToStorage()
      }
    } catch (error) {
      console.error('Erreur lors de la validation des chaînes populaires:', error)
    } finally {
      this.isValidating = false
    }
  }

  /**
   * Met à jour le statut d'une chaîne
   */
  private updateChannelStatus(
    channelId: string, 
    url: string, 
    updates: Partial<ChannelStatus>
  ): void {
    const existing = this.statusCache.get(channelId)
    
    const status: ChannelStatus = {
      id: channelId,
      url,
      status: 'unknown',
      lastChecked: new Date(),
      reliability: 50,
      ...existing,
      ...updates
    }

    this.statusCache.set(channelId, status)
  }

  /**
   * Calcule le score de fiabilité d'une chaîne
   */
  private calculateReliability(
    channelId: string, 
    isWorking: boolean, 
    responseTime: number
  ): number {
    const existing = this.statusCache.get(channelId)
    let reliability = existing?.reliability || 50

    if (isWorking) {
      // Augmenter la fiabilité si la chaîne fonctionne
      reliability = Math.min(100, reliability + 10)
      
      // Bonus pour les temps de réponse rapides
      if (responseTime < 2000) reliability = Math.min(100, reliability + 5)
    } else {
      // Diminuer la fiabilité si la chaîne ne fonctionne pas
      reliability = Math.max(0, reliability - 15)
    }

    return Math.round(reliability)
  }

  /**
   * Vérifie si une URL est valide
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  /**
   * Crée des batches pour le traitement parallèle
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Délai d'attente
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Récupère les chaînes populaires depuis l'historique
   */
  private getPopularChannelsFromHistory(): Array<{id: string, url: string}> {
    if (typeof window === 'undefined') return []

    try {
      const history = localStorage.getItem('streamverse_watch_history')
      if (!history) return []

      const historyData = JSON.parse(history)
      
      // Récupérer les 50 chaînes les plus regardées
      return historyData
        .sort((a: any, b: any) => b.watchCount - a.watchCount)
        .slice(0, 50)
        .map((item: any) => ({
          id: item.channelId,
          url: item.url
        }))
    } catch {
      return []
    }
  }

  /**
   * Sauvegarde le cache dans le localStorage
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = Array.from(this.statusCache.entries())
      localStorage.setItem('streamverse_channel_status_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache:', error)
    }
  }

  /**
   * Charge le cache depuis le localStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData = localStorage.getItem('streamverse_channel_status_cache')
      if (!cacheData) return

      const entries = JSON.parse(cacheData)
      entries.forEach(([id, status]: [string, any]) => {
        // Reconvertir les dates
        status.lastChecked = new Date(status.lastChecked)
        this.statusCache.set(id, status)
      })
    } catch (error) {
      console.error('Erreur lors du chargement du cache:', error)
    }
  }
}

// Instance singleton
export const channelValidator = new ChannelValidator()

// Hook React pour utiliser le validateur
export function useChannelValidator() {
  return {
    validateChannel: channelValidator.validateChannel.bind(channelValidator),
    validateChannels: channelValidator.validateChannels.bind(channelValidator),
    getChannelStatus: channelValidator.getChannelStatus.bind(channelValidator),
    getReliableChannels: channelValidator.getReliableChannels.bind(channelValidator),
    getGlobalStats: channelValidator.getGlobalStats.bind(channelValidator)
  }
}