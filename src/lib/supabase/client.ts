import { createBrowserClient } from '@supabase/ssr';
import { getCleanSupabaseUrl } from '@/lib/utils';

export function createClient() {
  const supabaseUrl =
    getCleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    'https://odqwncpvwxfyspixvekf.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_EUATZdfRNr-kzkBZyrHbCA_r8corwtD';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
