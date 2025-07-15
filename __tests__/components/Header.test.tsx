import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/components/Header'
import { useAppStore } from '@/stores/useAppStore'

// Mock the store
jest.mock('@/stores/useAppStore')

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

describe('Header Component', () => {
  const mockSetCurrentPage = jest.fn()
  const mockToggleSidebar = jest.fn()

  beforeEach(() => {
    mockUseAppStore.mockReturnValue({
      currentPage: 'home',
      setCurrentPage: mockSetCurrentPage,
      sidebarOpen: false,
      toggleSidebar: mockToggleSidebar,
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
      setCurrentChannel: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the header with logo and navigation', () => {
    render(<Header />)
    
    expect(screen.getByText('StreamVerse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('toggles sidebar when menu button is clicked', () => {
    render(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('navigates to different pages when navigation items are clicked', () => {
    render(<Header />)
    
    // Test navigation to home
    const homeButton = screen.getByText('Accueil')
    fireEvent.click(homeButton)
    expect(mockSetCurrentPage).toHaveBeenCalledWith('home')
  })

  it('displays search input when on search page', () => {
    mockUseAppStore.mockReturnValue({
      currentPage: 'search',
      setCurrentPage: mockSetCurrentPage,
      sidebarOpen: false,
      toggleSidebar: mockToggleSidebar,
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
      setCurrentChannel: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
  })
})

