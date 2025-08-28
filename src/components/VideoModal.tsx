// src/components/VideoModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, Play, Film } from 'lucide-react';
import type { Movie } from '@/types/movie';
import { toast } from 'sonner';

type Props = {
  movie: Movie;
  onClose: () => void;
};

export default function VideoModal({ movie, onClose }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const getEmbedUrls = (movie: Movie) => {
    const baseParams = 'rel=0&modestbranding=1&showinfo=0&controls=1';
    if (movie.type === 'playlist') {
      return {
        primary: `https://www.youtube.com/embed/videoseries?list=${movie.playlistid}&${baseParams}`,
        directLink: `https://www.youtube.com/playlist?list=${movie.playlistid}`,
      };
    }
    return {
      primary: `https://www.youtube-nocookie.com/embed/${movie.youtubeid}?${baseParams}`,
      secondary: `https://www.youtube.com/embed/${movie.youtubeid}?${baseParams}`,
      directLink: `https://www.youtube.com/watch?v=${movie.youtubeid}`,
    };
  };

  const urls = getEmbedUrls(movie);
  const embedUrls = movie.type === 'playlist' ? [urls.primary] : [urls.primary, urls.secondary];

  useEffect(() => {
    // reset states when movie changes
    setIsLoading(true);
    setHasError(false);
    setEmbedBlocked(false);
    setCurrentUrlIndex(0);
  }, [movie?.id]);

  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      // si l'iframe reste bloquée, essayer l'url suivante ou afficher le blocage
      if (currentUrlIndex < embedUrls.length - 1) {
        setCurrentUrlIndex((p) => p + 1);
        setIsLoading(true);
        setHasError(false);
      } else {
        setEmbedBlocked(true);
        toast.error('Impossible de charger l’embed — essayez d’ouvrir sur YouTube.');
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isLoading, currentUrlIndex, embedUrls.length]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    // essayer l'url suivante si existante
    if (currentUrlIndex < embedUrls.length - 1) {
      setCurrentUrlIndex((p) => p + 1);
      setIsLoading(true);
    } else {
      setEmbedBlocked(true);
      toast.error('Embed bloqué ou erreur réseau — vous pouvez ouvrir sur YouTube.');
    }
  };

  const openInYoutube = () => {
    window.open(urls.directLink, '_blank');
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Impossible d’ouvrir un nouvel onglet (bloqué par le navigateur).');
      return;
    }
    newWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${movie.title}</title>
          <style>html,body{height:100%;margin:0;background:#000}iframe{border:0;width:100%;height:100%}</style>
        </head>
        <body>
          <iframe src="${embedUrls[currentUrlIndex]}" allowfullscreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"></iframe>
        </body>
      </html>
    `);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <Card className="w-full max-w-6xl max-h-[95vh] p-2 sm:p-4 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-20 rounded-full bg-black/70 hover:bg-black text-white"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>

        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.18 }}>
          <div className="pr-10 mb-3">
            <h2 className="text-lg sm:text-2xl font-bold truncate">{movie.title}</h2>
            {movie.description && <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{movie.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{movie.category || 'Non classé'}</span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{movie.type === 'playlist' ? 'Playlist' : 'Vidéo'}</span>
            </div>
          </div>

          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            {isLoading && !embedBlocked && (
              <div className="absolute inset-0 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{currentUrlIndex > 0 ? 'Tentative alternative...' : 'Chargement de la vidéo...'}</p>
                </div>
              </div>
            )}

            {(hasError || embedBlocked) && (
              <div className="absolute inset-0 bg-destructive/10 rounded-xl flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                  <div className="mx-auto">
                    <X className="h-8 w-8 text-destructive mx-auto mb-1" />
                    <p className="text-sm text-destructive font-medium">Contenu bloqué pour l'intégration</p>
                    <p className="text-xs text-muted-foreground">Cette vidéo ne peut pas être lue ici — essayez sur YouTube.</p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={openInYoutube}>
                      <Play className="h-4 w-4" /> Ouvrir sur YouTube
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={openInNewTab}>
                      <Film className="h-4 w-4" /> Nouvel onglet
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!embedBlocked && (
              <iframe
                key={currentUrlIndex}
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                src={embedUrls[currentUrlIndex]}
                title={`Lecteur vidéo - ${movie.title}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            )}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}