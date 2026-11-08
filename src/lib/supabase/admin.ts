import { createClient } from '@supabase/supabase-js';
import { getCleanSupabaseUrl } from '@/lib/utils';

// SERVER-ONLY admin client that bypasses Row Level Security (RLS)
// Strictly used in verified webhook callbacks and atomic inventory mutations.
export function createAdminClient() {
  const supabaseUrl = getCleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Secret/Service Role Key in environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
