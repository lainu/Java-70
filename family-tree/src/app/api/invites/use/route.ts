import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const { token, userId } = await request.json();
  if (!token || !userId) return NextResponse.json({ ok: false });

  const admin = createAdminClient();

  await admin
    .from('invites')
    .update({ status: 'used', used_by: userId })
    .eq('token', token)
    .eq('status', 'pending');

  return NextResponse.json({ ok: true });
}
