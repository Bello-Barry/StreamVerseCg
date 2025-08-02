'use client';

import React from 'react';
import { 
  Tv, 
  Newspaper, 
  Trophy, 
  Music, 
  Film, 
  Baby, 
  BookOpen, 
  Globe,
  Gamepad2,
  Heart,
  Zap,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryGridProps } from '@/types';
import { cn } from '@/lib/utils';

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onCategorySelect,
  selectedCategory
}) => {
  
  const getCategoryIcon = (categoryName: string) => {
    const icons = {
      'News': Newspaper,
      'Sports': Trophy,
      'Entertainment': Star,
      'Movies': Film,
      'Music': Music,
      'Kids': Baby,
      'Documentary': BookOpen,
      'General': Tv,
      'Gaming': Gamepad2,
      'Lifestyle': Heart,
      'Technology': Zap,
      'Undefined': Globe
    };
    
    return icons[categoryName as keyof typeof icons] || Globe;
  };

  const getCategoryGradient = (categoryName: string) => {
    const gradients = {
      'News': 'from-red-500 to-red-600',
      'Sports': 'from-green-500 to-green-600',
      'Entertainment': 'from-purple-500 to-purple-600',
      'Movies': 'from-blue-500 to-blue-600',
      'Music': 'from-pink-500 to-pink-600',
      'Kids': 'from-orange-500 to-orange-600',
      'Documentary': 'from-yellow-500 to-yellow-600',
      'General': 'from-gray-500 to-gray-600',
      'Gaming': 'from-indigo-500 to-indigo-600',
      'Lifestyle': 'from-rose-500 to-rose-600',
      'Technology': 'from-cyan-500 to-cyan-600',
      'Undefined': 'from-slate-500 to-slate-600'
    };
    
    return gradients[categoryName as keyof typeof gradients] || gradients['General'];
  };

  const getCategoryDescription = (categoryName: string) => {
    const descriptions = {
      'News': 'Actualités et informations',
      'Sports': 'Sports et compétitions',
      'Entertainment': 'Divertissement et spectacles',
      'Movies': 'Films et cinéma',
      'Music': 'Musique et concerts',
      'Kids': 'Contenu pour enfants',
      'Documentary': 'Documentaires et éducatif',
      'General': 'Chaînes généralistes',
      'Gaming': 'Jeux vidéo et esport',
      'Lifestyle': 'Mode de vie et bien-être',
      'Technology': 'Technologie et innovation',
      'Undefined': 'Catégorie non définie'
    };
    
    return descriptions[categoryName as keyof typeof descriptions] || 'Autres chaînes';
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Tv className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune catégorie disponible</h3>
        <p className="text-muted-foreground">
          Ajoutez des playlists pour voir les catégories de chaînes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Catégories IPTV</h2>
        <p className="text-muted-foreground">
          {categories.length} catégories disponibles avec {categories.reduce((total, cat) => total + cat.count, 0)} chaînes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.name);
          const isSelected = selectedCategory === category.name;
          
          return (
            <Card
              key={category.name}
              className={cn(
                "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105",
                "border-2 hover:border-primary/50 overflow-hidden",
                isSelected && "border-primary shadow-lg scale-105"
              )}
              onClick={() => onCategorySelect(category.name)}
            >
              <CardContent className="p-0">
                {/* Header avec gradient */}
                <div className={cn(
                  "relative h-24 bg-gradient-to-br",
                  getCategoryGradient(category.name),
                  "flex items-center justify-center text-white"
                )}>
                  <Icon className="h-10 w-10 drop-shadow-lg" />
                  
                  {/* Badge de nombre de chaînes */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {category.count}
                    </Badge>
                  </div>

                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {getCategoryDescription(category.name)}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {category.count} chaîne{category.count > 1 ? 's' : ''}
                    </span>
                    
                    {/* Indicateur de popularité */}
                    {category.count > 10 && (
                      <Badge variant="outline" className="text-xs">
                        Populaire
                      </Badge>
                    )}
                  </div>

                  {/* Barre de progression visuelle */}
                  <div className="mt-3 w-full bg-muted rounded-full h-1">
                    <div 
                      className={cn(
                        "h-1 rounded-full bg-gradient-to-r transition-all duration-500",
                        getCategoryGradient(category.name)
                      )}
                      style={{ 
                        width: `${Math.min((category.count / Math.max(...categories.map(c => c.count))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistiques globales */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {categories.length}
            </div>
            <div className="text-sm text-muted-foreground">Catégories</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-primary">
              {categories.reduce((total, cat) => total + cat.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Chaînes totales</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.round(categories.reduce((total, cat) => total + cat.count, 0) / categories.length)}
            </div>
            <div className="text-sm text-muted-foreground">Moy. par catégorie</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.max(...categories.map(c => c.count))}
            </div>
            <div className="text-sm text-muted-foreground">Plus grande catégorie</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;

