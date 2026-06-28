import { createAdminClient } from '@/lib/supabase/admin';
import PersonForm from '@/components/person/PersonForm';

export default async function NewPersonPage() {
  const admin = createAdminClient();
  const [{ data: persons }, { data: houses }] = await Promise.all([
    admin.from('persons').select('id, name_en, name_ml, generation_number'),
    admin.from('houses').select('id, name_en, name_ml'),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Family Member</h1>
      <PersonForm
        mode="add"
        allPersons={persons ?? []}
        houses={houses ?? []}
      />
    </div>
  );
}
