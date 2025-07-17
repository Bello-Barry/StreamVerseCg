'use client'

import React, { useState, useMemo } from 'react'
import { ArrowLeft, Filter, SortAsc, SortDesc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CategoryGrid from '@/components/CategoryGrid'
import ChannelCard from '@/components/ChannelCard'
import { usePlaylistStore } from '@/stores/usePlaylistStore'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAppStore } from '@/stores/useAppStore'
import type { Channel } from '@/types'

const CategoriesPage: React.FC = () => {
  const { categories, getChannelsByCategory, loading } = usePlaylistStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()
  const { addToHistory } = useWatchHistoryStore()
  const { selectedCategory, setCurrentChannel, setSelectedCategory } = useAppStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredCategories = useMemo(() => {
    let filtered = categories
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return [...filtered].sort((a, b) => {
      const comparison = sortBy === 'name' 
        ? a.name.localeCompare(b.name)
        : a.count - b.count
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [categories, searchQuery, sortBy, sortOrder])

  const selectedCategoryChannels = useMemo(() => {
    if (!selectedCategory) return []
    return getChannelsByCategory(selectedCategory)
  }, [selectedCategory, getChannelsByCategory])

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName)
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
  }

  const handlePlayChannel = (channel: Channel) => {
    setCurrentChannel(channel)
    addToHistory(channel, 0)
  }

  const handleToggleFavorite = (channel: Channel) => {
    toggleFavorite(channel.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des catégories...</p>
        </div>
      </div>
    )
  }

  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCategories}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour aux catégories</span>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">{selectedCategory}</h1>
              <p className="text-muted-foreground">
                {selectedCategoryChannels.length} chaîne{selectedCategoryChannels.length > 1 ? 's' : ''} disponible{selectedCategoryChannels.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {selectedCategoryChannels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {selectedCategoryChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onPlay={handlePlayChannel}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(channel.id)}
                showCategory={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune chaîne trouvée dans cette catégorie.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={sortBy} onValueChange={(value: 'name' | 'count') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Par nombre</SelectItem>
              <SelectItem value="name">Par nom</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center space-x-1"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <CategoryGrid
        categories={filteredCategories}
        onCategorySelect={handleCategorySelect}
      />

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune catégorie trouvée pour &quot;{searchQuery}&quot;.
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchQuery('')}
            className="mt-2"
          >
            Effacer la recherche
          </Button>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage