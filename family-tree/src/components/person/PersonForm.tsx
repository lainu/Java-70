'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { personSchema, type PersonFormValues } from '@/lib/validations/person';
import { submitChange } from '@/lib/actions/pending';
import { addPersonDirect } from '@/lib/actions/persons';
import type { Person, House } from '@/types/tree';

interface Props {
  mode: 'add' | 'edit' | 'admin-add';
  defaultValues?: Partial<PersonFormValues>;
  targetPersonId?: string;
  allPersons: Pick<Person, 'id' | 'name_en' | 'name_ml' | 'generation_number'>[];
  houses: Pick<House, 'id' | 'name_en' | 'name_ml'>[];
}

export default function PersonForm({ mode, defaultValues, targetPersonId, allPersons, houses }: Props) {
  const t = useTranslations('person');
  const tf = useTranslations('forms');
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      gender: 'unknown',
      is_alive: true,
      birth_date_approx: false,
      is_root: false,
      parent_ids: [],
      spouse_ids: [],
      child_ids: [],
      ...defaultValues,
    },
  });

  const isAlive = watch('is_alive');

  async function onSubmit(values: PersonFormValues) {
    setError('');
    try {
      if (mode === 'admin-add') {
        await addPersonDirect(values);
      } else if (mode === 'edit') {
        await submitChange('edit_person', values as unknown as Record<string, unknown>, targetPersonId);
      } else {
        await submitChange('add_person', values as unknown as Record<string, unknown>);
      }
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
        {mode === 'admin-add'
          ? 'Member added successfully!'
          : 'Your submission has been sent for admin review.'}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* English name */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('nameEn')} *</label>
        <input
          {...register('name_en')}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="John Kurian"
        />
        {errors.name_en && <p className="text-destructive text-xs mt-1">{errors.name_en.message}</p>}
      </div>

      {/* Malayalam name */}
      <div>
        <label className="block text-sm font-medium mb-1 font-ml">{t('nameMl')}</label>
        <input
          {...register('name_ml')}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-ml"
          placeholder="جونی کوریان"
          lang="ml"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('gender')}</label>
        <select {...register('gender')} className="w-full border rounded px-3 py-2 text-sm">
          <option value="unknown">{t('genderUnknown')}</option>
          <option value="male">{t('genderMale')}</option>
          <option value="female">{t('genderFemale')}</option>
          <option value="other">{t('genderOther')}</option>
        </select>
      </div>

      {/* Living status */}
      <div className="flex items-center gap-2">
        <input type="checkbox" {...register('is_alive')} id="is_alive" />
        <label htmlFor="is_alive" className="text-sm">{t('isAlive')}</label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{t('birthDate')}</label>
          <input type="date" {...register('birth_date')} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        {!isAlive && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('deathDate')}</label>
            <input type="date" {...register('death_date')} className="w-full border rounded px-3 py-2 text-sm" />
            {errors.death_date && <p className="text-destructive text-xs mt-1">{errors.death_date.message}</p>}
          </div>
        )}
      </div>

      {/* House */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('house')}</label>
        <select {...register('house_id')} className="w-full border rounded px-3 py-2 text-sm">
          <option value="">{t('selectHouse')}</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Parents */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('parents')} (max 2)</label>
        <PersonMultiSelect
          persons={allPersons}
          max={2}
          onChange={(ids) => setValue('parent_ids', ids)}
          placeholder={t('addParent')}
        />
      </div>

      {/* Spouse */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('spouse')}</label>
        <PersonMultiSelect
          persons={allPersons}
          max={10}
          onChange={(ids) => setValue('spouse_ids', ids)}
          placeholder={t('addSpouse')}
        />
      </div>

      {/* Children */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('children')}</label>
        <PersonMultiSelect
          persons={allPersons}
          max={50}
          onChange={(ids) => setValue('child_ids', ids)}
          placeholder="Add child"
        />
      </div>

      {/* Biography */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('biographyEn')}</label>
        <textarea
          {...register('biography_en')}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 font-ml">{t('biographyMl')}</label>
        <textarea
          {...register('biography_ml')}
          rows={3}
          lang="ml"
          className="w-full border rounded px-3 py-2 text-sm resize-none font-ml focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting
            ? tf('submitting')
            : mode === 'admin-add'
              ? tf('save')
              : tf('submit')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border rounded hover:bg-slate-50 transition-colors"
        >
          {tf('cancel')}
        </button>
      </div>
    </form>
  );
}

function PersonMultiSelect({
  persons,
  max,
  onChange,
  placeholder,
}: {
  persons: Props['allPersons'];
  max: number;
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const filtered = persons.filter(
    (p) =>
      !selected.includes(p.id) &&
      (p.name_en.toLowerCase().includes(query.toLowerCase()) ||
        (p.name_ml ?? '').includes(query))
  );

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : selected.length < max
        ? [...selected, id]
        : selected;
    setSelected(next);
    onChange(next);
  }

  return (
    <div className="space-y-1">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => {
            const p = persons.find((p) => p.id === id);
            return (
              <span
                key={id}
                className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                onClick={() => toggle(id)}
              >
                {p?.name_en} ×
              </span>
            );
          })}
        </div>
      )}
      {selected.length < max && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {query && (
            <div className="border rounded max-h-40 overflow-y-auto">
              {filtered.slice(0, 20).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { toggle(p.id); setQuery(''); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-b-0"
                >
                  {p.name_en}
                  {p.name_ml && <span className="text-muted-foreground ml-2 font-ml text-xs">{p.name_ml}</span>}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-xs px-3 py-2">No results</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
