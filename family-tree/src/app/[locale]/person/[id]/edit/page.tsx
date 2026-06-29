import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import PersonForm from '@/components/person/PersonForm';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: person }, { data: relationships }, { data: allPersons }, { data: houses }] =
    await Promise.all([
      admin.from('persons').select('*').eq('id', id).single(),
      admin.from('relationships').select('*').or(`person_a_id.eq.${id},person_b_id.eq.${id}`),
      admin.from('persons').select('id, name_en, name_ml, generation_number').neq('id', id),
      admin.from('houses').select('id, name_en, name_ml'),
    ]);

  if (!person) notFound();

  const rels = relationships ?? [];

  const parent_ids = rels
    .filter((r) => r.person_b_id === id && r.relationship_type !== 'spouse')
    .map((r) => r.person_a_id);

  const spouse_ids = rels
    .filter(
      (r) =>
        r.relationship_type === 'spouse' &&
        (r.person_a_id === id || r.person_b_id === id)
    )
    .map((r) => (r.person_a_id === id ? r.person_b_id : r.person_a_id));

  const child_ids = rels
    .filter((r) => r.person_a_id === id && r.relationship_type !== 'spouse')
    .map((r) => r.person_b_id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Edit Member</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Your proposed edit will be sent for admin review before going live.
      </p>
      <PersonForm
        mode="edit"
        targetPersonId={id}
        defaultValues={{
          name_en: person.name_en,
          name_ml: person.name_ml ?? undefined,
          gender: person.gender as 'male' | 'female' | 'other' | 'unknown',
          birth_date: person.birth_date ?? undefined,
          birth_date_approx: person.birth_date_approx,
          death_date: person.death_date ?? undefined,
          is_alive: person.is_alive,
          biography_en: person.biography_en ?? undefined,
          biography_ml: person.biography_ml ?? undefined,
          house_id: person.house_id ?? undefined,
          is_root: person.is_root,
          parent_ids,
          spouse_ids,
          child_ids,
        }}
        allPersons={allPersons ?? []}
        houses={houses ?? []}
      />
    </div>
  );
}
