'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PersonFormValues } from '@/lib/validations/person';

/** Admin-only: add a person directly without the approval queue. */
export async function addPersonDirect(values: PersonFormValues) {
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

  const { parent_ids, spouse_ids, ...personData } = values;

  const { data: newPerson, error } = await admin
    .from('persons')
    .insert({ ...personData, created_by: user.id, approved_by: user.id })
    .select()
    .single();

  if (error || !newPerson) throw new Error(error?.message ?? 'Insert failed');

  if (parent_ids?.length) {
    await admin.from('relationships').insert(
      parent_ids.map((parentId) => ({
        person_a_id: parentId,
        person_b_id: newPerson.id,
        relationship_type: 'biological_child' as const,
      }))
    );
  }

  if (spouse_ids?.length) {
    await admin.from('relationships').insert(
      spouse_ids.map((spouseId) => ({
        person_a_id: newPerson.id,
        person_b_id: spouseId,
        relationship_type: 'spouse' as const,
      }))
    );
  }

  await admin.rpc('recalculate_generations');

  revalidatePath('/en/tree');
  revalidatePath('/ml/tree');

  return newPerson;
}
