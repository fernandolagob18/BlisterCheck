import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotification, setAuthNotification] = useState(null);

  useEffect(() => {
    let subscription = null;

    const fetchSession = async () => {
      try {
        const hasCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!hasCredentials) {
          console.warn('Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) missing. Running in demo mode.');
          setLoading(false);
          return;
        }

        // Comprobar si hay errores en el hash de la URL (ej: token de confirmación caducado)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const errorDesc = hashParams.get('error_description');
          if (errorDesc) {
            setAuthNotification({ type: 'error', message: decodeURIComponent(errorDesc.replace(/\+/g, ' ')) });
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else if (data?.session) {
          setSession(data.session);
          setUser(data.session.user ?? null);
          await loadProfile(data.session.user.id);
        }

        const { data: listenerData } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // INITIAL_SESSION ya se manejó arriba con getSession(), evitamos carga doble
              if (event !== 'INITIAL_SESSION') {
                await loadProfile(session.user.id);
              }
              if (event === 'SIGNED_IN') {
                setAuthNotification({ type: 'success', message: '¡Sesión iniciada correctamente!' });
                if (typeof window !== 'undefined' && window.location.hash) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }
            } else {
              setProfile(null);
            }
            setLoading(false);
          }
        );
        subscription = listenerData?.subscription;
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId) => {
    try {
      const data = await authService.getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const clearAuthNotification = () => setAuthNotification(null);

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    authNotification,
    clearAuthNotification,
    setProfile,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
