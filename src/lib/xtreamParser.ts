import { Channel, M3UParseResult } from '@/types';

export interface XtreamConfig {
  server: string;
  username: string;
  password: string;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export class XtreamParser {
  private config: XtreamConfig;
  private baseUrl: string;

  constructor(config: XtreamConfig) {
    this.config = config;
    this.baseUrl = this.config.server.replace(/\/$/, ''); // Supprimer le slash final
  }

  /**
   * Parse une URL Xtream Codes pour extraire la configuration
   */
  static parseXtreamUrl(url: string): XtreamConfig | null {
    try {
      // Format: http://server:port/get.php?username=xxx&password=xxx&type=m3u_plus&output=ts
      // ou: http://server:port/username/password/
      
      const urlObj = new URL(url);
      
      // Méthode 1: URL avec paramètres
      const username = urlObj.searchParams.get('username');
      const password = urlObj.searchParams.get('password');
      
      if (username && password) {
        return {
          server: `${urlObj.protocol}//${urlObj.host}`,
          username,
          password
        };
      }
      
      // Méthode 2: URL avec username/password dans le path
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length >= 2) {
        return {
          server: `${urlObj.protocol}//${urlObj.host}`,
          username: pathParts[0],
          password: pathParts[1]
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors du parsing de l\'URL Xtream:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'URL est un lien Xtream Codes
   */
  static isXtreamUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Vérifier les paramètres typiques d'Xtream
      const hasXtreamParams = urlObj.searchParams.has('username') && 
                             urlObj.searchParams.has('password');
      
      // Vérifier le format du path
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      const hasXtreamPath = pathParts.length >= 2 && 
                           !pathParts.some(part => part.includes('.'));
      
      // Vérifier les endpoints typiques
      const hasXtreamEndpoint = urlObj.pathname.includes('get.php') ||
                               urlObj.pathname.includes('player_api.php');
      
      return hasXtreamParams || hasXtreamPath || hasXtreamEndpoint;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les catégories depuis l'API Xtream
   */
  async getCategories(): Promise<XtreamCategory[]> {
    try {
      const url = `${this.baseUrl}/player_api.php?username=${this.config.username}&password=${this.config.password}&action=get_live_categories`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const categories = await response.json();
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  }

  /**
   * Récupère les chaînes depuis l'API Xtream
   */
  async getChannels(categoryId?: string): Promise<XtreamChannel[]> {
    try {
      let url = `${this.baseUrl}/player_api.php?username=${this.config.username}&password=${this.config.password}&action=get_live_streams`;
      
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const channels = await response.json();
      return Array.isArray(channels) ? channels : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des chaînes:', error);
      return [];
    }
  }

  /**
   * Convertit les données Xtream en format Channel
   */
  private convertXtreamToChannels(
    xtreamChannels: XtreamChannel[], 
    categories: XtreamCategory[], 
    playlistSource: string
  ): Channel[] {
    const categoryMap = new Map(
      categories.map(cat => [cat.category_id, cat.category_name])
    );

    return xtreamChannels.map(xtreamChannel => ({
      id: `${playlistSource}-${xtreamChannel.stream_id}`,
      name: xtreamChannel.name,
      url: `${this.baseUrl}/live/${this.config.username}/${this.config.password}/${xtreamChannel.stream_id}.ts`,
      tvgId: xtreamChannel.epg_channel_id || undefined,
      tvgName: xtreamChannel.name,
      tvgLogo: xtreamChannel.stream_icon || undefined,
      group: categoryMap.get(xtreamChannel.category_id) || 'Undefined',
      playlistSource,
      language: undefined, // Xtream ne fournit pas toujours cette info
      country: undefined   // Xtream ne fournit pas toujours cette info
    }));
  }

  /**
   * Parse le contenu Xtream et retourne les chaînes
   */
  async parseXtreamContent(playlistSource: string): Promise<M3UParseResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Récupérer les catégories et chaînes
      const [categories, xtreamChannels] = await Promise.all([
        this.getCategories(),
        this.getChannels()
      ]);

      if (xtreamChannels.length === 0) {
        warnings.push('Aucune chaîne trouvée dans cette playlist Xtream');
      }

      const channels = this.convertXtreamToChannels(xtreamChannels, categories, playlistSource);

      return {
        channels,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`Erreur lors du parsing Xtream: ${errorMessage}`);
      
      return {
        channels: [],
        errors,
        warnings
      };
    }
  }

  /**
   * Génère une URL M3U à partir de la configuration Xtream
   */
  generateM3UUrl(): string {
    return `${this.baseUrl}/get.php?username=${this.config.username}&password=${this.config.password}&type=m3u_plus&output=ts`;
  }

  /**
   * Teste la connexion Xtream
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/player_api.php?username=${this.config.username}&password=${this.config.password}&action=get_live_categories`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Fonction utilitaire pour parser le contenu Xtream
 */
export async function parseXtreamContent(
  config: XtreamConfig, 
  playlistSource: string
): Promise<M3UParseResult> {
  const parser = new XtreamParser(config);
  return parser.parseXtreamContent(playlistSource);
}

/**
 * Fonction utilitaire pour tester une configuration Xtream
 */
export async function testXtreamConnection(config: XtreamConfig): Promise<boolean> {
  const parser = new XtreamParser(config);
  return parser.testConnection();
}

