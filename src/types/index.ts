// Enums
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
  TORRENTS = 'torrents'
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
  group?: string;
  playlistSource: string;
  language?: string;
  country?: string;
  category?: string;
}

// Interfaces pour les torrents - types de base
export interface Movie {
  id: string;
  name: string;
  infoHash: string;
  magnetURI: string;
  poster?: string;
  category: string;
  playlistSource: string;
  length: number;
  files: MovieFile[];
  torrentFiles?: any[];
}

export interface MovieFile {
  name: string;
  length: number;
}

export interface Series {
  id: string;
  name: string;
  poster?: string;
  category: string;
  playlistSource: string;
  quality?: string;
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
  torrentFile?: any;
  duration?: number;
  quality?: string;
}

// Interface pour une playlist
export interface Playlist {
  id: string;
  name: string;
  type: PlaylistType;
  status: PlaylistStatus;
  lastUpdate: Date;
  channelCount: number;
  isRemovable: boolean;
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
  torrents: Map<string, (Movie | Series)[]>;
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
  type: PlaylistType;
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

// Hook spécifique pour les torrents
export interface UseTorrentPlayerReturn {
  playTorrent: (movie: Movie) => Promise<void>;
  playEpisode: (episode: Episode, seriesName: string) => Promise<void>;
  stopTorrent: () => void;
  cleanup: () => void;
  isLoading: boolean;
  error: string | null;
  downloadProgress: number;
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

// Nouveaux props pour les composants torrents
export interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  isLoading?: boolean;
  showCategory?: boolean;
}

export interface SeriesCardProps {
  series: Series;
  onShowEpisodes: (series: Series) => void;
  showCategory?: boolean;
}

export interface EpisodesModalProps {
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayEpisode: (episode: Episode, seriesName: string) => void;
}

// Interfaces pour les métadonnées de torrent (utilisées par WebTorrent)
export interface TorrentFileMetadata {
  name: string;
  length: number;
  offset: number;
  getBlobURL: (callback: (err: Error | null, url?: string) => void) => void;
  getBuffer: (callback: (err: Error | null, buffer?: Buffer) => void) => void;
}

export interface TorrentMetadata {
  name: string;
  infoHash: string;
  magnetURI: string;
  files: TorrentFileMetadata[];
  length: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  ready: boolean;
  destroy: () => void;
  on: (event: string, callback: (data?: any) => void) => void;
}

// Types utilitaires pour les torrents
export type TorrentContent = Movie | Series;
export type VideoFileExtensions = '.mp4' | '.mkv' | '.avi' | '.webm' | '.mov' | '.m4v' | '.wmv';
export type TorrentEventType = 'ready' | 'download' | 'upload' | 'error' | 'done' | 'warning';

// Interface pour les statistiques de torrent
export interface TorrentStats {
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  progress: number;
  timeRemaining: number;
  numPeers: number;
  ratio: number;
}

// Crée un type pour les films avec des informations de playlist
export type MovieInfo = Movie & {
  type: 'movie';
  playlistName: string;
  duration?: string;
  quality?: string; // Correction ici: un film peut aussi avoir une qualité
};

// Crée un type pour les séries avec des informations de playlist
export type SeriesInfo = Series & {
  type: 'series';
  playlistName: string;
  duration?: string; // Correction ici: une série peut aussi avoir une durée totale
};

// Type unifié pour le composant TorrentGrid, utilisant des types distincts
export type TorrentInfo = MovieInfo | SeriesInfo;

// Interface pour les préférences de torrent
export interface TorrentPreferences {
  maxConnections: number;
  downloadPath: string;
  enableDHT: boolean;
  enableWebSeeds: boolean;
  blocklist: string[];
  announceList: string[];
}
