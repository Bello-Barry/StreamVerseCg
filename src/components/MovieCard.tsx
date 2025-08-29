'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/movie';
import { getYoutubeThumbnail } from '@/lib/getYoutubeThumbnail';
import { Play, List, Info, Heart, Plus, Download, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onToggleFavorite?: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
}

/**
 * Composant de carte film/série style Netflix avec animations et fonctionnalités avancées
 */
export const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  onClick,
  onAddToWatchlist,
  onToggleFavorite,
  onDownload,
  isFavorite = false,
  isInWatchlist = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sources d'images en cascade
  const thumbnailSrc = 
    movie.poster || 
    (movie.youtubeid ? getYoutubeThumbnail(movie.youtubeid) : null) || 
    (movie.playlistid ? "/placeholder-playlist.jpg" : null) || 
    "/placeholder-movie.jpg";

  // Gestion du clic principal
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  // Actions secondaires
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  // Génération d'une note aléatoire pour l'exemple
  const rating = Math.floor(Math.random() * 50) + 50; // 50-100%
  const duration = movie.type === 'playlist' ? `${Math.floor(Math.random() * 20) + 5} épisodes` : `${Math.floor(Math.random() * 120) + 90}min`;

  return (
    <motion.div
      ref={cardRef}
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowDetails(false);
      }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 cursor-pointer">
        <CardContent className="p-0">
          {/* Image principale */}
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={thumbnailSrc}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority={false}
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'scale-110 brightness-75' : 'scale-100 brightness-100'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-60'
            }`} />

            {/* Badge type */}
            <motion.div 
              className="absolute top-2 left-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge 
                variant={movie.type === 'playlist' ? 'destructive' : 'default'} 
                className="text-xs font-semibold backdrop-blur-sm bg-black/70 text-white border-white/20"
              >
                {movie.type === 'playlist' ? (
                  <><List className="h-3 w-3 mr-1" />SÉRIE</>
                ) : (
                  <><Play className="h-3 w-3 mr-1" />FILM</>
                )}
              </Badge>
            </motion.div>

            {/* Rating badge */}
            <motion.div 
              className="absolute top-2 right-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="text-xs bg-green-600/90 text-white border-green-500/50 backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1" />{rating}%
              </Badge>
            </motion.div>

            {/* Bouton play central */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="lg"
                    className="rounded-full bg-white hover:bg-white/90 text-black w-16 h-16 shadow-2xl"
                    onClick={handleClick}
                  >
                    <Play className="h-6 w-6 ml-1" fill="currentColor" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions en bas */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/70 hover:bg-black/90 text-white w-8 h-8"
                        onClick={(e) => handleActionClick(e, () => onToggleFavorite?.(movie))}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/70 hover:bg-black/90 text-white w-8 h-8"
                        onClick={(e) => handleActionClick(e, () => onAddToWatchlist?.(movie))}
                      >
                        <Plus className={`h-4 w-4 ${isInWatchlist ? 'rotate-45' : ''}`} />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/70 hover:bg-black/90 text-white w-8 h-8"
                        onClick={(e) => handleActionClick(e, () => onDownload?.(movie))}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full bg-black/70 hover:bg-black/90 text-white w-8 h-8"
                      onClick={(e) => handleActionClick(e, () => setShowDetails(!showDetails))}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Informations du film */}
          <motion.div 
            className="p-4 space-y-2"
            animate={{ height: showDetails ? 'auto' : '80px' }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">
              {movie.title}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{duration}</span>
              {movie.category && (
                <>
                  <span>•</span>
                  <span className="text-slate-300">{movie.category}</span>
                </>
              )}
            </div>

            <AnimatePresence>
              {showDetails && movie.description && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-slate-400 text-xs leading-relaxed mt-2">
                    {movie.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};