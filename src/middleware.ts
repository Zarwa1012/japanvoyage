import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCleanSupabaseUrl } from '@/lib/utils';

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabaseUrl =
      getCleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      'https://odqwncpvwxfyspixvekf.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_EUATZdfRNr-kzkBZyrHbCA_r8corwtD';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protect /account from unauthenticated users
    if (pathname.startsWith('/account')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Protect /admin from unauthenticated users
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return response;
  } catch (err) {
    console.error('Middleware execution error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
