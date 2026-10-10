import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Publishable/Anon Key is missing in environment variables.');
  }
  return createClient(supabaseUrl, supabaseKey);
}
