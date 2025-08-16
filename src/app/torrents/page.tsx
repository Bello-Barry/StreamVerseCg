'use client';

import React, { useState, useMemo } from 'react';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useTorrentPlayerImproved } from '@/stores/useTorrentPlayerImproved';
import {
  Movie,
  Series,
  Playlist,
  PlaylistType,
  TorrentInfo,
  Episode,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Film,
  Loader2,
  ListVideo,
  Play,
  Calendar,
  Clock,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Composants fictifs pour le rendu, à remplacer par vos implémentations
const TorrentPlayer = ({ className }: { className: string }) => (
  <div className={`flex items-center justify-center bg-black ${className}`}>
    <Play className='h-12 w-12 text-white' />
  </div>
);
const TorrentGrid = ({
  torrents,
  onTorrentPlay,
  onTorrentDownload,
  onTorrentFavorite,
}: {
  torrents: TorrentInfo[];
  onTorrentPlay: (torrent: TorrentInfo) => void;
  onTorrentDownload: (torrent: TorrentInfo) => void;
  onTorrentFavorite: (torrent: TorrentInfo) => void;
}) => (
  <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
    {torrents.map((torrent) => (
      <Card
        key={torrent.id}
        className='cursor-pointer bg-slate-800 text-white transition-transform hover:scale-105'
      >
        <CardContent className='p-4'>
          <img
            src={torrent.poster || '/placeholder.jpg'}
            alt={torrent.name}
            className='mb-4 aspect-video rounded-md object-cover'
          />
          <h3 className='truncate font-semibold'>{torrent.name}</h3>
          <div className='flex items-center justify-between'>
            <Badge variant='outline'>{torrent.type}</Badge>
            <Button
              onClick={() => onTorrentPlay(torrent)}
              variant='ghost'
              size='sm'
              className='text-white hover:bg-slate-700'
            >
              <Play className='h-4 w-4' />
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

/**
 * Modal pour afficher les épisodes d'une série
 */
function EpisodesModal({
  series,
  isOpen,
  onClose,
  onPlayEpisode,
}: {
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayEpisode: (episode: Episode, seriesName: string) => void;
}) {
  if (!series) return null;

  const episodesBySeason = series.episodes.reduce((acc, episode) => {
    const season = episode.season;
    if (!acc[season]) acc[season] = [];
    acc[season].push(episode);
    return acc;
  }, {} as Record<number, Episode[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[80vh] max-w-4xl border-slate-700 bg-slate-900'>
        <DialogHeader>
          <DialogTitle className='flex items-center text-white'>
            <Calendar className='mr-2 h-5 w-5' />
            {series.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className='max-h-96'>
          <div className='space-y-4'>
            {Object.entries(episodesBySeason)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([season, episodes]) => (
                <div key={season}>
                  <h3 className='mb-2 font-semibold text-white'>
                    Saison {season}
                  </h3>
                  <div className='grid gap-2'>
                    {episodes
                      .sort((a, b) => a.episode - b.episode)
                      .map((episode) => (
                        <Card
                          key={episode.id}
                          className='cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:bg-slate-700'
                          onClick={() => onPlayEpisode(episode, series.name)}
                        >
                          <CardContent className='flex items-center justify-between p-3'>
                            <div>
                              <p className='font-medium text-white'>
                                {episode.name}
                              </p>
                              <p className='text-sm text-slate-400'>
                                Épisode {episode.episode}
                                {episode.quality && (
                                  <Badge
                                    variant='outline'
                                    className='ml-2 border-slate-600 text-slate-300'
                                  >
                                    {episode.quality}
                                  </Badge>
                                )}
                              </p>
                              {episode.duration && (
                                <p className='mt-1 text-xs text-slate-500'>
                                  <Clock className='mr-1 inline h-3 w-3' />
                                  {episode.duration} min
                                </p>
                              )}
                            </div>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-slate-400 hover:text-white'
                            >
                              <Play className='h-4 w-4' />
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
 * Page principale des torrents améliorée
 */
export default function TorrentsPage() {
  const { playlists, getTorrentsByPlaylist, loading } = usePlaylistStore();
  const { playTorrent, playEpisode } = useTorrentPlayerImproved();
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isEpisodesModalOpen, setIsEpisodesModalOpen] = useState(false);

  const torrentPlaylists: Playlist[] = playlists.filter(
    (p) => p.type === PlaylistType.TORRENT
  );

  const handlePlayMovie = (movie: Movie) => {
    playTorrent(movie);
  };

  const handleShowEpisodes = (series: Series) => {
    setSelectedSeries(series);
    setIsEpisodesModalOpen(true);
  };

  const handlePlayEpisode = (episode: Episode, seriesName: string) => {
    playEpisode(episode, seriesName);
    setIsEpisodesModalOpen(false);
  };

  const handleCloseEpisodesModal = () => {
    setIsEpisodesModalOpen(false);
    setSelectedSeries(null);
  };

  const allTorrents = useMemo(() => {
    return torrentPlaylists.reduce((acc, playlist) => {
      const playlistTorrents = getTorrentsByPlaylist(playlist.id);
      const mappedTorrents = playlistTorrents.map((t) => {
        if ((t as Movie).infoHash) {
          return {
            ...t,
            type: 'movie',
            playlistName: playlist.name,
          } as TorrentInfo;
        } else {
          return {
            ...t,
            type: 'series',
            playlistName: playlist.name,
          } as TorrentInfo;
        }
      });
      return [...acc, ...mappedTorrents];
    }, [] as TorrentInfo[]);
  }, [torrentPlaylists, getTorrentsByPlaylist]);

  const movies = allTorrents.filter((t) => t.type === 'movie');
  const series = allTorrents.filter((t) => t.type === 'series');

  const handleDownload = (torrent: TorrentInfo) => {
    alert(`Fonctionnalité non implémentée: Téléchargement de ${torrent.name}`);
  };

  const handleFavorite = (torrent: TorrentInfo) => {
    alert(
      `Fonctionnalité non implémentée: Ajout de ${torrent.name} aux favoris`
    );
  };

  if (loading) {
    return (
      <div className='flex h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-12 w-12 animate-spin text-blue-500' />
          <p className='text-lg font-medium text-white'>
            Chargement des torrents...
          </p>
          <p className='mt-2 text-sm text-slate-400'>
            Analyse des playlists en cours...
          </p>
        </div>
      </div>
    );
  }

  if (torrentPlaylists.length === 0) {
    return (
      <div className='min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-900 to-slate-800'>
        <div className='flex h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='max-w-md'
          >
            <Film className='mx-auto mb-6 h-24 w-24 text-slate-600' />
            <h3 className='mb-4 text-2xl font-bold text-white'>
              Aucun contenu torrent
            </h3>
            <p className='mb-6 leading-relaxed text-slate-400'>
              Ajoutez des torrents via l'interface de gestion des playlists pour
              découvrir vos films et séries préférés en streaming.
            </p>
            <Button
              onClick={() => (window.location.href = '/playlists')}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              Ajouter des torrents
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-900 to-slate-800'>
      <div className='container mx-auto space-y-6 p-6'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between'
        >
          <div>
            <h1 className='mb-2 text-3xl font-bold text-white'>
              Streaming Torrents
            </h1>
            <p className='text-slate-400'>
              {movies.length} films et {series.length} séries disponibles
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='border-slate-700 text-slate-300 hover:bg-slate-700'
            >
              <Settings className='mr-2 h-4 w-4' />
              Paramètres
            </Button>
            <Button
              onClick={() => (window.location.href = '/playlists')}
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            >
              <Plus className='mr-2 h-4 w-4' />
              Ajouter
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <TorrentPlayer className='aspect-video w-full' />
        </motion.div>

        {allTorrents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TorrentGrid
              torrents={allTorrents}
              onTorrentPlay={(torrent) => {
                if (torrent.type === 'movie') {
                  handlePlayMovie(torrent);
                } else if (torrent.type === 'series') {
                  handleShowEpisodes(torrent as Series);
                }
              }}
              onTorrentDownload={handleDownload}
              onTorrentFavorite={handleFavorite}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='py-16 text-center'
          >
            <TrendingUp className='mx-auto mb-4 h-16 w-16 text-slate-600' />
            <h3 className='mb-2 text-xl font-semibold text-white'>
              Contenu en cours d'analyse
            </h3>
            <p className='mb-4 text-slate-400'>
              Les torrents ajoutés apparaîtront ici une fois analysés.
            </p>
            <Button
              onClick={() => (window.location.href = '/playlists')}
              variant='outline'
              className='border-slate-700 text-slate-300 hover:bg-slate-700'
            >
              <ListVideo className='mr-2 h-4 w-4' />
              Gérer les playlists
            </Button>
          </motion.div>
        )}

        {torrentPlaylists.length > 0 && allTorrents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='mt-8'
          >
            <h3 className='mb-4 text-lg font-semibold text-white'>
              Sources actives
            </h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {torrentPlaylists.map((playlist) => {
                const playlistTorrents = getTorrentsByPlaylist(playlist.id);
                return (
                  <Card
                    key={playlist.id}
                    className='border-slate-700 bg-slate-800'
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium text-white'>
                            {playlist.name}
                          </h4>
                          <p className='text-sm text-slate-400'>
                            {playlistTorrents.length} élément
                            {playlistTorrents.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge
                          variant='outline'
                          className='border-slate-600 text-xs text-slate-300'
                        >
                          {playlist.type.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <EpisodesModal
        series={selectedSeries}
        isOpen={isEpisodesModalOpen}
        onClose={handleCloseEpisodesModal}
        onPlayEpisode={handlePlayEpisode}
      />
    </div>
  );
}
