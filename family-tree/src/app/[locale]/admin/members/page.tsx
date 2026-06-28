import { createAdminClient } from '@/lib/supabase/admin';
import PersonForm from '@/components/person/PersonForm';

export default async function AdminMembersPage() {
  const admin = createAdminClient();

  const [{ data: persons }, { data: houses }] = await Promise.all([
    admin.from('persons').select('id, name_en, name_ml, generation_number'),
    admin.from('houses').select('id, name_en, name_ml'),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Member Directly</h1>
      <p className="text-muted-foreground mb-6">
        As an admin you can add members directly without going through the approval queue.
      </p>
      <PersonForm
        mode="admin-add"
        allPersons={persons ?? []}
        houses={houses ?? []}
      />
    </div>
  );
}
