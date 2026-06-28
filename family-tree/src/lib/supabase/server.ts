import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // Cast needed: @supabase/ssr@0.5.2 types are misaligned with supabase-js@2.108.2
  // (SupabaseClient gained a new SchemaNameOrClientOptions param, shifting Schema to wrong position)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies are read-only there
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
