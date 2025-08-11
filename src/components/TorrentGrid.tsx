import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { TorrentCard } from './TorrentCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TorrentGridProps {
  torrents: TorrentInfo[];
  onTorrentPlay: (torrent: TorrentInfo) => void;
  onTorrentDownload: (torrent: TorrentInfo) => void;
  onTorrentFavorite: (torrent: TorrentInfo) => void;
}

export const TorrentGrid: React.FC<TorrentGridProps> = ({
  torrents,
  onTorrentPlay,
  onTorrentDownload,
  onTorrentFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTorrents = useMemo(() => {
    return torrents.filter(torrent => {
      const matchesSearch = torrent.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || torrent.type === filterType;
      const matchesQuality = filterQuality === 'all' || torrent.quality === filterQuality;
      
      return matchesSearch && matchesType && matchesQuality;
    });
  }, [torrents, searchTerm, filterType, filterQuality]);

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Rechercher des films, séries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="movie">Films</SelectItem>
              <SelectItem value="series">Séries</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterQuality} onValueChange={setFilterQuality}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue placeholder="Qualité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="4K">4K</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille de contenu */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {filteredTorrents.map((torrent) => (
          <TorrentCard
            key={torrent.infoHash}
            torrent={torrent}
            onPlay={() => onTorrentPlay(torrent)}
            onDownload={() => onTorrentDownload(torrent)}
            onFavorite={() => onTorrentFavorite(torrent)}
          />
        ))}
      </div>

      {filteredTorrents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">Aucun contenu trouvé</p>
          <p className="text-slate-500 text-sm mt-2">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
};
