'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import type { PersonFormValues } from '@/lib/validations/person';

type AdminClient = ReturnType<typeof createAdminClient>;

async function resolvePersonRefs(
  refs: string[],
  admin: AdminClient,
  userId: string
): Promise<string[]> {
  const resolved: string[] = [];
  for (const ref of refs) {
    if (ref.startsWith('new:')) {
      const name = ref.slice(4).trim();
      if (!name) continue;
      const { data, error } = await admin
        .from('persons')
        .insert({ name_en: name, gender: 'unknown', is_alive: true, created_by: userId, approved_by: userId })
        .select('id')
        .single();
      if (error || !data) throw new Error(`Failed to create person "${name}": ${error?.message}`);
      resolved.push(data.id);
    } else {
      resolved.push(ref);
    }
  }
  return resolved;
}

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
    const { parent_ids, spouse_ids, child_ids, ...personData } = payload as PersonFormValues & {
      parent_ids: string[];
      spouse_ids: string[];
      child_ids: string[];
    };

    const { data: newPerson, error: insertError } = await admin
      .from('persons')
      .insert({ ...personData, approved_by: user.id })
      .select()
      .single();

    if (insertError || !newPerson) throw new Error(insertError?.message ?? 'Insert failed');

    const resolvedParents = await resolvePersonRefs(parent_ids ?? [], admin, user.id);
    const resolvedSpouses = await resolvePersonRefs(spouse_ids ?? [], admin, user.id);
    const resolvedChildren = await resolvePersonRefs(child_ids ?? [], admin, user.id);

    if (resolvedParents.length) {
      await admin.from('relationships').insert(
        resolvedParents.map((parentId: string) => ({
          person_a_id: parentId,
          person_b_id: newPerson.id,
          relationship_type: 'biological_child' as const,
        }))
      );

      if (resolvedParents.length === 2) {
        const [p1, p2] = resolvedParents;
        const { data: existing } = await admin
          .from('relationships')
          .select('id')
          .or(`and(person_a_id.eq.${p1},person_b_id.eq.${p2}),and(person_a_id.eq.${p2},person_b_id.eq.${p1})`)
          .eq('relationship_type', 'spouse')
          .maybeSingle();
        if (!existing) {
          await admin.from('relationships').insert({
            person_a_id: p1,
            person_b_id: p2,
            relationship_type: 'spouse' as const,
          });
        }
      }
    }

    if (resolvedSpouses.length) {
      await admin.from('relationships').insert(
        resolvedSpouses.map((spouseId: string) => ({
          person_a_id: newPerson.id,
          person_b_id: spouseId,
          relationship_type: 'spouse' as const,
        }))
      );
    }

    if (resolvedChildren.length) {
      await admin.from('relationships').insert(
        resolvedChildren.map((childId: string) => ({
          person_a_id: newPerson.id,
          person_b_id: childId,
          relationship_type: 'biological_child' as const,
        }))
      );
    }

    await admin.rpc('recalculate_generations');
  } else if (change.change_type === 'edit_person') {
    if (!change.target_person_id) throw new Error('No target person');
    const { parent_ids: _p, spouse_ids: _s, child_ids: _c, ...personData } = payload as Record<string, unknown>;

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
