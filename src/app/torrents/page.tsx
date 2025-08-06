// src/app/torrents/page.tsx
'use client';

import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { Movie, Series } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function TorrentsPage() {
  const { playlists, torrents } = usePlaylistStore();
  
  // Filtrer les playlists de type torrent
  const torrentPlaylists = playlists.filter(p => p.type === 'torrent');

  if (torrentPlaylists.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Aucune playlist de torrent ajoutée.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-64px)] p-4">
      <h1 className="text-3xl font-bold mb-6">Films & Séries (Torrents)</h1>
      {torrentPlaylists.map(playlist => (
        <div key={playlist.id} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{playlist.name}</h2>
          <Separator className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {torrents.get(playlist.id)?.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      ))}
    </ScrollArea>
  );
}

// Composant pour afficher une ressource (Film ou Série)
function ResourceCard({ resource }: { resource: Movie | Series }) {
  const isMovie = 'magnetURI' in resource; // Utiliser une propriété unique pour différencier

  return (
    <Card className="hover:scale-105 transition-transform duration-200 cursor-pointer">
      <img
        src={resource.poster || '/placeholder-poster.png'}
        alt={resource.name}
        className="w-full h-auto object-cover rounded-t-lg"
      />
      <CardContent className="p-2">
        <CardTitle className="text-sm truncate">
          {resource.name}
        </CardTitle>
        <p className="text-xs text-gray-400">
          {isMovie ? 'Film' : 'Série'}
        </p>
      </CardContent>
    </Card>
  );
}
