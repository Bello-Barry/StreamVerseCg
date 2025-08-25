'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Menu, X, Tv, Heart, History, Grid3X3, Settings, Moon, Sun, Film, BarChart3, Bell, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { HeaderProps, ViewType } from '@/types';

// Définition centralisée des éléments de navigation
const navItems = [
  { id: ViewType.HOME, label: 'Accueil', icon: Tv },
  { id: ViewType.CATEGORIES, label: 'Catégories', icon: Grid3X3 },
  { id: ViewType.MOVIES, label: 'Films & Séries', icon: Film }, // Correction : Utilisation de l'icône Film
  { id: ViewType.FAVORITES, label: 'Favoris', icon: Heart },
  { id: ViewType.HISTORY, label: 'Historique', icon: History },
];

const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  currentView,
  onViewChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const { theme, setTheme } = useTheme();

  // Utilisation d'un debounce pour la recherche
  const debouncedSearch = useCallback((query: string) => {
    // Note: Une implémentation plus robuste utiliserait un hook personnalisé (ex: useDebounce)
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4 animate-slide-in-left">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm"></div>
                <div className="relative bg-gradient-primary p-2 rounded-lg">
                  <Play className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  TvStream-cg
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">IPTV Player</p>
              </div>
            </div>
          </div>

          {/* Barre de recherche - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Rechercher des chaînes..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="search-input pl-10 pr-4 w-full transition-modern"
                />
              </div>
            </form>
          </div>

          {/* Navigation - Desktop */}
          <NavigationMenu className="hidden lg:flex animate-fade-in-right">
            <NavigationMenuList className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <NavigationMenuItem key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onViewChange(item.id)}
                      className={`nav-item ${isActive ? 'active' : ''} flex items-center space-x-2`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Button>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-2 animate-slide-in-right">
            {/* Toggle thème */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="nav-item hover:scale-105"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Menu paramètres */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="nav-item">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border/50">
                <DropdownMenuItem onClick={() => onViewChange(ViewType.PLAYLISTS)}>
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Gérer les playlists
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewChange(ViewType.ANALYTICS)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewChange(ViewType.NOTIFICATIONS)}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewChange(ViewType.THEMES)}>
                  <Palette className="mr-2 h-4 w-4" />
                  Thèmes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="nav-item"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Barre de recherche et menu mobile ouverts */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 glass animate-slide-in-down">
            <div className="py-4 space-y-1">
              <form onSubmit={handleSearchSubmit} className="mb-4 px-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Rechercher des chaînes..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 w-full"
                  />
                </div>
              </form>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`nav-item ${isActive ? 'active' : ''} w-full justify-start flex items-center space-x-3`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              
              <div className="border-t border-border/50 pt-3 mt-3 space-y-1">
                {/* ... (Autres boutons de menu mobile) */}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
