import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Next.js App Router Route Handler for Supabase Auth OAuth callbacks (Google, etc.)
// Exchanging the PKCE authorization code for persistent session cookies.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Forward to requested target route or default to /account
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Error exchanging OAuth code for session:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
}
