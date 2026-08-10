import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else if (data?.session) {
          setSession(data.session);
          setUser(data.session.user ?? null);
          await loadProfile(data.session.user.id);
        }

        const { data: listenerData } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await loadProfile(session.user.id);
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

  const value = {
    user,
    session,
    profile,
    loading,
    setProfile
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
