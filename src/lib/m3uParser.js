"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistStats = exports.validateM3UContent = exports.parseM3UContent = void 0;
/**
 * Parse le contenu d'une playlist M3U et retourne les chaînes
 */
function parseM3UContent(content, sourceName) {
    var channels = [];
    var errors = [];
    var warnings = [];
    if (!content || typeof content !== 'string') {
        errors.push('Contenu de playlist invalide ou vide');
        return { channels: channels, errors: errors, warnings: warnings };
    }
    try {
        var lines = content.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line; });
        if (lines.length === 0) {
            errors.push('Playlist vide');
            return { channels: channels, errors: errors, warnings: warnings };
        }
        // Vérifier l'en-tête M3U
        if (!lines[0].startsWith('#EXTM3U')) {
            warnings.push('En-tête M3U manquant, tentative de parsing quand même');
        }
        var currentChannel = null;
        var lineNumber = 0;
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            lineNumber++;
            try {
                if (line.startsWith('#EXTINF:')) {
                    // Nouvelle entrée de chaîne
                    currentChannel = parseExtinfLine(line, sourceName);
                    if (!currentChannel) {
                        warnings.push("Ligne ".concat(lineNumber, ": Impossible de parser l'entr\u00E9e EXTINF"));
                        continue;
                    }
                }
                else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://')) {
                    // URL de stream
                    if (currentChannel) {
                        currentChannel.url = line;
                        // Valider l'URL
                        if (isValidStreamUrl(line)) {
                            // Générer un ID unique pour la chaîne
                            currentChannel.id = generateChannelId(currentChannel.name || 'Unknown', line);
                            // Ajouter la chaîne complète
                            channels.push(currentChannel);
                        }
                        else {
                            warnings.push("Ligne ".concat(lineNumber, ": URL de stream invalide - ").concat(line));
                        }
                        currentChannel = null;
                    }
                    else {
                        warnings.push("Ligne ".concat(lineNumber, ": URL trouv\u00E9e sans entr\u00E9e EXTINF correspondante"));
                    }
                }
                else if (line.startsWith('#')) {
                    // Autres directives M3U (ignorées pour l'instant)
                    continue;
                }
                else if (line.length > 0) {
                    // Ligne non reconnue
                    warnings.push("Ligne ".concat(lineNumber, ": Ligne non reconnue - ").concat(line.substring(0, 50), "..."));
                }
            }
            catch (error) {
                errors.push("Ligne ".concat(lineNumber, ": Erreur de parsing - ").concat(error instanceof Error ? error.message : 'Erreur inconnue'));
            }
        }
        // Vérifier s'il y a une entrée EXTINF sans URL correspondante
        if (currentChannel) {
            warnings.push('Dernière entrée EXTINF sans URL correspondante');
        }
    }
    catch (error) {
        errors.push("Erreur g\u00E9n\u00E9rale de parsing: ".concat(error instanceof Error ? error.message : 'Erreur inconnue'));
    }
    return { channels: channels, errors: errors, warnings: warnings };
}
exports.parseM3UContent = parseM3UContent;
/**
 * Parse une ligne EXTINF et extrait les métadonnées
 */
function parseExtinfLine(line, sourceName) {
    try {
        // Format: #EXTINF:duration,title
        // Avec attributs optionnels: #EXTINF:duration tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",title
        var match = line.match(/^#EXTINF:(-?\d+(?:\.\d+)?)\s*(.*?),(.*)$/);
        if (!match) {
            return null;
        }
        var _duration = match[1], attributes = match[2], title = match[3];
        var channel = {
            name: title.trim(),
            playlistSource: sourceName
        };
        // Parser les attributs
        if (attributes) {
            // tvg-id
            var tvgIdMatch = attributes.match(/tvg-id="([^"]*)"/);
            if (tvgIdMatch) {
                channel.tvgId = tvgIdMatch[1];
            }
            // tvg-name
            var tvgNameMatch = attributes.match(/tvg-name="([^"]*)"/);
            if (tvgNameMatch) {
                channel.tvgName = tvgNameMatch[1];
            }
            // tvg-logo
            var tvgLogoMatch = attributes.match(/tvg-logo="([^"]*)"/);
            if (tvgLogoMatch) {
                channel.tvgLogo = tvgLogoMatch[1];
            }
            // group-title
            var groupMatch = attributes.match(/group-title="([^"]*)"/);
            if (groupMatch) {
                channel.group = groupMatch[1];
            }
            // Attributs personnalisés pour la langue et le pays
            var languageMatch = attributes.match(/tvg-language="([^"]*)"/) || attributes.match(/language="([^"]*)"/);
            if (languageMatch) {
                channel.language = languageMatch[1];
            }
            var countryMatch = attributes.match(/tvg-country="([^"]*)"/) || attributes.match(/country="([^"]*)"/);
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
    }
    catch (error) {
        console.error('Erreur lors du parsing de la ligne EXTINF:', error);
        return null;
    }
}
/**
 * Valide une URL de stream
 */
function isValidStreamUrl(url) {
    try {
        var urlObj_1 = new URL(url);
        // Vérifier les protocoles supportés
        var supportedProtocols = ['http:', 'https:', 'rtmp:', 'rtsp:'];
        if (!supportedProtocols.includes(urlObj_1.protocol)) {
            return false;
        }
        // Vérifier que l'URL n'est pas trop longue
        if (url.length > 2000) {
            return false;
        }
        // Vérifier les domaines suspects (basique)
        var suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
        if (suspiciousDomains.some(function (domain) { return urlObj_1.hostname.includes(domain); })) {
            return false;
        }
        return true;
    }
    catch (_a) {
        return false;
    }
}
/**
 * Génère un ID unique pour une chaîne
 */
function generateChannelId(name, url) {
    // Créer un hash simple basé sur le nom et l'URL
    var combined = "".concat(name, "-").concat(url);
    var hash = 0;
    for (var i = 0; i < combined.length; i++) {
        var char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en 32bit integer
    }
    return "channel-".concat(Math.abs(hash).toString(36));
}
/**
 * Nettoie le nom d'une chaîne
 */
function cleanChannelName(name) {
    return name
        .trim()
        .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
        .replace(/[^\w\s\-\(\)\[\]\.]/g, '') // Supprimer les caractères spéciaux dangereux
        .substring(0, 100); // Limiter la longueur
}
/**
 * Valide le contenu d'une playlist M3U
 */
function validateM3UContent(content) {
    var errors = [];
    if (!content || typeof content !== 'string') {
        errors.push('Contenu invalide ou vide');
        return { isValid: false, errors: errors };
    }
    if (content.length > 10 * 1024 * 1024) { // 10MB max
        errors.push('Fichier trop volumineux (maximum 10MB)');
        return { isValid: false, errors: errors };
    }
    var lines = content.split('\n');
    if (lines.length === 0) {
        errors.push('Playlist vide');
        return { isValid: false, errors: errors };
    }
    // Vérifier la présence d'au moins une entrée EXTINF
    var hasExtinf = lines.some(function (line) { return line.trim().startsWith('#EXTINF:'); });
    if (!hasExtinf) {
        errors.push('Aucune entrée EXTINF trouvée');
        return { isValid: false, errors: errors };
    }
    // Vérifier la présence d'au moins une URL
    var hasUrl = lines.some(function (line) {
        var trimmed = line.trim();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://') ||
            trimmed.startsWith('rtmp://') || trimmed.startsWith('rtsp://');
    });
    if (!hasUrl) {
        errors.push('Aucune URL de stream trouvée');
        return { isValid: false, errors: errors };
    }
    return { isValid: errors.length === 0, errors: errors };
}
exports.validateM3UContent = validateM3UContent;
/**
 * Extrait les statistiques d'une playlist
 */
function getPlaylistStats(content) {
    if (!content) {
        return { totalLines: 0, extinfCount: 0, urlCount: 0, estimatedChannels: 0 };
    }
    var lines = content.split('\n');
    var totalLines = lines.length;
    var extinfCount = 0;
    var urlCount = 0;
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        var trimmed = line.trim();
        if (trimmed.startsWith('#EXTINF:')) {
            extinfCount++;
        }
        else if (trimmed.startsWith('http://') || trimmed.startsWith('https://') ||
            trimmed.startsWith('rtmp://') || trimmed.startsWith('rtsp://')) {
            urlCount++;
        }
    }
    var estimatedChannels = Math.min(extinfCount, urlCount);
    return { totalLines: totalLines, extinfCount: extinfCount, urlCount: urlCount, estimatedChannels: estimatedChannels };
}
exports.getPlaylistStats = getPlaylistStats;
