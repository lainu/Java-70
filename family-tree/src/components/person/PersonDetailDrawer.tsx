'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { X, Edit, ChevronDown } from 'lucide-react';
import { getInitials, getStorageUrl } from '@/lib/utils';
import { getGenerationStyle } from '@/lib/tree/generationColors';
import { useAuth } from '@/hooks/useAuth';
import type { Person, Relationship, House } from '@/types/tree';

interface Props {
  person: Person;
  relationships: Relationship[];
  personMap: Record<string, Person>;
  houses: House[];
  onClose: () => void;
}

function getAge(birthDate?: string | null, deathDate?: string | null, isAlive?: boolean): number | null {
  if (!birthDate) return null;
  const end = !isAlive && deathDate ? new Date(deathDate) : new Date();
  return Math.floor((end.getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function PersonRow({ role, person, locale }: { role: string; person: Person; locale: string }) {
  const photoUrl = getStorageUrl(person.profile_photo);
  const style = getGenerationStyle(person.generation_number);
  const name = locale === 'ml' && person.name_ml ? person.name_ml : person.name_en;
  const age = getAge(person.birth_date, person.death_date, person.is_alive);
  const ageStr = age !== null ? `(${age})` : '';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div
        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
        style={{ backgroundColor: style.bg }}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt={name} width={36} height={36} className="object-cover w-full h-full" />
        ) : (
          <span>{getInitials(person.name_en)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{role}</p>
        <p className={`text-sm font-medium text-gray-800 truncate ${locale === 'ml' && person.name_ml ? 'font-ml' : ''}`}>
          {name} {ageStr}
        </p>
      </div>
      <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </div>
  );
}

export default function PersonDetailDrawer({ person, relationships, personMap, houses, onClose }: Props) {
  const locale = useLocale();
  const { user } = useAuth();

  const style = getGenerationStyle(person.generation_number);
  const displayName = locale === 'ml' && person.name_ml ? person.name_ml : person.name_en;
  const bio = locale === 'ml' && person.biography_ml ? person.biography_ml : person.biography_en;
  const photoUrl = getStorageUrl(person.profile_photo);

  const parents = relationships
    .filter((r) => r.person_b_id === person.id && r.relationship_type !== 'spouse')
    .map((r) => personMap[r.person_a_id])
    .filter(Boolean) as Person[];

  const children = relationships
    .filter((r) => r.person_a_id === person.id && r.relationship_type !== 'spouse')
    .map((r) => personMap[r.person_b_id])
    .filter(Boolean) as Person[];

  const spouses = relationships
    .filter(
      (r) => r.relationship_type === 'spouse' && (r.person_a_id === person.id || r.person_b_id === person.id)
    )
    .map((r) => personMap[r.person_a_id === person.id ? r.person_b_id : r.person_a_id])
    .filter(Boolean) as Person[];

  const parentIds = parents.map((p) => p.id);
  const siblings = parentIds.length > 0
    ? relationships
        .filter((r) => parentIds.includes(r.person_a_id) && r.relationship_type !== 'spouse' && r.person_b_id !== person.id)
        .map((r) => personMap[r.person_b_id])
        .filter((p, i, arr): p is Person => !!p && arr.findIndex((x) => x?.id === p.id) === i)
    : [];

  const age = getAge(person.birth_date, person.death_date, person.is_alive);
  const yearStr = person.birth_date
    ? `(${person.birth_date.slice(0, 4)}${!person.is_alive && person.death_date ? `–${person.death_date.slice(0, 4)}` : '–'})`
    : '';

  const fathers = parents.filter((p) => p.gender === 'male');
  const mothers = parents.filter((p) => p.gender === 'female');
  const otherParents = parents.filter((p) => p.gender !== 'male' && p.gender !== 'female');

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl border-l border-gray-100 z-20 flex flex-col overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Photo banner */}
      <div
        className="h-44 flex-shrink-0 relative flex items-end"
        style={{ background: `linear-gradient(135deg, ${style.bg}dd, ${style.border}aa)` }}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt={displayName} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/30 text-7xl font-black select-none">{getInitials(person.name_en)}</span>
          </div>
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Name overlay */}
        <div className="relative px-4 pb-3 z-10">
          <h2 className={`text-white font-bold text-xl leading-tight drop-shadow ${locale === 'ml' ? 'font-ml' : ''}`}>
            {displayName}
          </h2>
          <p className="text-white/80 text-sm">
            {yearStr}
            {age !== null && ` · ${age} yrs`}
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Immediate Family */}
        <div className="pt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-4 mb-1">
            Immediate Family
          </h3>
          <div className="divide-y-0">
            {fathers.map((p) => <PersonRow key={p.id} role="Father" person={p} locale={locale} />)}
            {mothers.map((p) => <PersonRow key={p.id} role="Mother" person={p} locale={locale} />)}
            {otherParents.map((p) => <PersonRow key={p.id} role="Parent" person={p} locale={locale} />)}
            {spouses.map((p) => <PersonRow key={p.id} role="Spouse" person={p} locale={locale} />)}
            {siblings.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">{siblings.length}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Siblings</p>
                  <p className="text-sm font-medium text-gray-800">
                    {siblings.map((s) => (locale === 'ml' && s.name_ml ? s.name_ml : s.name_en)).join(', ')}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )}
            {children.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">{children.length}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Children</p>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {children.map((c) => (locale === 'ml' && c.name_ml ? c.name_ml : c.name_en)).join(', ')}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* About */}
        {bio && (
          <div className="px-4 py-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">About</h3>
            <p className={`text-sm text-gray-600 leading-relaxed ${locale === 'ml' ? 'font-ml' : ''}`}>{bio}</p>
          </div>
        )}

        {/* Edit link */}
        {user && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Link
              href={`/${locale}/person/${person.id}/edit`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Edit className="w-4 h-4" />
              Edit member
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
