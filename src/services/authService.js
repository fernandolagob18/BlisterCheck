import { supabase } from '../lib/supabase';

export const authService = {
  // Login with email and password
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Register a new user
  async register(email, password, nombre, hospital) {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          nombre,
          hospital
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // Logout current user
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get user profile (custom table)
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update profile
  async updateProfile(userId, updates) {
    if (!userId) throw new Error("No se ha proporcionado un ID de usuario válido para actualizar el perfil.");

    const { nombre, hospital } = updates;
    const safeUpdates = { nombre, hospital };

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Send password reset email
  async resetPassword(email) {
    // redirectTo apunta al origen actual para que funcione tanto en local como en producción
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  // Update password (must be authenticated)
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  },

  // Delete account (Calls an RPC function in Supabase)
  async deleteAccount() {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    // Sign out to clear local session data
    await supabase.auth.signOut();
  }
};
