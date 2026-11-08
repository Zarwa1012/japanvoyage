import { createBrowserClient } from '@supabase/ssr';
import { getCleanSupabaseUrl } from '@/lib/utils';

export function createClient() {
  const supabaseUrl =
    getCleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    'https://placeholder-domain.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder_anon_key_for_static_prerendering';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
