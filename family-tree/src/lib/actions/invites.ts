'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createInvite(email?: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) throw new Error('Forbidden');

  const { data, error } = await admin
    .from('invites')
    .insert({ created_by: user.id, email: email || null })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create invite');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return {
    invite: data,
    link: `${appUrl}/en/auth/register?token=${data.token}`,
  };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) throw new Error('Forbidden');

  await admin.from('invites').update({ status: 'revoked' }).eq('id', inviteId);
}
