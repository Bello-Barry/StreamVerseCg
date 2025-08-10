import { Movie, Series, TorrentParserResult, Episode } from '@/types';

// Interface pour les fichiers WebTorrent
interface WebTorrentFile {
  name: string;
  length: number;
  getBlobURL(callback: (err: Error | null, url?: string) => void): void;
}

// Interface pour les données de torrent groupées
interface GroupedMovieData {
  name: string;
  files: WebTorrentFile[];
}

interface GroupedSeriesData {
  name: string;
  episodes: Array<{
    name: string;
    season: number;
    episode: number;
    file: WebTorrentFile;
  }>;
}

interface GroupedContent {
  movies: GroupedMovieData[];
  series: GroupedSeriesData[];
}

/**
 * Parser pour les fichiers torrent utilisant WebTorrent
 */
export const parseTorrentContent = async (
  source: string,
  sourceName: string
): Promise<TorrentParserResult> => {
  console.log(`[parseTorrentContent] Parsing torrent for source: ${sourceName}`);
  
  const movies: Movie[] = [];
  const series: Series[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Vérifier que nous sommes côté client
    if (typeof window === 'undefined') {
      throw new Error('WebTorrent ne peut être utilisé que côté client');
    }

    // Import dynamique de WebTorrent
    const WebTorrent = (await import('webtorrent')).default;
    const client = new WebTorrent();

    // Promise pour attendre que le torrent soit prêt
    const torrentData = await new Promise<any>((resolve, reject) => {
      const torrent = client.add(source, {
        // Options pour accélérer le processus
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.webtorrent.dev'
        ]
      });

      // Timeout pour éviter d'attendre indéfiniment
      const timeout = setTimeout(() => {
        torrent.destroy();
        client.destroy();
        reject(new Error('Timeout lors du chargement du torrent'));
      }, 30000); // 30 secondes

      torrent.on('ready', () => {
        clearTimeout(timeout);
        console.log('Torrent ready:', torrent.name);
        resolve(torrent);
      });

      torrent.on('error', (err) => {
        clearTimeout(timeout);
        client.destroy();
        reject(err);
      });
    });

    // Analyser les fichiers du torrent
    const videoFiles: WebTorrentFile[] = torrentData.files.filter((file: any) => {
      const name = file.name.toLowerCase();
      return name.endsWith('.mp4') || 
             name.endsWith('.mkv') || 
             name.endsWith('.avi') || 
             name.endsWith('.webm') || 
             name.endsWith('.mov') ||
             name.endsWith('.m4v') ||
             name.endsWith('.wmv');
    });

    if (videoFiles.length === 0) {
      warnings.push('Aucun fichier vidéo trouvé dans ce torrent');
      client.destroy();
      return { movies, series, errors, warnings };
    }

    // Grouper les fichiers par série/film
    const groupedContent = groupVideoFiles(videoFiles, sourceName);

    // Traiter les films
    groupedContent.movies.forEach((movieData, index) => {
      const movie: Movie = {
        id: `${sourceName}-movie-${index + 1}`,
        name: movieData.name,
        infoHash: torrentData.infoHash,
        magnetURI: torrentData.magnetURI,
        poster: generatePosterUrl(movieData.name),
        category: detectCategory(movieData.name),
        playlistSource: sourceName,
        length: movieData.files[0]?.length || 0,
        files: movieData.files.map((file: any) => ({
          name: file.name,
          url: '', // L'URL sera générée à la lecture
          length: file.length
        })),
        // Stocker les métadonnées du torrent pour usage ultérieur
        torrentFiles: movieData.files
      };
      movies.push(movie);
    });

    // Traiter les séries
    groupedContent.series.forEach((seriesData, index) => {
      const episodes: Episode[] = seriesData.episodes.map((ep, epIndex) => ({
        id: `${sourceName}-series-${index + 1}-e${epIndex + 1}`,
        name: ep.name,
        season: ep.season,
        episode: ep.episode,
        infoHash: torrentData.infoHash,
        magnetURI: torrentData.magnetURI,
        torrentFile: ep.file // Référence au fichier du torrent
      }));

      const seriesItem: Series = {
        id: `${sourceName}-series-${index + 1}`,
        name: seriesData.name,
        poster: generatePosterUrl(seriesData.name),
        category: detectCategory(seriesData.name),
        playlistSource: sourceName,
        episodes
      };
      series.push(seriesItem);
    });

    // Ne pas détruire le client ici, on en aura besoin pour la lecture
    console.log(`Parsed ${movies.length} movies and ${series.length} series from torrent`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    errors.push(`Erreur lors du parsing du torrent: ${errorMessage}`);
    console.error('Error parsing torrent:', err);
  }

  return { movies, series, errors, warnings };
};

/**
 * Groupe les fichiers vidéo en films et séries
 */
function groupVideoFiles(files: WebTorrentFile[], sourceName: string): GroupedContent {
  const movies: GroupedMovieData[] = [];
  const series: GroupedSeriesData[] = [];
  const seriesMap = new Map<string, GroupedSeriesData>();

  files.forEach((file: WebTorrentFile) => {
    const fileName = file.name;
    const episodeMatch = detectEpisode(fileName);

    if (episodeMatch) {
      // C'est un épisode de série
      const seriesName = episodeMatch.seriesName;
      
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, {
          name: seriesName,
          episodes: []
        });
      }

      seriesMap.get(seriesName)!.episodes.push({
        name: `S${episodeMatch.season.toString().padStart(2, '0')}E${episodeMatch.episode.toString().padStart(2, '0')} - ${episodeMatch.episodeName || fileName}`,
        season: episodeMatch.season,
        episode: episodeMatch.episode,
        file: file
      });
    } else {
      // C'est un film
      movies.push({
        name: cleanMovieName(fileName),
        files: [file]
      });
    }
  });

  // Convertir la Map en array
  seriesMap.forEach((seriesData) => {
    // Trier les épisodes
    seriesData.episodes.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.episode - b.episode;
    });
    series.push(seriesData);
  });

  return { movies, series };
}

/**
 * Détecte si un nom de fichier correspond à un épisode de série
 */
function detectEpisode(fileName: string) {
  // Patterns communs pour les épisodes de séries
  const patterns = [
    /(.+?)[.\s]S(\d{1,2})E(\d{1,2})/i, // Series.Name.S01E01
    /(.+?)[.\s](\d{1,2})x(\d{1,2})/i,  // Series.Name.1x01
    /(.+?)[.\s]Season\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i // Series Name Season 1 Episode 1
  ];

  for (const pattern of patterns) {
    const match = fileName.match(pattern);
    if (match) {
      return {
        seriesName: cleanSeriesName(match[1]),
        season: parseInt(match[2]),
        episode: parseInt(match[3]),
        episodeName: null
      };
    }
  }

  return null;
}

/**
 * Nettoie le nom d'une série
 */
function cleanSeriesName(name: string): string {
  return name
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Nettoie le nom d'un film
 */
function cleanMovieName(fileName: string): string {
  // Retirer l'extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Nettoyer les caractères spéciaux et les infos techniques
  return nameWithoutExt
    .replace(/[._]/g, ' ')
    .replace(/\d{4}p?/g, '') // Retirer les résolutions (1080p, 720p, etc.)
    .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Détecte la catégorie basée sur le nom
 */
function detectCategory(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('action') || lowerName.includes('adventure')) return 'Action';
  if (lowerName.includes('comedy') || lowerName.includes('comic')) return 'Comédie';
  if (lowerName.includes('drama')) return 'Drame';
  if (lowerName.includes('horror') || lowerName.includes('scary')) return 'Horreur';
  if (lowerName.includes('sci-fi') || lowerName.includes('science')) return 'Science-Fiction';
  if (lowerName.includes('romance') || lowerName.includes('love')) return 'Romance';
  if (lowerName.includes('thriller')) return 'Thriller';
  if (lowerName.includes('documentary')) return 'Documentaire';
  
  return 'Divers';
}

/**
 * Génère une URL d'affiche factice (à remplacer par une vraie API)
 */
function generatePosterUrl(name: string): string {
  // Vous pourrez plus tard intégrer une API comme TMDB
  return `https://via.placeholder.com/300x450.png?text=${encodeURIComponent(name)}`;
}