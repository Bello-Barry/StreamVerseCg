'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Upload, AlertCircle, CheckCircle, XCircle, Link, FileText, Wifi, Film } from 'lucide-react';
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
import { PlaylistFormData, Playlist, PlaylistStatus, PlaylistType } from '@/types';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

/**
 * Zod Schema pour la validation de la playlist.
 * Amélioré pour inclure la validation des URLs de torrent.
 */
const playlistSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.').max(100),
  type: z.nativeEnum(PlaylistType),
  url: z.string().optional(),
  description: z.string().max(500).optional(),
  xtreamServer: z.string().optional(),
  xtreamUsername: z.string().optional(),
  xtreamPassword: z.string().optional(),
}).refine(
  (data) => {
    // Valider l'URL pour les types URL et TORRENT
    if (data.type === PlaylistType.URL || data.type === PlaylistType.TORRENT) {
      return data.url && z.string().url().safeParse(data.url).success;
    }
    return true;
  },
  {
    message: 'Une URL valide est requise pour ce type de playlist.',
    path: ['url'],
  }
).refine(
  (data) => data.type !== PlaylistType.XTREAM || (data.xtreamServer && data.xtreamUsername && data.xtreamPassword),
  {
    message: 'Les identifiants Xtream sont requis pour le type Xtream.',
    path: ['xtreamServer'],
  }
);

// Fonctions utilitaires pour le composant
const getStatusInfo = (status: PlaylistStatus | string) => {
  switch (status) {
    case 'active': return { Icon: CheckCircle, text: 'Active', color: 'bg-green-500' };
    case 'error': return { Icon: XCircle, text: 'Erreur', color: 'bg-red-500' };
    case 'inactive': return { Icon: AlertCircle, text: 'Inactive', color: 'bg-yellow-500' };
    case 'loading': return { Icon: RefreshCw, text: 'Chargement...', color: 'bg-blue-500' };
    default: return { Icon: AlertCircle, text: 'Inconnu', color: 'bg-gray-500' };
  }
};

const getPlaylistIcon = (type: PlaylistType) => {
  switch (type) {
    case PlaylistType.URL: return <Link className="h-4 w-4" />;
    case PlaylistType.FILE: return <FileText className="h-4 w-4" />;
    case PlaylistType.XTREAM: return <Wifi className="h-4 w-4" />;
    case PlaylistType.TORRENT: return <Film className="h-4 w-4" />;
    default: return null;
  }
};

/**
 * Composant principal de la page de gestion des playlists.
 * @component
 * @returns {React.FC}
 */
const PlaylistsPage: React.FC = () => {
  const {
    playlists,
    loading,
    addPlaylist,
    updatePlaylist,
    removePlaylist,
    togglePlaylistStatus, // <-- Corrigé : La fonction est bien de retour.
    refreshPlaylist,
    refreshPlaylists,
  } = usePlaylistStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: '',
      url: '',
      type: PlaylistType.URL,
      description: '',
      xtreamServer: '',
      xtreamUsername: '',
      xtreamPassword: ''
    },
  });

  const watchType = form.watch('type');

  const resetFormAndState = useCallback(() => {
    form.reset({
      name: '',
      url: '',
      type: PlaylistType.URL,
      description: '',
      xtreamServer: '',
      xtreamUsername: '',
      xtreamPassword: ''
    });
    setEditingPlaylist(null);
    setFileContent('');
    setIsDialogOpen(false);
  }, [form]);

  const handleSubmit = useCallback(async (data: PlaylistFormData) => {
    try {
      const playlistData: Omit<Playlist, 'id' | 'lastUpdate' | 'channelCount' | 'isRemovable'> = {
        name: data.name,
        type: data.type,
        url: data.url,
        description: data.description,
        content: data.type === PlaylistType.FILE ? fileContent : undefined,
        xtreamConfig: data.type === PlaylistType.XTREAM
          ? {
              server: data.xtreamServer || '',
              username: data.xtreamUsername || '',
              password: data.xtreamPassword || '',
            }
          : undefined,
        status: editingPlaylist?.status ?? PlaylistStatus.INACTIVE,
      };

      if (editingPlaylist) {
        await updatePlaylist(editingPlaylist.id, playlistData);
        toast.success(`La playlist "${data.name}" a été mise à jour.`);
      } else {
        await addPlaylist(playlistData as any);
        toast.success(`La playlist "${data.name}" a été ajoutée.`);
      }

      resetFormAndState();
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
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
    reader.onerror = () => {
      toast.error("Erreur de lecture du fichier.", {
        description: "Veuillez réessayer ou vérifier que le fichier est valide."
      });
    }
    reader.readAsText(file);
    event.target.value = '';
  }, [form]);

  const handleRefreshClick = useCallback(async (id: string) => {
    toast.promise(refreshPlaylist(id), {
      loading: 'Actualisation de la playlist...',
      success: 'La playlist a été actualisée.',
      error: (err) => `Erreur lors de l'actualisation : ${err.message || 'erreur inconnue'}`,
    });
  }, [refreshPlaylist]);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    await refreshPlaylists();
    setIsRefreshingAll(false);
  }, [refreshPlaylists]);


  useEffect(() => {
    if (!isDialogOpen) resetFormAndState();
  }, [isDialogOpen, resetFormAndState]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Playlists</h1>
          <p className="text-muted-foreground mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} configurée{playlists.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={isRefreshingAll || loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingAll ? 'animate-spin' : ''}`} /> Actualiser tout
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
                {/* Champ Nom */}
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Nom de la playlist</label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Chaînes françaises" className="mt-1" />
                  {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
                </div>
                {/* Champ Type */}
                <div>
                  <label htmlFor="type" className="text-sm font-medium">Type de source</label>
                  <Select value={watchType} onValueChange={(v: PlaylistType) => form.setValue('type', v)}>
                    <SelectTrigger id="type" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PlaylistType.URL}>URL M3U / M3U8</SelectItem>
                      <SelectItem value={PlaylistType.FILE}>Fichier Local (.m3u)</SelectItem>
                      <SelectItem value={PlaylistType.XTREAM}>Xtream Codes</SelectItem>
                      <SelectItem value={PlaylistType.TORRENT}>Torrent (Lien ou Fichier)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sélectionnez le type de votre source de playlist.
                  </p>
                </div>
                {/* Champs dynamiques avec animations */}
                <AnimatePresence mode="wait">
                  {watchType === PlaylistType.URL && (
                    <motion.div key="url-form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                      <label htmlFor="url" className="text-sm font-medium">URL de la playlist</label>
                      <Input id="url" {...form.register('url')} placeholder="https://example.com/playlist.m3u" type="url" className="mt-1" />
                      {form.formState.errors.url && <p className="text-sm text-red-500 mt-1">{form.formState.errors.url.message}</p>}
                    </motion.div>
                  )}
                  {watchType === PlaylistType.FILE && (
                    <motion.div key="file-form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-2">
                      <label className="text-sm font-medium">Fichier M3U</label>
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> {fileContent ? 'Fichier chargé' : 'Choisir un fichier'}
                      </Button>
                      <input id="file-upload" type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="hidden" />
                      {fileContent && (
                        <Textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} placeholder="Le contenu du fichier M3U apparaîtra ici..." rows={5} />
                      )}
                    </motion.div>
                  )}
                  {watchType === PlaylistType.XTREAM && (
                    <motion.div key="xtream-form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4 rounded-md border p-4">
                      <div>
                        <label htmlFor="xtreamServer" className="text-sm font-medium">Serveur Xtream</label>
                        <Input id="xtreamServer" {...form.register('xtreamServer')} placeholder="http://server:port" type="url" className="mt-1" />
                        {form.formState.errors.xtreamServer && <p className="text-sm text-red-500 mt-1">{form.formState.errors.xtreamServer.message}</p>}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="xtreamUsername" className="text-sm font-medium">Nom d'utilisateur</label>
                          <Input id="xtreamUsername" {...form.register('xtreamUsername')} placeholder="username" className="mt-1" />
                          {form.formState.errors.xtreamUsername && <p className="text-sm text-red-500 mt-1">{form.formState.errors.xtreamUsername.message}</p>}
                        </div>
                        <div>
                          <label htmlFor="xtreamPassword" className="text-sm font-medium">Mot de passe</label>
                          <Input id="xtreamPassword" {...form.register('xtreamPassword')} placeholder="********" type="password" className="mt-1" />
                          {form.formState.errors.xtreamPassword && <p className="text-sm text-red-500 mt-1">{form.formState.errors.xtreamPassword.message}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {watchType === PlaylistType.TORRENT && (
                    <motion.div key="torrent-form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                      <label htmlFor="url" className="text-sm font-medium">Lien Torrent (magnet: ou URL)</label>
                      <Input id="url" {...form.register('url')} placeholder="magnet:?xt=urn:btih:..." type="url" className="mt-1" />
                      {form.formState.errors.url && <p className="text-sm text-red-500 mt-1">{form.formState.errors.url.message}</p>}
                      <p className="text-sm text-muted-foreground mt-2">
                        Collez ici un lien "magnet" ou une URL directe vers un fichier `.torrent`.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Champ Description */}
                <div>
                  <label htmlFor="description" className="text-sm font-medium">Description (optionnel)</label>
                  <Textarea id="description" {...form.register('description')} placeholder="Quelques notes sur cette playlist..." rows={3} className="mt-1" />
                  {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="ghost" onClick={resetFormAndState}>Annuler</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting || loading}>
                    {form.formState.isSubmitting ? 'Sauvegarde...' : editingPlaylist ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      <AnimatePresence mode="wait">
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => {
            const statusInfo = getStatusInfo(playlist.status);
            return (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-row items-center justify-between p-4 pb-2">
                    <div className="flex items-center space-x-2">
                       <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.color}`} />
                       <CardTitle className="text-lg font-semibold truncate flex-1">
                         {playlist.name}
                       </CardTitle>
                    </div>
                     <Badge variant="secondary" className="flex items-center space-x-1">
                      {getPlaylistIcon(playlist.type)}
                       <span>{playlist.type.toUpperCase()}</span>
                     </Badge>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-0 text-sm text-muted-foreground space-y-2">
                    <p>{playlist.description || 'Aucune description fournie.'}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Chaînes: {playlist.channelCount}</span>
                      <span>Mise à jour: {playlist.lastUpdate ? new Date(playlist.lastUpdate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-between p-4 border-t mt-auto">
                    <Button variant="ghost" size="sm" onClick={() => togglePlaylistStatus(playlist.id)} disabled={loading}>
                      {playlist.status === PlaylistStatus.ACTIVE ? 'Désactiver' : 'Activer'}
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleRefreshClick(playlist.id)} disabled={loading} title="Actualiser"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(playlist)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                      {playlist.isRemovable !== false && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10" onClick={() => setPlaylistToDelete(playlist)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {playlists.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full">
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Aucune playlist pour le moment</h3>
                <p className="text-muted-foreground mb-4">Ajoutez votre première playlist pour commencer à explorer.</p>
                <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Ajouter une playlist</Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <AlertDialog open={!!playlistToDelete} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette playlist ?</AlertDialogTitle>
            <AlertDialogDescription>
              La playlist "<span className="font-semibold">{playlistToDelete?.name}</span>" sera supprimée définitivement. Cette action est irréversible.
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
