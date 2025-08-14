import React from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Star, Clock } from 'lucide-react';
import { TorrentInfo, MovieFile } from '@/types'; // Importation du type centralisé

interface TorrentCardProps {
  torrent: TorrentInfo;
  onPlay: () => void;
  onDownload: () => void;
  onFavorite: () => void;
}

export const TorrentCard: React.FC<TorrentCardProps> = ({
  torrent,
  onPlay,
  onDownload,
  onFavorite
}) => {
  return (
    <motion.div
      className="relative group bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image d'aperçu */}
      <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 relative">
        <img
          src={torrent.poster || '/placeholder-movie.jpg'}
          alt={torrent.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Gérer les erreurs d'image en affichant un placeholder
            e.currentTarget.src = '/placeholder-movie.jpg';
          }}
        />
        
        {/* Overlay avec actions */}
        <motion.div
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <div className="flex space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Jouer le torrent"
            >
              <Play className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="p-3 bg-green-600 rounded-full hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Télécharger le torrent"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              className="p-3 bg-yellow-600 rounded-full hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="Ajouter aux favoris"
            >
              <Star className="w-6 h-6 text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Informations */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
          {torrent.name}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {/* Affiche la durée si disponible, sinon "N/A" */}
            {torrent.duration || 'N/A'}
          </span>
          <span className="bg-blue-600 px-2 py-1 rounded text-white text-xs">
            {/* Affiche la qualité si disponible, sinon "HD" par défaut */}
            {torrent.quality || 'HD'}
          </span>
        </div>

        {/* Barre de progression du téléchargement */}
        {torrent.progress !== undefined && torrent.progress >= 0 ? (
          <div className="mt-3">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${torrent.progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{Math.round(torrent.progress * 100)}%</span>
              <span>{torrent.downloadSpeed || 0} MB/s</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              Non téléchargé
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
