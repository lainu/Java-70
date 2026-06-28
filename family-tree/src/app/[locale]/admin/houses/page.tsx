import { createAdminClient } from '@/lib/supabase/admin';
import HouseManager from '@/components/admin/HouseManager';

export const dynamic = 'force-dynamic';

export default async function AdminHousesPage() {
  const admin = createAdminClient();
  const { data: houses } = await admin.from('houses').select('*').order('name_en');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Houses</h1>
      <HouseManager houses={houses ?? []} />
    </div>
  );
}
