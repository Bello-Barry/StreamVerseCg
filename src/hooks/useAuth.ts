import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Hook d'authentification personnalisé pour gérer l'état de l'utilisateur
 * et les actions d'authentification avec Supabase.
 */
export const useAuth = () => {
  // L'utilisateur authentifié
  const [user, setUser] = useState<User | null>(null);
  
  // État de chargement global pour les requêtes d'authentification
  const [loading, setLoading] = useState(true);
  
  // État d'erreur pour les actions d'authentification
  const [error, setError] = useState<AuthError | null>(null);

  /**
   * Effet pour écouter les changements d'état d'authentification.
   * Cette méthode est plus fiable que la vérification initiale asynchrone.
   */
  useEffect(() => {
    // Vérifie la session initiale
    const checkUser = async () => {
      setLoading(true);
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      setUser(initialUser);
      setLoading(false);
    };

    checkUser();

    // Écoute les changements d'état d'authentification en temps réel
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setError(null);
      setLoading(false);
    });

    // Nettoyage de l'abonnement lors du démontage du composant
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Action de connexion avec email et mot de passe.
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        throw authError;
      }
      toast.success('Connexion réussie !');
    } catch (err) {
      setError(err as AuthError);
      toast.error('Erreur de connexion', {
        description: (err as AuthError).message
      });
      throw err; // Permet de propager l'erreur pour une gestion côté composant
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Action d'inscription avec email et mot de passe.
   */
  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        throw authError;
      }
      toast.success('Inscription réussie ! Veuillez vérifier votre email.');
    } catch (err) {
      setError(err as AuthError);
      toast.error('Erreur d\'inscription', {
        description: (err as AuthError).message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Action de connexion par lien magique (OTP).
   */
  const signInWithMagicLink = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ email });
      if (authError) {
        throw authError;
      }
      toast.info('Lien magique envoyé. Vérifiez votre boîte de réception !');
    } catch (err) {
      setError(err as AuthError);
      toast.error('Erreur lors de l\'envoi du lien', {
        description: (err as AuthError).message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Action de déconnexion.
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.info('Vous avez été déconnecté.');
    } catch (err) {
      setError(err as AuthError);
      toast.error('Erreur lors de la déconnexion', {
        description: (err as AuthError).message
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    user, 
    loading, 
    error,
    signIn, 
    signUp, 
    signOut,
    signInWithMagicLink,
  };
};

