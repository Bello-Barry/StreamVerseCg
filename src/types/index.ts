// Enums
export enum ViewType {
  HOME = 'home',
  CATEGORIES = 'categories',
  FAVORITES = 'favorites',
  HISTORY = 'history',
  SEARCH = 'search',
  PLAYER = 'player',
  PLAYLISTS = 'playlists',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  THEMES = 'themes'
}

export enum PlaylistStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  LOADING = 'loading'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export enum Quality {
  AUTO = 'auto',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  mono: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  glassmorphism: boolean;
  gradients: boolean;
  borderRadius: number;
}

export type CustomThemeSettings = {
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    card?: string;
    border?: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  glassmorphism: boolean;
  gradients: boolean;
  borderRadius: number;
};

// Types généraux
export interface Channel {
  id: string;
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  group?: string;
  playlistSource: string;
  language?: string;
  country?: string;
  category?: string; // ← celui-là manque ailleurs
}

export interface Playlist {
  id: string;
  name: string;
  url?: string;
  content?: string;
  type: 'url' | 'file' | 'xtream';
  status: PlaylistStatus;
  lastUpdate?: Date;
  channelCount?: number;
  description?: string;
  isRemovable?: boolean;
  xtreamConfig?: {
    server: string;
    username: string;
    password: string;
  };
}

export interface Category {
  name: string;
  channels: Channel[];
  count: number;
  icon?: string;
}

export interface WatchEntry {
  id: string;
  channel: Channel;
  timestamp: Date;
  duration: number;
  completed: boolean;
}

export interface WatchStats {
  totalWatchTime: number;
  favoriteCategories: string[];
  mostWatchedChannels: Channel[];
  watchingStreak: number;
}

export interface UserPreferences {
  theme: Theme;
  language: string;
  autoplay: boolean;
  quality: Quality;
  volume: number;
}

export interface SearchFilters {
  category?: string;
  language?: string;
  country?: string;
  quality?: string;
}

// App State
export interface AppState {
  currentView: ViewType;
  currentChannel: Channel | null;
  searchQuery: string;
  selectedCategory: string | null;
  isPlaying: boolean;
  userPreferences: UserPreferences;
}

// Stores
export interface PlaylistManagerState {
  playlists: Playlist[];
  channels: Channel[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export interface FavoritesState {
  favorites: string[];
  toggleFavorite: (channelId: string) => void;
  addFavorite: (channelId: string) => void;
  removeFavorite: (channelId: string) => void;
  isFavorite: (channelId: string) => boolean;
}

export interface WatchHistoryState {
  history: WatchEntry[];
  addToHistory: (channel: Channel, duration: number) => void;
  clearHistory: () => void;
  getWatchStats: () => WatchStats;
}

// Formulaires
export interface PlaylistFormData {
  name: string;
  url?: string;
  type: 'url' | 'file' | 'xtream';
  description?: string;
  xtreamServer?: string;
  xtreamUsername?: string;
  xtreamPassword?: string;
}

export interface SearchFormData {
  query: string;
  filters: SearchFilters;
}

// Événements
export interface PlayerEvent {
  type: 'play' | 'pause' | 'stop' | 'error' | 'ended';
  channel: Channel;
  timestamp: Date;
  data?: unknown;
}

export interface PlaylistEvent {
  type: 'added' | 'updated' | 'removed' | 'error';
  playlist: Playlist;
  timestamp: Date;
  error?: string;
}

// API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface M3UParseResult {
  channels: Channel[];
  errors: string[];
  warnings: string[];
}

// Hooks
export interface UseM3UParserReturn {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  parseM3U: (content: string, source: string) => Promise<M3UParseResult>;
  reload: () => void;
}

export interface UsePlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (channel: Channel) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

// Composants UI
// ... (autres exports)

export interface ChannelCardProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  isFavorite: boolean;
  showCategory?: boolean;
  showReliabilityIndicator?: boolean;
  compact?: boolean;
}



export interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (category: string) => void;
  selectedCategory?: string;
}

export interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  currentView: string;
  onViewChange: (view: string) => void;
}

export interface PlayerProps {
  channel: Channel | null;
  onClose: () => void;
  autoplay?: boolean;
}