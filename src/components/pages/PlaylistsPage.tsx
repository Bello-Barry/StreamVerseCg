'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Download, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { PlaylistFormData, Playlist } from '@/types';
import { toast } from 'sonner';

// Schéma de validation Zod
const playlistSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  url: z.string().url('URL invalide').optional().or(z.literal('')),
  type: z.enum(['url', 'file', 'xtream']),
  description: z.string().max(500, 'Description trop longue').optional(),
  xtreamServer: z.string().optional(),
  xtreamUsername: z.string().optional(),
  xtreamPassword: z.string().optional()
});

const PlaylistsPage: React.FC = () => {
  const { 
    playlists, 
    loading, 
    error,
    addPlaylist, 
    updatePlaylist, 
    removePlaylist, 
    togglePlaylistStatus,
    refreshPlaylist,
    refreshPlaylists
  } = usePlaylistStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: '',
      url: '',
      type: 'url',
      description: '',
      xtreamServer: '',
      xtreamUsername: '',
      xtreamPassword: ''
    }
  });

  const watchType = form.watch('type');

  const handleSubmit = async (data: PlaylistFormData) => {
    try {
      const playlistData = {
        ...data,
        content: data.type === 'file' ? fileContent : undefined,
        xtreamConfig: data.type === 'xtream' ? {
          server: data.xtreamServer || '',
          username: data.xtreamUsername || '',
          password: data.xtreamPassword || ''
        } : undefined
      };

      if (editingPlaylist) {
        updatePlaylist(editingPlaylist.id, playlistData);
        toast.success('Playlist mise à jour avec succès');
      } else {
        await addPlaylist(playlistData);
        toast.success('Playlist ajoutée avec succès');
      }

      setIsDialogOpen(false);
      setEditingPlaylist(null);
      form.reset();
      setFileContent('');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde de la playlist');
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    form.reset({
      name: playlist.name,
      url: playlist.url || '',
      type: playlist.type,
      description: playlist.description || '',
      xtreamServer: playlist.xtreamConfig?.server || '',
      xtreamUsername: playlist.xtreamConfig?.username || '',
      xtreamPassword: playlist.xtreamConfig?.password || ''
    });
    if (playlist.content) {
      setFileContent(playlist.content);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (playlist: Playlist) => {
    if (playlist.isRemovable === false) {
      toast.error('Cette playlist ne peut pas être supprimée car elle est protégée.');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la playlist "${playlist.name}" ?`)) {
      removePlaylist(playlist.id);
      toast.success('Playlist supprimée');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      
      // Auto-remplir le nom si vide
      if (!form.getValues('name')) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        form.setValue('name', fileName);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'error':
        return 'Erreur';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Inconnu';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default';
      case 'error':
        return 'destructive';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Gestion des Playlists
          </h1>
          <p className="text-muted-foreground mt-1">
            {playlists.length} playlist{playlists.length > 1 ? 's' : ''} configurée{playlists.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 animate-slide-in">
          <Button
            variant="outline"
            onClick={refreshPlaylists}
            disabled={loading}
            className="flex items-center space-x-2 transition-modern hover-lift"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 gradient-primary hover-glow transition-modern">
                <Plus className="h-4 w-4" />
                <span>Ajouter une playlist</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl glass border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingPlaylist ? 'Modifier la playlist' : 'Ajouter une nouvelle playlist'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom de la playlist</label>
                  <Input
                    {...form.register('name')}
                    placeholder="Ex: Chaînes françaises"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Type de source</label>
                  <Select
                    value={watchType}
                    onValueChange={(value: 'url' | 'file' | 'xtream') => form.setValue('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL M3U/M3U8</SelectItem>
                      <SelectItem value="file">Fichier local</SelectItem>
                      <SelectItem value="xtream">Xtream Codes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {watchType === 'url' ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL de la playlist</label>
                    <Input
                      {...form.register('url')}
                      placeholder="https://example.com/playlist.m3u"
                      type="url"
                    />
                    {form.formState.errors.url && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.url.message}
                      </p>
                    )}
                  </div>
                ) : watchType === 'xtream' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Serveur Xtream</label>
                      <Input
                        {...form.register('xtreamServer')}
                        placeholder="http://server:port"
                        type="url"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Exemple: http://example.com:8080
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nom d'utilisateur</label>
                        <Input
                          {...form.register('xtreamUsername')}
                          placeholder="username"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Mot de passe</label>
                        <Input
                          {...form.register('xtreamPassword')}
                          placeholder="password"
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fichier M3U</label>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="w-full flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Choisir un fichier M3U</span>
                      </Button>
                      
                      <input
                        id="file-upload"
                        type="file"
                        accept=".m3u,.m3u8"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {fileContent && (
                        <Textarea
                          value={fileContent}
                          onChange={(e) => setFileContent(e.target.value)}
                          placeholder="Contenu du fichier M3U..."
                          rows={6}
                          className="font-mono text-sm"
                        />
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description (optionnel)</label>
                  <Textarea
                    {...form.register('description')}
                    placeholder="Description de la playlist..."
                    rows={3}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingPlaylist(null);
                      form.reset();
                      setFileContent('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingPlaylist ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des playlists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist, index) => (
          <Card 
            key={playlist.id} 
            className="playlist-card hover:shadow-modern-lg transition-modern"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">{playlist.name}</CardTitle>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(playlist.status)}
                  <Badge 
                    variant={getStatusVariant(playlist.status)}
                    className={`status-badge ${
                      playlist.status === 'active' ? 'status-active' :
                      playlist.status === 'inactive' ? 'status-inactive' : 'status-error'
                    }`}
                  >
                    {getStatusText(playlist.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informations */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">
                    {playlist.type === 'url' ? 'URL' : 
                     playlist.type === 'xtream' ? 'Xtream' : 'Fichier'}
                  </Badge>
                </div>
                
                {playlist.channelCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chaînes:</span>
                    <span className="font-medium">{playlist.channelCount}</span>
                  </div>
                )}
                
                {playlist.lastUpdate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mise à jour:</span>
                    <span className="text-xs">
                      {new Date(playlist.lastUpdate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                
                {(playlist.url || playlist.xtreamConfig) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="text-xs truncate max-w-32" title={playlist.url || playlist.xtreamConfig?.server}>
                      {playlist.url ? new URL(playlist.url).hostname : 
                       playlist.xtreamConfig ? new URL(playlist.xtreamConfig.server).hostname : ''}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePlaylistStatus(playlist.id)}
                  className="flex items-center space-x-1 transition-modern hover:bg-accent/50"
                >
                  {playlist.status === 'active' ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Désactiver</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Activer</span>
                    </>
                  )}
                </Button>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshPlaylist(playlist.id)}
                    disabled={loading}
                    className="transition-modern hover:bg-accent/50"
                    title="Actualiser la playlist"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(playlist)}
                    className="transition-modern hover:bg-accent/50"
                    title="Modifier la playlist"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {playlist.isRemovable !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(playlist)}
                      className="text-red-600 hover:text-red-700 transition-modern hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Supprimer la playlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucune playlist */}
      {playlists.length === 0 && (
        <div className="text-center py-12">
          <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune playlist configurée</h3>
          <p className="text-muted-foreground mb-6">
            Ajoutez votre première playlist pour commencer à regarder des chaînes IPTV.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            Ajouter une playlist
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;

