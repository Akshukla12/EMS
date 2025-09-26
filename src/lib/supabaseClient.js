import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

// A robust check to see if the URL is a valid Supabase URL
const isValidSupabaseUrl = (url) => {
  if (!url || url.startsWith('YOUR_') || !url.includes('supabase.co')) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

if (isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey && !supabaseAnonKey.startsWith('YOUR_')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error.message);
    supabase = null;
  }
}

if (!supabase) {
    console.warn(
      'Supabase credentials are not configured correctly or are missing in your .env file. Authentication features will be disabled. Please provide a valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
}

export { supabase };
