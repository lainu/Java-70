'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const { parent_ids, spouse_ids, child_ids, ...personData } = values;

  const { data: newPerson, error } = await admin
    .from('persons')
    .insert({ ...personData, created_by: user.id, approved_by: user.id })
    .select()
    .single();

  if (error || !newPerson) throw new Error(error?.message ?? 'Insert failed');

  const resolvedParents = await resolvePersonRefs(parent_ids ?? [], admin, user.id);
  const resolvedSpouses = await resolvePersonRefs(spouse_ids ?? [], admin, user.id);
  const resolvedChildren = await resolvePersonRefs(child_ids ?? [], admin, user.id);

  if (resolvedParents.length) {
    await admin.from('relationships').insert(
      resolvedParents.map((parentId) => ({
        person_a_id: parentId,
        person_b_id: newPerson.id,
        relationship_type: 'biological_child' as const,
      }))
    );

    // Auto-link two parents as spouses so the tree layout engine can pair them
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
      resolvedSpouses.map((spouseId) => ({
        person_a_id: newPerson.id,
        person_b_id: spouseId,
        relationship_type: 'spouse' as const,
      }))
    );
  }

  if (resolvedChildren.length) {
    await admin.from('relationships').insert(
      resolvedChildren.map((childId) => ({
        person_a_id: newPerson.id,
        person_b_id: childId,
        relationship_type: 'biological_child' as const,
      }))
    );
  }

  await admin.rpc('recalculate_generations');

  revalidatePath('/en/tree');
  revalidatePath('/ml/tree');

  return newPerson;
}

/** Admin-only: update a person directly without the approval queue. Replaces all relationships. */
export async function updatePersonDirect(personId: string, values: PersonFormValues) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) throw new Error('Forbidden');

  const { parent_ids, spouse_ids, child_ids, ...personData } = values;

  const { error } = await admin
    .from('persons')
    .update({ ...personData, approved_by: user.id })
    .eq('id', personId);

  if (error) throw new Error(error.message);

  // Replace all relationships: delete then re-insert from form values
  await admin
    .from('relationships')
    .delete()
    .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`);

  const resolvedParents = await resolvePersonRefs(parent_ids ?? [], admin, user.id);
  const resolvedSpouses = await resolvePersonRefs(spouse_ids ?? [], admin, user.id);
  const resolvedChildren = await resolvePersonRefs(child_ids ?? [], admin, user.id);

  if (resolvedParents.length) {
    await admin.from('relationships').insert(
      resolvedParents.map((parentId) => ({
        person_a_id: parentId,
        person_b_id: personId,
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
      resolvedSpouses.map((spouseId) => ({
        person_a_id: personId,
        person_b_id: spouseId,
        relationship_type: 'spouse' as const,
      }))
    );
  }

  if (resolvedChildren.length) {
    await admin.from('relationships').insert(
      resolvedChildren.map((childId) => ({
        person_a_id: personId,
        person_b_id: childId,
        relationship_type: 'biological_child' as const,
      }))
    );
  }

  await admin.rpc('recalculate_generations');

  revalidatePath('/en/tree');
  revalidatePath('/ml/tree');
}
