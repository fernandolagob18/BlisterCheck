import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.trim().replace(/\/+$|\/rest\/v1\/?$/gi, '');
}
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

