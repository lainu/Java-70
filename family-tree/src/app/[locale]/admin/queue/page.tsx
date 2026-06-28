import { createAdminClient } from '@/lib/supabase/admin';
import PendingChangeCard from '@/components/admin/PendingChangeCard';

export const dynamic = 'force-dynamic';

export default async function AdminQueuePage() {
  const admin = createAdminClient();

  const { data: changes } = await admin
    .from('pending_changes')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Approval Queue</h1>
      {!changes?.length ? (
        <p className="text-muted-foreground">No pending submissions.</p>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => (
            <PendingChangeCard key={change.id} change={change} />
          ))}
        </div>
      )}
    </div>
  );
}
