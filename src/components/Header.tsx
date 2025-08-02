'use client';

import React, { useState } from 'react';
import { Search, Menu, X, Tv, Heart, History, Grid3X3, Settings, Moon, Sun, Play, BarChart3, Bell, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { HeaderProps, ViewType } from '@/types';

const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  currentView,
  onViewChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const { theme, setTheme } = useTheme();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Recherche en temps réel avec debounce
    setTimeout(() => onSearch(value), 300);
  };

  const navigationItems = [
    { id: ViewType.HOME, label: 'Accueil', icon: Tv },
    { id: ViewType.CATEGORIES, label: 'Catégories', icon: Grid3X3 },
    { id: ViewType.FAVORITES, label: 'Favoris', icon: Heart },
    { id: ViewType.HISTORY, label: 'Historique', icon: History },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4 animate-slide-in">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm"></div>
                <div className="relative bg-gradient-primary p-2 rounded-lg">
                  <Play className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  StreamVerse
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
          <NavigationMenu className="hidden lg:flex animate-fade-in">
            <NavigationMenuList className="flex space-x-1">
              {navigationItems.map((item) => {
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
          <div className="hidden md:flex items-center space-x-2 animate-slide-in">
            {/* Toggle thème */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="nav-item hover-glow"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Menu paramètres */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="nav-item">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass border-border/50">
                <DropdownMenuItem 
                  onClick={() => onViewChange(ViewType.PLAYLISTS)}
                  className="transition-modern hover:bg-accent/50"
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Gérer les playlists
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onViewChange(ViewType.ANALYTICS)}
                  className="transition-modern hover:bg-accent/50"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onViewChange(ViewType.NOTIFICATIONS)}
                  className="transition-modern hover:bg-accent/50"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onViewChange(ViewType.THEMES)}
                  className="transition-modern hover:bg-accent/50"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Thèmes
                </DropdownMenuItem>
                <DropdownMenuItem className="transition-modern hover:bg-accent/50">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
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
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <div className="md:hidden pb-4 animate-fade-in">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher des chaînes..."
                value={searchValue}
                onChange={handleSearchChange}
                className="search-input pl-10 pr-4 w-full"
              />
            </div>
          </form>
        </div>

        {/* Menu mobile ouvert */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 glass animate-slide-in">
            <div className="py-4 space-y-1">
              {navigationItems.map((item) => {
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onViewChange(ViewType.PLAYLISTS);
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-item w-full justify-start flex items-center space-x-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Gérer les playlists</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onViewChange(ViewType.ANALYTICS);
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-item w-full justify-start flex items-center space-x-3"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onViewChange(ViewType.NOTIFICATIONS);
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-item w-full justify-start flex items-center space-x-3"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onViewChange(ViewType.THEMES);
                    setIsMobileMenuOpen(false);
                  }}
                  className="nav-item w-full justify-start flex items-center space-x-3"
                >
                  <Palette className="h-4 w-4" />
                  <span>Thèmes</span>
                </Button>
                
                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-modern">
                  <div className="flex items-center space-x-3">
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span className="text-sm">Mode sombre</span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

