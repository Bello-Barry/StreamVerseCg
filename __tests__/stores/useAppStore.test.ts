import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@/stores/useAppStore'

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      currentPage: 'home',
      sidebarOpen: false,
      searchQuery: '',
      channels: [],
      filteredChannels: [],
      selectedCategory: 'all',
      categories: [],
      currentChannel: null,
      isLoading: false,
      error: null,
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAppStore())
    
    expect(result.current.currentPage).toBe('home')
    expect(result.current.sidebarOpen).toBe(false)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.channels).toEqual([])
    expect(result.current.filteredChannels).toEqual([])
    expect(result.current.selectedCategory).toBe('all')
    expect(result.current.categories).toEqual([])
    expect(result.current.currentChannel).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('updates current page', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setCurrentPage('search')
    })
    
    expect(result.current.currentPage).toBe('search')
  })

  it('toggles sidebar', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.toggleSidebar()
    })
    
    expect(result.current.sidebarOpen).toBe(true)
    
    act(() => {
      result.current.toggleSidebar()
    })
    
    expect(result.current.sidebarOpen).toBe(false)
  })

  it('updates search query', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setSearchQuery('test query')
    })
    
    expect(result.current.searchQuery).toBe('test query')
  })

  it('updates channels and categories', () => {
    const { result } = renderHook(() => useAppStore())
    
    const mockChannels = [
      {
        id: '1',
        name: 'Channel 1',
        url: 'http://test.com/1.m3u8',
        logo: '',
        group: 'Entertainment',
        country: 'FR',
        language: 'French'
      },
      {
        id: '2',
        name: 'Channel 2',
        url: 'http://test.com/2.m3u8',
        logo: '',
        group: 'News',
        country: 'FR',
        language: 'French'
      }
    ]
    
    act(() => {
      result.current.setChannels(mockChannels)
    })
    
    expect(result.current.channels).toEqual(mockChannels)
  })

  it('updates selected category', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setSelectedCategory('Entertainment')
    })
    
    expect(result.current.selectedCategory).toBe('Entertainment')
  })

  it('updates current channel', () => {
    const { result } = renderHook(() => useAppStore())
    
    const mockChannel = {
      id: '1',
      name: 'Test Channel',
      url: 'http://test.com/stream.m3u8',
      logo: '',
      group: 'Entertainment',
      country: 'FR',
      language: 'French'
    }
    
    act(() => {
      result.current.setCurrentChannel(mockChannel)
    })
    
    expect(result.current.currentChannel).toEqual(mockChannel)
  })

  it('updates loading state', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setIsLoading(true)
    })
    
    expect(result.current.isLoading).toBe(true)
  })

  it('updates error state', () => {
    const { result } = renderHook(() => useAppStore())
    
    act(() => {
      result.current.setError('Test error')
    })
    
    expect(result.current.error).toBe('Test error')
  })
})

