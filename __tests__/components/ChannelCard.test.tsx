import { render, screen, fireEvent } from '@testing-library/react'
import { ChannelCard } from '@/components/ChannelCard'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useAppStore } from '@/stores/useAppStore'

// Mock the stores
jest.mock('@/stores/useFavoritesStore')
jest.mock('@/stores/useAppStore')

const mockUseFavoritesStore = useFavoritesStore as jest.MockedFunction<typeof useFavoritesStore>
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

describe('ChannelCard Component', () => {
  const mockChannel = {
    id: '1',
    name: 'Test Channel',
    url: 'http://test.com/stream.m3u8',
    logo: 'http://test.com/logo.png',
    group: 'Entertainment',
    country: 'FR',
    language: 'French'
  }

  const mockAddFavorite = jest.fn()
  const mockRemoveFavorite = jest.fn()
  const mockSetCurrentChannel = jest.fn()
  const mockSetCurrentPage = jest.fn()

  beforeEach(() => {
    mockUseFavoritesStore.mockReturnValue({
      favorites: [],
      addFavorite: mockAddFavorite,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn().mockReturnValue(false),
    })

    mockUseAppStore.mockReturnValue({
      currentPage: 'home',
      setCurrentPage: mockSetCurrentPage,
      sidebarOpen: false,
      toggleSidebar: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      channels: [],
      setChannels: jest.fn(),
      filteredChannels: [],
      setFilteredChannels: jest.fn(),
      selectedCategory: 'all',
      setSelectedCategory: jest.fn(),
      categories: [],
      setCategories: jest.fn(),
      currentChannel: null,
      setCurrentChannel: mockSetCurrentChannel,
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders channel information correctly', () => {
    render(<ChannelCard channel={mockChannel} />)
    
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
    expect(screen.getByText('Entertainment')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://test.com/logo.png')
  })

  it('handles play button click', () => {
    render(<ChannelCard channel={mockChannel} />)
    
    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)
    
    expect(mockSetCurrentChannel).toHaveBeenCalledWith(mockChannel)
    expect(mockSetCurrentPage).toHaveBeenCalledWith('player')
  })

  it('handles favorite button click when not favorited', () => {
    render(<ChannelCard channel={mockChannel} />)
    
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(favoriteButton)
    
    expect(mockAddFavorite).toHaveBeenCalledWith(mockChannel)
  })

  it('handles favorite button click when already favorited', () => {
    mockUseFavoritesStore.mockReturnValue({
      favorites: [mockChannel],
      addFavorite: mockAddFavorite,
      removeFavorite: mockRemoveFavorite,
      isFavorite: jest.fn().mockReturnValue(true),
    })

    render(<ChannelCard channel={mockChannel} />)
    
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    fireEvent.click(favoriteButton)
    
    expect(mockRemoveFavorite).toHaveBeenCalledWith(mockChannel.id)
  })

  it('displays fallback image when logo fails to load', () => {
    render(<ChannelCard channel={{ ...mockChannel, logo: '' }} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'))
  })
})

