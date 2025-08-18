'use client';

/**
 * Service pour la gestion des clients WebTorrent.
 * S'assure qu'un seul client WebTorrent est utilisé pour toute l'application.
 */

import { Movie, Series, TorrentParserResult, Episode } from '@/types';
import { Torrent, TorrentFile as WebtorrentFile, Instance } from 'webtorrent';
import { Buffer } from 'buffer';

// Type pour le client WebTorrent.
// Utilisation de `Instance` du module `webtorrent` pour un typage précis.
type WebTorrentClient = Instance;

/**
 * Interface pour les métadonnées de torrent
 */
export interface TorrentMetadata {
  infoHash: string;
  name: string;
  files: WebtorrentFile[];
  magnetURI?: string;
  size: number;
}

// Instance globale du client WebTorrent pour s'assurer qu'il est un singleton
let globalWebTorrentClient: WebTorrentClient | null = null;
let currentTorrentInstance: Torrent | null = null;

class TorrentService {
  /**
   * Initialise le client WebTorrent global
   */
  private async getWebTorrentClient(): Promise<WebTorrentClient> {
    if (globalWebTorrentClient) {
      return globalWebTorrentClient;
    }

    if (typeof window === 'undefined') {
      throw new Error('WebTorrent ne peut être utilisé que côté client');
    }

    try {
      const WebTorrent = (await import('webtorrent')).default;
      globalWebTorrentClient = new WebTorrent({
        maxConns: 100,
        dht: true,
        webSeeds: true,
      });

      console.log('WebTorrent client initialized.');
      return globalWebTorrentClient;
    } catch (error) {
      console.error('Impossible de charger WebTorrent:', error);
      throw new Error('Impossible de charger WebTorrent: ' + (error as Error).message);
    }
  }

  /**
   * Valide un lien magnet
   */
  public validateMagnetURI(magnetURI: string): boolean {
    const magnetRegex = /^magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40}/;
    return magnetRegex.test(magnetURI);
  }

  /**
   * Extrait le hash d'un lien magnet
   */
  public extractHashFromMagnet(magnetURI: string): string | null {
    const match = magnetURI.match(/xt=urn:btih:([a-fA-F0-9]{32,40})/);
    return match ? match[1] : null;
  }

  /**
   * Extrait le nom d'un lien magnet
   */
  public extractNameFromMagnet(magnetURI: string): string | null {
    const match = magnetURI.match(/dn=([^&]+)/);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  }

  /**
   * Parse un torrent (fichier ou magnet) de manière améliorée
   */
  public async parseTorrentContent(
    source: string | File,
    sourceName: string
  ): Promise<TorrentParserResult> {
    console.log(`[parseTorrentContent] Parsing torrent for source: ${sourceName}`);

    const movies: Movie[] = [];
    const series: Series[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const client = await this.getWebTorrentClient();
      
      // Assurer qu'il n'y a qu'un seul torrent à la fois
      if (currentTorrentInstance) {
        currentTorrentInstance.destroy();
        currentTorrentInstance = null;
      }
      
      let torrentToAdd: string | File | Buffer;
      
      if (source instanceof File) {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
          reader.readAsArrayBuffer(source);
        });
        // Conversion de l'ArrayBuffer en Buffer pour le client webtorrent
        torrentToAdd = Buffer.from(arrayBuffer);
      } else if (typeof source === 'string') {
        if (!this.validateMagnetURI(source)) {
          throw new Error('Lien magnet invalide');
        }
        torrentToAdd = source;
      } else {
        throw new Error('Type de source non supporté');
      }

      // Ajouter le torrent avec timeout
      const torrentData = await new Promise<Torrent>((resolve, reject) => {
        const torrent = client.add(torrentToAdd, {
          announce: [
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.webtorrent.dev',
            'wss://tracker.files.fm:7073/announce',
          ],
        });
        currentTorrentInstance = torrent;

        const timeout = setTimeout(() => {
          torrent.destroy();
          reject(new Error('Timeout lors du chargement du torrent (30s)'));
        }, 30000);

        torrent.on('ready', () => {
          clearTimeout(timeout);
          console.log('Torrent prêt:', torrent.name, 'Files:', torrent.files.length);
          resolve(torrent);
        });
        
        // Caster en 'any' car la déclaration de type de webtorrent ne supporte pas 'error'
        (torrent as any).on('error', (err: Error) => {
          clearTimeout(timeout);
          // Important: détruire le torrent en cas d'erreur
          torrent.destroy();
          reject(new Error(`Erreur WebTorrent: ${err.message}`));
        });
      });

      // Filtrer les fichiers vidéo
      const videoFiles = torrentData.files.filter((file: WebtorrentFile) => {
        const name = file.name.toLowerCase();
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.wmv', '.flv', '.m2ts'];
        return videoExtensions.some(ext => name.endsWith(ext));
      });

      if (videoFiles.length === 0) {
        warnings.push('Aucun fichier vidéo trouvé dans ce torrent');
        return { movies, series, errors, warnings };
      }

      console.log(`Trouvé ${videoFiles.length} fichiers vidéo`);

      // Grouper les fichiers par contenu
      const groupedContent = this.groupVideoFiles(videoFiles, sourceName, torrentData);

      // Traiter les films
      groupedContent.movies.forEach((movieData, index) => {
        const movie: Movie = {
          id: `${sourceName}-movie-${index + 1}`,
          name: movieData.name,
          infoHash: torrentData.infoHash,
          magnetURI: torrentData.magnetURI,
          poster: this.generatePosterUrl(movieData.name),
          category: this.detectCategory(movieData.name),
          playlistSource: sourceName,
          length: movieData.files[0]?.length || 0,
          files: movieData.files.map((file: WebtorrentFile) => ({
            name: file.name,
            url: '', // Sera généré à la lecture
            length: file.length,
          })),
          torrentFiles: movieData.files,
          // Métadonnées supplémentaires
          quality: this.detectQuality(movieData.name),
          // Convertit `null` en `undefined` pour être compatible avec le type `year?: number`
          year: this.detectYear(movieData.name) ?? undefined,
        };
        movies.push(movie);
      });

      // Traiter les séries
      groupedContent.series.forEach((seriesData, index) => {
        const episodes: Episode[] = seriesData.episodes.map((ep: any, epIndex: number) => ({
          id: `${sourceName}-series-${index + 1}-e${epIndex + 1}`,
          name: ep.name,
          season: ep.season,
          episode: ep.episode,
          infoHash: torrentData.infoHash,
          magnetURI: torrentData.magnetURI,
          torrentFile: ep.file,
          quality: this.detectQuality(ep.file.name),
          duration: this.estimateDuration(ep.file.length),
        }));

        const seriesItem: Series = {
          id: `${sourceName}-series-${index + 1}`,
          name: seriesData.name,
          poster: this.generatePosterUrl(seriesData.name),
          category: this.detectCategory(seriesData.name),
          playlistSource: sourceName,
          episodes,
          // Métadonnées supplémentaires
          totalSeasons: Math.max(...episodes.map((ep) => ep.season)),
          // Convertit `null` en `undefined` pour être compatible avec le type `year?: number`
          year: this.detectYear(seriesData.name) ?? undefined,
        };
        series.push(seriesItem);
      });

      console.log(`Analysé: ${movies.length} films et ${series.length} séries`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      errors.push(`Erreur lors du parsing du torrent: ${errorMessage}`);
      console.error('Erreur parsing torrent:', err);
    }

    return { movies, series, errors, warnings };
  }
  
  /**
   * Détruit le client WebTorrent global et libère les ressources
   */
  public destroyClient(): void {
    if (globalWebTorrentClient) {
      try {
        globalWebTorrentClient.destroy();
        globalWebTorrentClient = null;
        currentTorrentInstance = null;
        console.log('WebTorrent client destroyed.');
      } catch (error) {
        console.error('Erreur lors du nettoyage de WebTorrent:', error);
      }
    }
  }

  /**
   * Groupe les fichiers vidéo de manière améliorée
   */
  private groupVideoFiles(files: WebtorrentFile[], sourceName: string, torrentData: any) {
    const movies: any[] = [];
    const series: any[] = [];
    const seriesMap = new Map<string, any>();

    files.forEach((file: WebtorrentFile) => {
      const fileName = file.name;
      const episodeMatch = this.detectEpisode(fileName);

      if (episodeMatch) {
        // C'est un épisode de série
        const seriesName = episodeMatch.seriesName;
        
        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, {
            name: seriesName,
            episodes: [],
          });
        }

        seriesMap.get(seriesName)!.episodes.push({
          name: this.formatEpisodeName(episodeMatch),
          season: episodeMatch.season,
          episode: episodeMatch.episode,
          file: file,
        });
      } else {
        // C'est un film
        movies.push({
          name: this.cleanMovieName(fileName),
          files: [file],
        });
      }
    });

    // Convertir la Map en array et trier
    seriesMap.forEach((seriesData) => {
      seriesData.episodes.sort((a: any, b: any) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.episode - b.episode;
      });
      series.push(seriesData);
    });

    return { movies, series };
  }

  /**
   * Détection améliorée des épisodes de série
   */
  private detectEpisode(fileName: string) {
    const patterns = [
      // Patterns standards
      /(.+?)[.\s]S(\d{1,2})E(\d{1,2})/i,
      /(.+?)[.\s](\d{1,2})x(\d{1,2})/i,
      /(.+?)[.\s]Season\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i,
      // Patterns français
      /(.+?)[.\s]Saison\s*(\d{1,2})[.\s]Episode\s*(\d{1,2})/i,
      /(.+?)[.\s]S(\d{1,2})\s*EP?(\d{1,2})/i,
      // Patterns avec tirets
      /(.+?)\s*-\s*S(\d{1,2})E(\d{1,2})/i,
      // Patterns avec parenthèses
      /(.+?)\s*\(S(\d{1,2})E(\d{1,2})\)/i,
    ];

    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        return {
          seriesName: this.cleanSeriesName(match[1]),
          season: parseInt(match[2]),
          episode: parseInt(match[3]),
          episodeName: null,
        };
      }
    }

    return null;
  }

  /**
   * Nettoyage amélioré du nom de série
   */
  private cleanSeriesName(name: string): string {
    return name
      .replace(/[._\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC|1080p|720p|480p)\b/gi, '')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Nettoyage amélioré du nom de film
   */
  private cleanMovieName(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    return nameWithoutExt
      .replace(/[._\-]/g, ' ')
      .replace(/\d{4}p?/g, '')
      .replace(/\b(HDTV|BluRay|BRRip|DVDRip|WEBRip|x264|x265|HEVC|PROPER|REPACK|EXTENDED|UNRATED)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Détection améliorée de la catégorie
   */
  private detectCategory(name: string): string {
    const lowerName = name.toLowerCase();
    
    const categories = {
      'Action': ['action', 'adventure', 'fight', 'war', 'battle'],
      'Comédie': ['comedy', 'comic', 'funny', 'humor', 'laugh'],
      'Drame': ['drama', 'dramatic', 'emotional'],
      'Horreur': ['horror', 'scary', 'terror', 'fear', 'nightmare'],
      'Science-Fiction': ['sci-fi', 'science', 'fiction', 'space', 'alien', 'future'],
      'Romance': ['romance', 'love', 'romantic', 'heart'],
      'Thriller': ['thriller', 'suspense', 'mystery'],
      'Documentaire': ['documentary', 'docu', 'real', 'true'],
      'Animation': ['animation', 'animated', 'cartoon', 'anime'],
      'Crime': ['crime', 'criminal', 'police', 'detective', 'murder'],
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'Divers';
  }

  /**
   * Détecte la qualité vidéo
   */
  private detectQuality(fileName: string): string {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('4k') || lowerName.includes('2160p')) return '4K';
    if (lowerName.includes('1080p')) return '1080p';
    if (lowerName.includes('720p')) return '720p';
    if (lowerName.includes('480p')) return '480p';
    if (lowerName.includes('360p')) return '360p';
    
    return 'SD';
  }

  /**
   * Détecte l'année de sortie
   */
  private detectYear(name: string): number | null {
    const yearMatch = name.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  /**
   * Estime la durée basée sur la taille du fichier
   */
  private estimateDuration(fileSize: number): number {
    // Estimation approximative: 1GB ≈ 45 minutes pour une qualité standard
    const estimatedMinutes = Math.round((fileSize / (1024 * 1024 * 1024)) * 45);
    return Math.max(estimatedMinutes, 20); // Minimum 20 minutes
  }

  /**
   * Formate le nom d'un épisode
   */
  private formatEpisodeName(episodeMatch: any): string {
    const season = episodeMatch.season.toString().padStart(2, '0');
    const episode = episodeMatch.episode.toString().padStart(2, '0');
    return `S${season}E${episode}`;
  }

  /**
   * Génère une URL d'affiche améliorée
   */
  private generatePosterUrl(name: string): string {
    // TODO: Intégrer une vraie API comme TMDB
    const encodedName = encodeURIComponent(name);
    return `https://via.placeholder.com/300x450/1a1a1a/ffffff?text=${encodedName}`;
  }
}

// Instance singleton
export const torrentService = new TorrentService();

// Fonction helper pour correspondre à l'import du store
export const parseTorrentContentImproved = (
  source: string | File,
  sourceName: string
): Promise<TorrentParserResult> => {
  return torrentService.parseTorrentContent(source, sourceName);
};

// Export par défaut de l'instance
export default torrentService;