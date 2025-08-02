import { Channel, M3UParseResult } from '@/types';

/**
 * Parse le contenu d'une playlist M3U et retourne les chaînes
 */
export function parseM3UContent(content: string, sourceName: string): M3UParseResult {
  const channels: Channel[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!content || typeof content !== 'string') {
    errors.push('Contenu de playlist invalide ou vide');
    return { channels, errors, warnings };
  }
  
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) {
      errors.push('Playlist vide');
      return { channels, errors, warnings };
    }
    
    // Vérifier l'en-tête M3U
    if (!lines[0].startsWith('#EXTM3U')) {
      warnings.push('En-tête M3U manquant, tentative de parsing quand même');
    }
    
    let currentChannel: Partial<Channel> | null = null;
    let lineNumber = 0;
    
    for (const line of lines) {
      lineNumber++;
      
      try {
        if (line.startsWith('#EXTINF:')) {
          // Nouvelle entrée de chaîne
          currentChannel = parseExtinfLine(line, sourceName);
          
          if (!currentChannel) {
            warnings.push(`Ligne ${lineNumber}: Impossible de parser l'entrée EXTINF`);
            continue;
          }
          
        } else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://')) {
          // URL de stream
          if (currentChannel) {
            currentChannel.url = line;
            
            // Valider l'URL
            if (isValidStreamUrl(line)) {
              // Générer un ID unique pour la chaîne
              currentChannel.id = generateChannelId(currentChannel.name || 'Unknown', line);
              
              // Ajouter la chaîne complète
              channels.push(currentChannel as Channel);
            } else {
              warnings.push(`Ligne ${lineNumber}: URL de stream invalide - ${line}`);
            }
            
            currentChannel = null;
          } else {
            warnings.push(`Ligne ${lineNumber}: URL trouvée sans entrée EXTINF correspondante`);
          }
          
        } else if (line.startsWith('#')) {
          // Autres directives M3U (ignorées pour l'instant)
          continue;
        } else if (line.length > 0) {
          // Ligne non reconnue
          warnings.push(`Ligne ${lineNumber}: Ligne non reconnue - ${line.substring(0, 50)}...`);
        }
        
      } catch (error) {
        errors.push(`Ligne ${lineNumber}: Erreur de parsing - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
    
    // Vérifier s'il y a une entrée EXTINF sans URL correspondante
    if (currentChannel) {
      warnings.push('Dernière entrée EXTINF sans URL correspondante');
    }
    
  } catch (error) {
    errors.push(`Erreur générale de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
  
  return { channels, errors, warnings };
}

/**
 * Parse une ligne EXTINF et extrait les métadonnées
 */
function parseExtinfLine(line: string, sourceName: string): Partial<Channel> | null {
  try {
    // Format: #EXTINF:duration,title
    // Avec attributs optionnels: #EXTINF:duration tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",title
    
    const match = line.match(/^#EXTINF:(-?\d+(?:\.\d+)?)\s*(.*?),(.*)$/);
    if (!match) {
      return null;
    }
    
    const [, _duration, attributes, title] = match;
    
    const channel: Partial<Channel> = {
      name: title.trim(),
      playlistSource: sourceName
    };
    
    // Parser les attributs
    if (attributes) {
      // tvg-id
      const tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/);
      if (tvgIdMatch) {
        channel.tvgId = tvgIdMatch[1];
      }
      
      // tvg-name
      const tvgNameMatch = attributes.match(/tvg-name="([^"]*)"/);
      if (tvgNameMatch) {
        channel.tvgName = tvgNameMatch[1];
      }
      
      // tvg-logo
      const tvgLogoMatch = attributes.match(/tvg-logo="([^"]*)"/);
      if (tvgLogoMatch) {
        channel.tvgLogo = tvgLogoMatch[1];
      }
      
      // group-title
      const groupMatch = attributes.match(/group-title="([^"]*)"/);
      if (groupMatch) {
        channel.group = groupMatch[1];
      }
      
      // Attributs personnalisés pour la langue et le pays
      const languageMatch = attributes.match(/tvg-language="([^"]*)"/) || attributes.match(/language="([^"]*)"/) ;
      if (languageMatch) {
        channel.language = languageMatch[1];
      }
      
      const countryMatch = attributes.match(/tvg-country="([^"]*)"/) || attributes.match(/country="([^"]*)"/) ;
      if (countryMatch) {
        channel.country = countryMatch[1];
      }
    }
    
    // Nettoyer et valider le nom
    if (!channel.name || channel.name.trim().length === 0) {
      return null;
    }
    
    // Nettoyer le nom des caractères indésirables
    channel.name = cleanChannelName(channel.name);
    
    // Définir une catégorie par défaut si aucune n'est spécifiée
    if (!channel.group) {
      channel.group = 'Undefined';
    }
    
    return channel;
    
  } catch (error) {
    console.error('Erreur lors du parsing de la ligne EXTINF:', error);
    return null;
  }
}

/**
 * Valide une URL de stream
 */
function isValidStreamUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Vérifier les protocoles supportés
    const supportedProtocols = ['http:', 'https:', 'rtmp:', 'rtsp:'];
    if (!supportedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // Vérifier que l'URL n'est pas trop longue
    if (url.length > 2000) {
      return false;
    }
    
    // Vérifier les domaines suspects (basique)
    const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
      return false;
    }
    
    return true;
    
  } catch  {
    return false;
  }
}

/**
 * Génère un ID unique pour une chaîne
 */
function generateChannelId(name: string, url: string): string {
  // Créer un hash simple basé sur le nom et l'URL
  const combined = `${name}-${url}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32bit integer
  }
  
  return `channel-${Math.abs(hash).toString(36)}`;
}

/**
 * Nettoie le nom d'une chaîne
 */
function cleanChannelName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s\-\(\)\[\]\.]/g, '') // Supprimer les caractères spéciaux dangereux
    .substring(0, 100); // Limiter la longueur
}

/**
 * Valide le contenu d'une playlist M3U
 */
export function validateM3UContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!content || typeof content !== 'string') {
    errors.push('Contenu invalide ou vide');
    return { isValid: false, errors };
  }
  
  if (content.length > 10 * 1024 * 1024) { // 10MB max
    errors.push('Fichier trop volumineux (maximum 10MB)');
    return { isValid: false, errors };
  }
  
  const lines = content.split('\n');
  
  if (lines.length === 0) {
    errors.push('Playlist vide');
    return { isValid: false, errors };
  }
  
  // Vérifier la présence d'au moins une entrée EXTINF
  const hasExtinf = lines.some(line => line.trim().startsWith('#EXTINF:'));
  if (!hasExtinf) {
    errors.push('Aucune entrée EXTINF trouvée');
    return { isValid: false, errors };
  }
  
  // Vérifier la présence d'au moins une URL
  const hasUrl = lines.some(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || 
           trimmed.startsWith('rtmp://') || trimmed.startsWith('rtsp://');
  });
  
  if (!hasUrl) {
    errors.push('Aucune URL de stream trouvée');
    return { isValid: false, errors };
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Extrait les statistiques d'une playlist
 */
export function getPlaylistStats(content: string): {
  totalLines: number;
  extinfCount: number;
  urlCount: number;
  estimatedChannels: number;
} {
  if (!content) {
    return { totalLines: 0, extinfCount: 0, urlCount: 0, estimatedChannels: 0 };
  }
  
  const lines = content.split('\n');
  const totalLines = lines.length;
  
  let extinfCount = 0;
  let urlCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#EXTINF:')) {
      extinfCount++;
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || 
               trimmed.startsWith('rtmp://') || trimmed.startsWith('rtsp://')) {
      urlCount++;
    }
  }
  
  const estimatedChannels = Math.min(extinfCount, urlCount);
  
  return { totalLines, extinfCount, urlCount, estimatedChannels };
}

