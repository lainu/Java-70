'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import type { PersonFormValues } from '@/lib/validations/person';

export async function submitChange(
  changeType: 'add_person' | 'edit_person' | 'add_relationship' | 'remove_relationship',
  payload: Record<string, unknown>,
  targetPersonId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.from('pending_changes').insert({
    change_type: changeType,
    submitted_by: user.id,
    payload: payload as Json,
    target_person_id: targetPersonId ?? null,
    relationship_payload: null,
  });

  if (error) throw new Error(error.message);
}

export async function approveChange(changeId: string) {
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

  const { data: change, error: fetchError } = await admin
    .from('pending_changes')
    .select('*')
    .eq('id', changeId)
    .single();

  if (fetchError || !change) throw new Error('Change not found');
  if (change.status !== 'pending') throw new Error('Change is not pending');

  const payload = change.payload as Record<string, unknown>;

  if (change.change_type === 'add_person') {
    const { parent_ids, spouse_ids, ...personData } = payload as PersonFormValues & {
      parent_ids: string[];
      spouse_ids: string[];
    };

    const { data: newPerson, error: insertError } = await admin
      .from('persons')
      .insert({ ...personData, approved_by: user.id })
      .select()
      .single();

    if (insertError || !newPerson) throw new Error(insertError?.message ?? 'Insert failed');

    // Insert parent relationships
    if (parent_ids?.length) {
      await admin.from('relationships').insert(
        parent_ids.map((parentId: string) => ({
          person_a_id: parentId,
          person_b_id: newPerson.id,
          relationship_type: 'biological_child' as const,
        }))
      );
    }

    // Insert spouse relationships
    if (spouse_ids?.length) {
      await admin.from('relationships').insert(
        spouse_ids.map((spouseId: string) => ({
          person_a_id: newPerson.id,
          person_b_id: spouseId,
          relationship_type: 'spouse' as const,
        }))
      );
    }

    // Recalculate generation numbers
    await admin.rpc('recalculate_generations');
  } else if (change.change_type === 'edit_person') {
    if (!change.target_person_id) throw new Error('No target person');
    const { parent_ids: _p, spouse_ids: _s, ...personData } = payload as Record<string, unknown>;

    await admin
      .from('persons')
      .update({ ...personData, approved_by: user.id })
      .eq('id', change.target_person_id);
  }

  await admin
    .from('pending_changes')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', changeId);

  revalidatePath('/en/tree');
  revalidatePath('/ml/tree');
}

export async function rejectChange(changeId: string, reason: string) {
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

  await admin
    .from('pending_changes')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', changeId);
}
