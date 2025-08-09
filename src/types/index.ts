// Enums : Utilisation d'énums pour des valeurs strictes et lisibles.
export enum ViewType {
  HOME = 'home',
  CATEGORIES = 'categories',
  FAVORITES = 'favorites',
  HISTORY = 'history',
  SEARCH = 'search',
  PLAYER = 'player',
  PLAYLISTS = 'playlists',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  THEMES = 'themes', 
  TORRENTS='torrents'
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

// Ajout du type 'torrent' pour la gestion future des films/séries
export enum PlaylistType {
  URL = 'url',
  FILE = 'file',
  XTREAM = 'xtream',
  TORRENT = 'torrent'
}

// Interfaces de données principales
export interface XtreamConfig {
  server: string;
  username: string;
  password: string;
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  group?: string; // Catégorie du groupe
  playlistSource: string;
  language?: string;
  country?: string;
  category?: string; // TODO: Vérifier la redondance avec 'group' et choisir un nom définitif.
}

export interface Movie {
  id: string;
  name: string;
  infoHash: string;
  magnetURI: string;
  poster?: string;
  category?: string;
  playlistSource: string;
  length?: number; // Durée en secondes
  files?: Array<{ name: string; url: string; length: number }>;
}

export interface Series {
  id: string;
  name: string;
  poster?: string;
  category?: string;
  playlistSource: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  name: string;
  season: number;
  episode: number;
  infoHash: string;
  magnetURI: string;
  length?: number;
}

// Interface pour une playlist. J'ai rendu plusieurs propriétés obligatoires
// pour une meilleure robustesse du typage et pour correspondre à la logique actuelle.
export interface Playlist {
  id: string;
  name: string;
  type: PlaylistType; // Utilisation de l'enum pour la cohérence
  status: PlaylistStatus;
  lastUpdate: Date; // Rendu obligatoire car toujours créé avec new Date()
  channelCount: number; // Rendu obligatoire pour éviter les `undefined`
  isRemovable: boolean; // Rendu obligatoire pour la logique de suppression
  url?: string;
  content?: string;
  description?: string;
  xtreamConfig?: XtreamConfig;
  error?: string;
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

// Interfaces du Store
export interface PlaylistManagerState {
  playlists: Playlist[];
  channels: Channel[];
  categories: Category[];
  torrents: Map<string, (Movie | Series)[]>; // Ajout de la map pour les torrents
  loading: boolean;
  error: string | null;
}

export interface AppState {
  currentView: ViewType;
  currentChannel: Channel | null;
  searchQuery: string;
  selectedCategory: string | null;
  isPlaying: boolean;
  userPreferences: UserPreferences;
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

// Interfaces spécifiques aux parsers
export interface M3UParseResult {
  channels: Channel[];
  errors: string[];
  warnings: string[];
}

export interface TorrentParserResult {
  movies: Movie[];
  series: Series[];
  errors: string[];
  warnings: string[];
}

// Formulaires
export interface PlaylistFormData {
  name: string;
  url?: string;
  type: PlaylistType; // Utilisation de l'enum
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
export interface ChannelCardProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  isFavorite: boolean;
  showCategory?: boolean;
  showReliabilityIndicator?: boolean;
  compact?: boolean;
  tabIndex?: number;
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
