import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase isn't configured, we can't check for a session.
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check for an active session on initial load
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'user',
          name: session.user.user_metadata?.name || session.user.email,
        };
        setUser(appUser);
      }
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const appUser = session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role || 'user',
        name: session.user.user_metadata?.name || session.user.email,
      } : null;
      setUser(appUser);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service is not configured. Please check your credentials.' };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  };

  const signUp = async (name, email, password, role) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service is not configured.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { success: true, requiresConfirmation: true };
    }

    return { success: true, requiresConfirmation: false };
  };

  const logout = async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    }
    // onAuthStateChange will handle setting user to null
  };

  const value = {
    user,
    login,
    signUp,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
