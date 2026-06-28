import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { routing } from '@/i18n/routing';
import type { Database } from '@/types/database';

const intlMiddleware = createMiddleware(routing);

const ADMIN_PATHS = ['/admin'];
const AUTH_REQUIRED_PATHS = ['/person/new', '/person'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix for path matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ml)/, '') || '/';

  const isAdminPath = ADMIN_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));
  const isEditPath =
    pathnameWithoutLocale.startsWith('/person/') && pathnameWithoutLocale.endsWith('/edit');
  const isNewPersonPath = pathnameWithoutLocale === '/person/new';
  const isAuthRequired = isAdminPath || isEditPath || isNewPersonPath;

  if (isAuthRequired) {
    let response = NextResponse.next({ request });

    // Cast needed: @supabase/ssr@0.5.2 types misaligned with supabase-js@2.108.2
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    ) as unknown as SupabaseClient<Database>;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const locale = pathname.match(/^\/(en|ml)/)?.[1] ?? 'en';
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);

    if (!user) {
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminPath) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL(`/${locale}/tree`, request.url));
      }
    }

    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
