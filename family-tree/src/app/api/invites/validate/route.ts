import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from('invites')
    .select('id, email, status, expires_at')
    .eq('token', token)
    .single();

  if (!data || data.status !== 'pending' || new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: data.email });
}
