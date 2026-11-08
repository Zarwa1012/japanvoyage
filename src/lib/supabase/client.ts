import { createBrowserClient } from '@supabase/ssr';
import { getCleanSupabaseUrl } from '@/lib/utils';

export function createClient() {
  const supabaseUrl = getCleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
