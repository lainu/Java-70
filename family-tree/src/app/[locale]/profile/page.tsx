import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    admin
      .from('pending_changes')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My Profile</h1>
      <p className="text-muted-foreground mb-6">{profile?.display_name ?? user.email}</p>

      <h2 className="text-lg font-semibold mb-3">My Submissions</h2>
      {!submissions?.length ? (
        <p className="text-muted-foreground text-sm">You have no submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {s.change_type.replace(/_/g, ' ')}
                </span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    s.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : s.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(s.created_at)}</p>
              {s.status === 'rejected' && s.rejection_reason && (
                <p className="text-xs text-destructive mt-2">Reason: {s.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
