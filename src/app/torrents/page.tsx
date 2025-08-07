'use client';

import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { Movie, Series, Playlist } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Film, PlayCircle, Loader2, ListVideo, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTorrentPlayer } from '@/stores/useTorrentPlayer'; // Chemin corrigé pour pointer vers le hook
import { useEffect } from 'react';

// Importez le composant de lecteur vidéo que nous avons créé
import { Player } from '@/components/Player';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Composant de carte pour afficher un film ou une série.
 */
function ResourceCard({ resource, onPlay }: { resource: Movie | Series; onPlay: (resource: Movie | Series) => void; }) {
  const isMovie = (resource as Movie).magnetURI !== undefined;
  
  const handlePlayClick = () => {
    onPlay(resource);
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="relative group cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105">
        <img
          src={resource.poster || 'https://via.placeholder.com/300x450.png?text=Pas+d\'affiche'}
          alt={resource.name}
          className="w-full h-auto object-cover rounded-t-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 flex items-center justify-center transition-all duration-300">
          <Button
            variant="secondary"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={handlePlayClick}
          >
            <PlayCircle className="h-6 w-6" />
          </Button>
        </div>
        <CardContent className="p-2">
          <CardTitle className="text-sm truncate">
            {resource.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isMovie ? 'Film' : `Série (${(resource as Series).episodes.length} épisodes)`}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Page principale d'affichage des torrents (films et séries).
 */
export default function TorrentsPage() {
  const { playlists, torrents } = usePlaylistStore();
  const { playTorrent, isLoading, error, cleanup } = useTorrentPlayer();

  const torrentPlaylists: Playlist[] = playlists.filter(p => p.type === 'torrent');

  const handlePlay = (resource: Movie | Series) => {
    if ((resource as Series).episodes) {
      console.log(`Affichage des épisodes pour la série : ${resource.name}`);
      // TODO: Implémenter la navigation vers une page d'épisodes ou une modale
      return;
    }
    playTorrent(resource as Movie);
  };
  
  // Utiliser useEffect pour nettoyer le client WebTorrent à la sortie de la page
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (torrentPlaylists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-4 text-center">
        <Film className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Aucun contenu torrent</h3>
        <p className="text-muted-foreground mb-4">Ajoutez un torrent via l'interface de gestion des playlists pour voir vos films et séries ici.</p>
        <Button onClick={() => console.log("Redirection vers la page d'ajout de playlist")}>
          <ListVideo className="mr-2 h-4 w-4" /> Gérer les playlists
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-64px)] p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Films & Séries</h1>

      {/* Le conteneur du lecteur vidéo */}
      <div className="flex-1 w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
        <Player /> {/* C'est ici que le lecteur est rendu */}
      </div>

      {isLoading && (
        <div className="flex items-center text-blue-500 mb-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Chargement du torrent...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        <motion.div
          key="torrent-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 mt-8"
        >
          {torrentPlaylists.map(playlist => (
            <section key={playlist.id}>
              <h2 className="text-2xl font-semibold mb-4">{playlist.name}</h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {torrents.get(playlist.id)?.map(resource => (
                  <ResourceCard key={resource.id} resource={resource} onPlay={handlePlay} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </ScrollArea>
  );
}
