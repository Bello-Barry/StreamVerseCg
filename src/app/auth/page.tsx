'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // Import du hook de redirection
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Composant pour la page d'authentification (connexion/inscription).
 * Gère l'état local du formulaire et interagit avec le hook `useAuth` pour les actions.
 */
export default function AuthPage() {
  const { user, signIn, signUp, signOut, signInWithMagicLink, loading: authLoading } = useAuth();
  const router = useRouter(); // Initialisation du router pour la redirection
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  
  // Utilisation d'états de chargement spécifiques pour plus de clarté
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  /**
   * 💡 Redirection automatique une fois l'utilisateur authentifié.
   */
  useEffect(() => {
    // Si l'utilisateur est connecté et que le chargement initial est terminé
    if (user && !authLoading) {
      toast.success(`Bienvenue, ${user.email} !`, {
        description: "Redirection vers la page des films..."
      });
      // Redirection vers la page des films
      router.push('/movies');
    }
  }, [user, authLoading, router]); // Déclenchement à chaque changement de l'état `user` ou du chargement

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      // Le toast est maintenant géré dans le hook useAuth, pas besoin de le dupliquer ici.
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, signIn, signUp]);

  const handleMagicLinkSignIn = useCallback(async () => {
    setMagicLinkLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email);
    } catch (err: any) {
      // Le toast est également géré dans le hook useAuth ici.
      setError(err.message || 'Une erreur est survenue lors de l\'envoi du lien.');
    } finally {
      setMagicLinkLoading(false);
    }
  }, [email, signInWithMagicLink]);

  const buttonText = useMemo(() => {
    if (loading) return 'Chargement...';
    return mode === 'signIn' ? 'Se connecter' : "S'inscrire";
  }, [loading, mode]);

  const magicLinkButtonText = useMemo(() => {
    return magicLinkLoading ? 'Envoi...' : 'Se connecter par lien magique';
  }, [magicLinkLoading]);
  
  // Si l'utilisateur est en cours d'authentification ou est déjà connecté,
  // nous affichons un écran de chargement ou rien en attendant la redirection.
  if (authLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <h1 className="text-3xl font-bold mb-4 text-center">Chargement...</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Veuillez patienter pendant la vérification de votre session.
        </p>
      </div>
    );
  }

  // Affiche le formulaire de connexion/inscription si l'utilisateur n'est pas connecté
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {mode === 'signIn' ? 'Connexion à StreamVerse' : 'Créer un compte StreamVerse'}
      </h1>
      <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12 text-base"
        />
        <Input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          className="h-12 text-base"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <Button 
          type="submit" 
          disabled={loading || magicLinkLoading}
          className="h-12 text-lg font-semibold"
        >
          {buttonText}
        </Button>
      </form>
      
      <div className="flex items-center gap-2 w-full max-w-sm my-4">
        <div className="flex-grow border-t border-border" />
        <span className="text-sm text-muted-foreground">ou</span>
        <div className="flex-grow border-t border-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleMagicLinkSignIn}
        disabled={magicLinkLoading || loading || !email}
        className="w-full max-w-sm h-12 text-lg"
      >
        {magicLinkButtonText}
      </Button>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        {mode === 'signIn' ? (
          <>
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={() => setMode('signUp')}
              className="font-medium text-primary hover:underline transition-colors"
            >
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{' '}
            <button
              type="button"
              onClick={() => setMode('signIn')}
              className="font-medium text-primary hover:underline transition-colors"
            >
              Se connecter
            </button>
          </>
        )}
      </p>
    </div>
  );
}
