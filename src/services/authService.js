import { supabase } from '../lib/supabase';

const translateAuthError = (error) => {
  if (!error) return "Error desconocido";
  const msg = error.message || error.error_description || "";
  
  const translations = {
    "Invalid login credentials": "Usuario o contraseña incorrectos.",
    "User already registered": "Este correo electrónico ya está registrado.",
    "Email not confirmed": "Debes confirmar tu correo electrónico antes de iniciar sesión.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
    "To help protect your account, please sign in again.": "Por seguridad, por favor inicia sesión de nuevo.",
    "Email link is invalid or has expired": "El enlace de confirmación es inválido o ha caducado.",
    "User not found": "No existe una cuenta con ese correo electrónico."
  };

  return translations[msg] || "Error en la autenticación. Por favor, inténtalo de nuevo.";
};

export const authService = {
  // Login with email and password
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      error.message = translateAuthError(error);
      throw error;
    }
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
    if (error) {
      error.message = translateAuthError(error);
      throw error;
    }
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
