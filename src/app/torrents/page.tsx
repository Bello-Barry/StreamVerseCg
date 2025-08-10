'use client';

import React, { useEffect, useState } from 'react';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { Movie, Series, Playlist, PlaylistType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Film, PlayCircle, Loader2, ListVideo, AlertCircle, Play, Calendar, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTorrentPlayer } from '@/stores/useTorrentPlayer';
import { Player } from '@/components/Player';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Composant pour afficher un film
 */
function MovieCard({ movie, onPlay }: { movie: Movie; onPlay: (movie: Movie) => void; }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card className="relative group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="aspect-[2/3] relative">
          <img
            src={movie.poster || `https://via.placeholder.com/300x450/1f2937/9ca3af?text=${encodeURIComponent(movie.name)}`}
            alt={movie.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/300x450/1f2937/9ca3af?text=${encodeURIComponent(movie.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center transition-all duration-300">
            <Button
              variant="secondary"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-12 w-12"
              onClick={() => onPlay(movie)}
            >
              <PlayCircle className="h-6 w-6" />
            </Button>
          </div>
          <Badge className="absolute top-2 right-2 bg-blue-600">
            <Film className="h-3 w-3 mr-1" />
            Film
          </Badge>
        </div>
        <CardContent className="p-3">
          <CardTitle className="text-sm font-medium truncate mb-1">
            {movie.name}
          </CardTitle>
          <div className="flex items-center text-xs text-muted-foreground space-x-2">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {movie.length ? `${Math.round(movie.length / 60)} min` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {movie.category}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Composant pour afficher une série
 */
function SeriesCard({ series, onShowEpisodes }: { series: Series; onShowEpisodes: (series: Series) => void; }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card className="relative group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="aspect-[2/3] relative">
          <img
            src={series.poster || `https://via.placeholder.com/300x450/059669/ffffff?text=${encodeURIComponent(series.name)}`}
            alt={series.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/300x450/059669/ffffff?text=${encodeURIComponent(series.name)}`;
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center transition-all duration-300">
            <Button
              variant="secondary"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-12 w-12"
              onClick={() => onShowEpisodes(series)}
            >
              <ListVideo className="h-6 w-6" />
            </Button>
          </div>
          <Badge className="absolute top-2 right-2 bg-green-600">
            <Calendar className="h-3 w-3 mr-1" />
            Série
          </Badge>
        </div>
        <CardContent className="p-3">
          <CardTitle className="text-sm font-medium truncate mb-1">
            {series.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {series.episodes.length} épisode{series.episodes.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {series.category}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Modal pour afficher les épisodes d'une série
 */
function EpisodesModal({ 
  series, 
  isOpen, 
  onClose, 
  onPlayEpisode 
}: { 
  series: Series | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onPlayEpisode: (episode: any, seriesName: string) => void;
}) {
  if (!series) return null;

  // Grouper les épisodes par saison
  const episodesBySeason = series.episodes.reduce((acc, episode) => {
    const season = episode.season;
    if (!acc[season]) acc[season] = [];
    acc[season].push(episode);
    return acc;
  }, {} as Record<number, typeof series.episodes>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            {series.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {Object.entries(episodesBySeason)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([season, episodes]) => (
                <div key={season}>
                  <h3 className="font-semibold mb-2">Saison {season}</h3>
                  <div className="grid gap-2">
                    {episodes
                      .sort((a, b) => a.episode - b.episode)
                      .map((episode) => (
                        <Card 
                          key={episode.id} 
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => onPlayEpisode(episode, series.name)}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{episode.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Épisode {episode.episode}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Play className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Page principale des torrents
 */
export default function TorrentsPage() {
  const { playlists, getTorrentsByPlaylist, loading } = usePlaylistStore();
  const { playTorrent, playEpisode, isLoading, error, downloadProgress } = useTorrentPlayer();
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isEpisodesModalOpen, setIsEpisodesModalOpen] = useState(false);

  const torrentPlaylists: Playlist[] = playlists.filter(p => p.type === PlaylistType.TORRENT);

  const handlePlayMovie = (movie: Movie) => {
    console.log('Lecture du film:', movie.name);
    playTorrent(movie);
  };

  const handleShowEpisodes = (series: Series) => {
    setSelectedSeries(series);
    setIsEpisodesModalOpen(true);
  };

  const handlePlayEpisode = (episode: any, seriesName: string) => {
    console.log('Lecture de l\'épisode:', episode.name);
    playEpisode(episode, seriesName);
    setIsEpisodesModalOpen(false);
  };

  const handleCloseEpisodesModal = () => {
    setIsEpisodesModalOpen(false);
    setSelectedSeries(null);
  };

  // Récupérer tous les torrents de toutes les playlists actives
  const allTorrents = torrentPlaylists.reduce((acc, playlist) => {
    const playlistTorrents = getTorrentsByPlaylist(playlist.id);
    return [...acc, ...playlistTorrents.map(t => ({ ...t, playlistName: playlist.name }))];
  }, [] as (Movie | Series & { playlistName: string })[]);

  const movies = allTorrents.filter(t => (t as Movie).magnetURI !== undefined) as (Movie & { playlistName: string })[];
  const series = allTorrents.filter(t => (t as Series).episodes !== undefined) as (Series & { playlistName: string })[];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Chargement des torrents...</p>
        </div>
      </div>
    );
  }

  if (torrentPlaylists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-4 text-center">
        <Film className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Aucun contenu torrent</h3>
        <p className="text-muted-foreground mb-4">
          Ajoutez des torrents via l'interface de gestion des playlists pour voir vos films et séries ici.
        </p>
        <Button onClick={() => window.location.href = '/playlists'}>
          <ListVideo className="mr-2 h-4 w-4" /> Gérer les playlists
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Lecteur vidéo */}
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 mx-4 mt-4">
        <Player />
      </div>

      {/* Indicateurs de statut */}
      {isLoading && (
        <div className="flex items-center justify-center text-blue-500 mb-4 mx-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Chargement du torrent... {downloadProgress}%</span>
        </div>
      )}
      {error && (
        <div className="flex items-center text-red-500 mb-4 mx-4 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contenu des torrents */}
      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-8">
          {/* Films */}
          {movies.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Film className="mr-2 h-6 w-6" />
                  Films ({movies.length})
                </h2>
              </div>
              <Separator className="mb-4" />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
              >
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onPlay={handlePlayMovie} />
                ))}
              </motion.div>
            </section>
          )}

          {/* Séries */}
          {series.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Calendar className="mr-2 h-6 w-6" />
                  Séries ({series.length})
                </h2>
              </div>
              <Separator className="mb-4" />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
              >
                {series.map((serie) => (
                  <SeriesCard key={serie.id} series={serie} onShowEpisodes={handleShowEpisodes} />
                ))}
              </motion.div>
            </section>
          )}

          {/* Message si aucun contenu */}
          {allTorrents.length === 0 && (
            <div className="text-center py-16">
              <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun contenu torrent disponible</h3>
              <p className="text-muted-foreground mb-4">
                Les torrents ajoutés apparaîtront ici une fois analysés.
              </p>
              <Button onClick={() => window.location.href = '/playlists'}>
                <ListVideo className="mr-2 h-4 w-4" /> Ajouter des torrents
              </Button>
            </div>
          )}

          {/* Informations sur les playlists torrent */}
          {torrentPlaylists.length > 0 && allTorrents.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {torrentPlaylists.map((playlist) => {
                  const playlistTorrents = getTorrentsByPlaylist(playlist.id);
                  return (
                    <Card key={playlist.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{playlist.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {playlistTorrents.length} élément{playlistTorrents.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {playlist.type.toUpperCase()}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>

      {/* Modal des épisodes */}
      <EpisodesModal
        series={selectedSeries}
        isOpen={isEpisodesModalOpen}
        onClose={handleCloseEpisodesModal}
        onPlayEpisode={handlePlayEpisode}
      />
    </div>
  );
}