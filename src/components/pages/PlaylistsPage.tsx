// src/components/pages/PlaylistsPage.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { PlaylistFormData, Playlist, PlaylistStatus } from '@/types';
import { toast } from 'sonner';

const playlistSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.').max(100),
  type: z.enum(['url', 'file', 'xtream']),
  url: z.string().optional(),
  description: z.string().max(500).optional(),
  xtreamServer: z.string().optional(),
  xtreamUsername: z.string().optional(),
  xtreamPassword: z.string().optional(),
}).refine(
  (data) => data.type !== 'url' || (data.url && z.string().url().safeParse(data.url).success),
  {
    message: 'Une URL valide est requise pour le type URL.',
    path: ['url'],
  }
);

const PlaylistsPage: React.FC = () => {
  const {
    playlists,
    loading,
    addPlaylist,
    updatePlaylist,
    removePlaylist,
    togglePlaylistStatus,
    refreshPlaylist,
    refreshPlaylists,
  } = usePlaylistStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: { name: '', url: '', type: 'url', description: '', xtreamServer: '', xtreamUsername: '', xtreamPassword: '' },
  });

  const watchType = form.watch('type');

  const resetFormAndState = useCallback(() => {
    form.reset({ name: '', url: '', type: 'url', description: '', xtreamServer: '', xtreamUsername: '', xtreamPassword: '' });
    setEditingPlaylist(null);
    setFileContent('');
    setIsDialogOpen(false);
  }, [form]);

  const handleSubmit = useCallback(async (data: PlaylistFormData) => {
    try {
      const playlistData: Omit<Playlist, 'id'> = {
        name: data.name,
        type: data.type,
        url: data.url,
        description: data.description,
        content: data.type === 'file' ? fileContent : undefined,
        xtreamConfig: data.type === 'xtream'
          ? {
              server: data.xtreamServer || '',
              username: data.xtreamUsername || '',
              password: data.xtreamPassword || '',
            }
          : undefined,
        status: editingPlaylist?.status ?? PlaylistStatus.INACTIVE,
        channelCount: 0,
        
        isRemovable: true,
      };

      if (editingPlaylist) {
        await updatePlaylist(editingPlaylist.id, playlistData);
        toast.success(`La playlist "${data.name}" a été mise à jour.`);
      } else {
        await addPlaylist(playlistData);
        toast.success(`La playlist "${data.name}" a été ajoutée.`);
      }

      resetFormAndState();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde", {
        description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
      });
    }
  }, [editingPlaylist, fileContent, updatePlaylist, addPlaylist, resetFormAndState]);

  const handleEdit = useCallback((playlist: Playlist) => {
    setEditingPlaylist(playlist);
    form.reset({
      name: playlist.name,
      url: playlist.url || '',
      type: playlist.type,
      description: playlist.description || '',
      xtreamServer: playlist.xtreamConfig?.server || '',
      xtreamUsername: playlist.xtreamConfig?.username || '',
      xtreamPassword: playlist.xtreamConfig?.password || '',
    });
    if (playlist.content) setFileContent(playlist.content);
    setIsDialogOpen(true);
  }, [form]);

  const confirmDelete = useCallback(async () => {
    if (!playlistToDelete) return;
    try {
      await removePlaylist(playlistToDelete.id);
      toast.success(`La playlist "${playlistToDelete.name}" a été supprimée.`);
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setPlaylistToDelete(null);
    }
  }, [playlistToDelete, removePlaylist]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      if (!form.getValues('name')) {
        form.setValue('name', file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [form]);

  useEffect(() => {
    if (!isDialogOpen) resetFormAndState();
  }, [isDialogOpen, resetFormAndState]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active': return { Icon: CheckCircle, text: 'Active', variant: 'default', color: 'text-green-500' };
      case 'error': return { Icon: XCircle, text: 'Erreur', variant: 'destructive', color: 'text-red-500' };
      case 'inactive': return { Icon: AlertCircle, text: 'Inactive', variant: 'secondary', color: 'text-yellow-500' };
      default: return { Icon: AlertCircle, text: 'Inconnu', variant: 'outline', color: 'text-gray-500' };
    }
  };
  
  // ✅ Mapping des variantes personnalisées vers celles autorisées par <Badge>
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    success: 'default',
    info: 'secondary',
    warning: 'destructive',
  }
  

  return (
    <div className="space-y-6">
 <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Playlists</h1>
          <p className="text-muted-foreground mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} configurée{playlists.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refreshPlaylists()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPlaylist ? 'Modifier la playlist' : 'Ajouter une playlist'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Nom de la playlist</label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Chaînes françaises" className="mt-1" />
                  {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="type" className="text-sm font-medium">Type de source</label>
                  <Select value={watchType} onValueChange={(v: 'url' | 'file' | 'xtream') => form.setValue('type', v)}>
                    <SelectTrigger id="type" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">URL M3U</SelectItem>
                      <SelectItem value="file">Fichier Local</SelectItem>
                      <SelectItem value="xtream">Xtream Codes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {watchType === 'url' && (
                  <div>
                    <label htmlFor="url" className="text-sm font-medium">URL de la playlist</label>
                    <Input id="url" {...form.register('url')} placeholder="https://example.com/playlist.m3u" type="url" className="mt-1" />
                    {form.formState.errors.url && <p className="text-sm text-red-500 mt-1">{form.formState.errors.url.message}</p>}
                  </div>
                )}
                {watchType === 'file' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fichier M3U</label>
                    <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('file-upload')?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Choisir un fichier
                    </Button>
                    <input id="file-upload" type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="hidden" />
                    {fileContent && <p className="text-sm text-muted-foreground mt-2">Fichier chargé. Vous pouvez modifier son contenu ci-dessous.</p>}
                    <Textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} placeholder="Le contenu du fichier M3U apparaîtra ici..." rows={5} />
                  </div>
                )}
                {watchType === 'xtream' && (
                  <div className="space-y-4 rounded-md border p-4">
                    <div>
                      <label htmlFor="xtreamServer" className="text-sm font-medium">Serveur Xtream</label>
                      <Input id="xtreamServer" {...form.register('xtreamServer')} placeholder="http://server:port" type="url" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="xtreamUsername" className="text-sm font-medium">Nom d'utilisateur</label>
                        <Input id="xtreamUsername" {...form.register('xtreamUsername')} placeholder="username" className="mt-1" />
                      </div>
                      <div>
                        <label htmlFor="xtreamPassword" className="text-sm font-medium">Mot de passe</label>
                        <Input id="xtreamPassword" {...form.register('xtreamPassword')} placeholder="password" type="password" className="mt-1" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="description" className="text-sm font-medium">Description (optionnel)</label>
                  <Textarea id="description" {...form.register('description')} placeholder="Quelques notes sur cette playlist..." rows={3} className="mt-1" />
                  {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="ghost" onClick={resetFormAndState}>Annuler</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                    {loading ? 'Sauvegarde...' : editingPlaylist ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => {
          const status = getStatusInfo(playlist.status);
          return (
            <Card key={playlist.id} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex-1 pr-2">{playlist.name}</CardTitle>
 <Badge variant={variantMap[status.variant] ?? 'default'}
                    className="flex-shrink-0"
                  >
                    <status.Icon className={`mr-1 h-3 w-3 ${status.color}`} />
                    {status.text}
                  </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Type:</span><span className="font-medium text-foreground capitalize">{playlist.type}</span></div>
                    <div className="flex justify-between"><span>Chaînes:</span><span className="font-medium text-foreground">{playlist.channelCount ?? 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Mise à jour:</span><span className="font-medium text-foreground">{playlist.lastUpdate ? new Date(playlist.lastUpdate).toLocaleDateString() : 'Jamais'}</span></div>
                  </div>
                </CardContent>
              </div>
              <div className="flex items-center justify-between p-4 border-t mt-4">
                <Button variant="ghost" size="sm" onClick={() => togglePlaylistStatus(playlist.id)}>
                  {playlist.status === 'active' ? 'Désactiver' : 'Activer'}
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => refreshPlaylist(playlist.id)} disabled={loading} title="Actualiser"><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(playlist)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                  {playlist.isRemovable !== false && (
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setPlaylistToDelete(playlist)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {playlists.length === 0 && !loading && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Aucune playlist pour le moment</h3>
          <p className="text-muted-foreground mb-4">Ajoutez votre première playlist pour commencer à explorer.</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Ajouter une playlist</Button>
        </div>
      )}

      <AlertDialog open={!!playlistToDelete} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette playlist ?</AlertDialogTitle>
            <AlertDialogDescription>
              La playlist "{playlistToDelete?.name}" sera supprimée définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
    </div>
  );
};

export default PlaylistsPage;