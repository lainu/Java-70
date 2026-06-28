import { createAdminClient } from '@/lib/supabase/admin';
import FamilyTreeCanvas from '@/components/tree/FamilyTreeCanvas';

export const revalidate = 60;

export default async function TreePage() {
  const admin = createAdminClient();

  const [{ data: persons }, { data: relationships }, { data: houses }] = await Promise.all([
    admin.from('persons').select('*'),
    admin.from('relationships').select('*'),
    admin.from('houses').select('*'),
  ]);

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden relative">
      <FamilyTreeCanvas
        initialPersons={persons ?? []}
        initialRelationships={relationships ?? []}
        initialHouses={houses ?? []}
      />
    </div>
  );
}
