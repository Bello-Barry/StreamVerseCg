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
      console.log('Parsing Xtream URL:', url);
      
      const urlObj = new URL(url);
      
      // Méthode 1: URL avec paramètres (votre cas)
      const username = urlObj.searchParams.get('username');
      const password = urlObj.searchParams.get('password');
      
      if (username && password) {
        const server = `${urlObj.protocol}//${urlObj.host}`;
        console.log('Configuration extraite:', { server, username, password: '***' });
        return {
          server,
          username,
          password
        };
      }
      
      // Méthode 2: URL avec username/password dans le path
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length >= 2) {
        const server = `${urlObj.protocol}//${urlObj.host}`;
        console.log('Configuration extraite (path):', { server, username: pathParts[0], password: '***' });
        return {
          server,
          username: pathParts[0],
          password: pathParts[1]
        };
      }
      
      // Méthode 3: Format manuel (serveur + identifiants séparés)
      // Si l'URL ne contient que le serveur, on peut essayer de l'utiliser
      if (url.includes('http')) {
        const server = `${urlObj.protocol}//${urlObj.host}`;
        console.log('Serveur détecté:', server);
        return {
          server,
          username: '',
          password: ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors du parsing de l\'URL Xtream:', error);
      return null;
    }
  }

  /**
   * Parse une configuration Xtream depuis des données séparées
   */
  static parseXtreamConfig(server: string, username: string, password: string): XtreamConfig {
    const cleanServer = server.replace(/\/$/, '');
    console.log('Configuration Xtream créée:', { server: cleanServer, username, password: '***' });
    
    return {
      server: cleanServer,
      username,
      password
    };
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
      
      // Vérifier les types de fichiers Xtream
      const hasXtreamType = urlObj.searchParams.has('type') && 
                           ['m3u', 'm3u_plus', 'm3u8'].includes(urlObj.searchParams.get('type') || '');
      
      const isXtream = hasXtreamParams || hasXtreamPath || hasXtreamEndpoint || hasXtreamType;
      console.log('URL Xtream détectée:', isXtream, { hasXtreamParams, hasXtreamPath, hasXtreamEndpoint, hasXtreamType });
      
      return isXtream;
    } catch (error) {
      console.log('Erreur détection Xtream:', error);
      return false;
    }
  }

  /**
   * Récupère les catégories depuis l'API Xtream
   */
  async getCategories(): Promise<XtreamCategory[]> {
    try {
      const url = `${this.baseUrl}/player_api.php?username=${this.config.username}&password=${this.config.password}&action=get_live_categories`;
      console.log('Récupération des catégories:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Réponse catégories:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const categories = await response.json();
      console.log('Catégories récupérées:', categories.length || 0);
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
      
      console.log('Récupération des chaînes:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Réponse chaînes:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const channels = await response.json();
      console.log('Chaînes récupérées:', channels.length || 0);
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

    console.log('Conversion de', xtreamChannels.length, 'chaînes Xtream');

    return xtreamChannels.map(xtreamChannel => ({
      id: `${playlistSource}-${xtreamChannel.stream_id}`,
      name: xtreamChannel.name,
      url: `${this.baseUrl}/live/${this.config.username}/${this.config.password}/${xtreamChannel.stream_id}.ts`,
      tvgId: xtreamChannel.epg_channel_id || undefined,
      tvgName: xtreamChannel.name,
      tvgLogo: xtreamChannel.stream_icon || undefined,
      group: categoryMap.get(xtreamChannel.category_id) || 'Undefined',
      playlistSource,
      language: undefined,
      country: undefined
    }));
  }

  /**
   * Parse le contenu Xtream et retourne les chaînes
   */
  async parseXtreamContent(playlistSource: string): Promise<M3UParseResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('Début du parsing Xtream pour:', playlistSource);

    try {
      // Test de connexion d'abord
      const connectionTest = await this.testConnection();
      console.log('Test de connexion:', connectionTest);
      
      if (!connectionTest) {
        throw new Error('Impossible de se connecter au serveur Xtream. Vérifiez vos identifiants et l\'URL du serveur.');
      }

      // Récupérer les catégories et chaînes
      const [categories, xtreamChannels] = await Promise.all([
        this.getCategories(),
        this.getChannels()
      ]);

      console.log('Données récupérées:', { categories: categories.length, channels: xtreamChannels.length });

      if (xtreamChannels.length === 0) {
        warnings.push('Aucune chaîne trouvée dans cette playlist Xtream. Vérifiez que votre abonnement est actif.');
      }

      const channels = this.convertXtreamToChannels(xtreamChannels, categories, playlistSource);
      console.log('Chaînes converties:', channels.length);

      return {
        channels,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur parsing Xtream:', errorMessage);
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
    const url = `${this.baseUrl}/get.php?username=${this.config.username}&password=${this.config.password}&type=m3u_plus&output=ts`;
    console.log('URL M3U générée:', url);
    return url;
  }

  /**
   * Teste la connexion Xtream
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test avec l'API player
      const apiUrl = `${this.baseUrl}/player_api.php?username=${this.config.username}&password=${this.config.password}&action=get_live_categories`;
      console.log('Test de connexion API:', apiUrl);
      
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Réponse test API:', apiResponse.status, apiResponse.statusText);
      
      if (apiResponse.ok) {
        return true;
      }
      
      // Test alternatif avec l'URL M3U
      const m3uUrl = this.generateM3UUrl();
      console.log('Test de connexion M3U:', m3uUrl);
      
      const m3uResponse = await fetch(m3uUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Réponse test M3U:', m3uResponse.status, m3uResponse.statusText);
      return m3uResponse.ok;
      
    } catch (error) {
      console.error('Erreur test de connexion:', error);
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

/**
 * Fonction utilitaire pour créer une configuration Xtream depuis des données séparées
 */
export function createXtreamConfig(server: string, username: string, password: string): XtreamConfig {
  return XtreamParser.parseXtreamConfig(server, username, password);
}