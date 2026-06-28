import { createAdminClient } from '@/lib/supabase/admin';
import InviteGenerator from '@/components/admin/InviteGenerator';

export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
  const admin = createAdminClient();

  const { data: invites } = await admin
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Invites</h1>
      <InviteGenerator invites={invites ?? []} />
    </div>
  );
}
