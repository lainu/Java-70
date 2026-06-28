import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 60;

export async function GET() {
  const admin = createAdminClient();

  const [{ data: persons }, { data: relationships }, { data: houses }] = await Promise.all([
    admin.from('persons').select('*').order('generation_number', { ascending: true, nullsFirst: false }),
    admin.from('relationships').select('*'),
    admin.from('houses').select('*'),
  ]);

  return NextResponse.json({
    persons: persons ?? [],
    relationships: relationships ?? [],
    houses: houses ?? [],
  });
}
