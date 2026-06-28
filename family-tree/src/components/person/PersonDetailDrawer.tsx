'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { X, Edit } from 'lucide-react';
import { formatDate, getInitials, getStorageUrl } from '@/lib/utils';
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

export default function PersonDetailDrawer({ person, relationships, personMap, houses, onClose }: Props) {
  const locale = useLocale();
  const t = useTranslations('person');
  const { user } = useAuth();

  const style = getGenerationStyle(person.generation_number);
  const displayName = locale === 'ml' && person.name_ml ? person.name_ml : person.name_en;
  const bio = locale === 'ml' && person.biography_ml ? person.biography_ml : person.biography_en;
  const photoUrl = getStorageUrl(person.profile_photo);
  const house = person.house_id ? houses.find((h) => h.id === person.house_id) : null;

  const parents = relationships
    .filter((r) => r.person_b_id === person.id && r.relationship_type !== 'spouse')
    .map((r) => personMap[r.person_a_id])
    .filter(Boolean);

  const children = relationships
    .filter((r) => r.person_a_id === person.id && r.relationship_type !== 'spouse')
    .map((r) => personMap[r.person_b_id])
    .filter(Boolean);

  const spouses = relationships
    .filter(
      (r) =>
        r.relationship_type === 'spouse' &&
        (r.person_a_id === person.id || r.person_b_id === person.id)
    )
    .map((r) => personMap[r.person_a_id === person.id ? r.person_b_id : r.person_a_id])
    .filter(Boolean);

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl border-l z-20 overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-start gap-3" style={{ backgroundColor: style.bg }}>
        <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          {photoUrl ? (
            <Image src={photoUrl} alt={displayName} width={56} height={56} className="object-cover" />
          ) : (
            <span className="text-white font-bold">{getInitials(person.name_en)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`font-bold text-white text-lg leading-tight ${locale === 'ml' ? 'font-ml' : ''}`}>
            {displayName}
          </h2>
          {person.name_ml && locale === 'en' && (
            <p className="text-white/70 text-sm font-ml">{person.name_ml}</p>
          )}
          {house && <p className="text-white/70 text-xs mt-1">{house.name_en}</p>}
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Dates */}
        <div className="flex gap-4 text-sm">
          {person.birth_date && (
            <div>
              <p className="text-muted-foreground text-xs">Born</p>
              <p>{formatDate(person.birth_date)}{person.birth_date_approx ? ' (approx.)' : ''}</p>
            </div>
          )}
          {!person.is_alive && person.death_date && (
            <div>
              <p className="text-muted-foreground text-xs">Died</p>
              <p>{formatDate(person.death_date)}</p>
            </div>
          )}
          {person.generation_number !== null && (
            <div>
              <p className="text-muted-foreground text-xs">{t('generation')}</p>
              <p>{person.generation_number}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <div>
            <p className="text-muted-foreground text-xs mb-1">Biography</p>
            <p className={`text-sm leading-relaxed ${locale === 'ml' ? 'font-ml' : ''}`}>{bio}</p>
          </div>
        )}

        {/* Relations */}
        {parents.length > 0 && <RelationGroup label={t('parents')} persons={parents} locale={locale} />}
        {spouses.length > 0 && <RelationGroup label={t('spouse')} persons={spouses} locale={locale} />}
        {children.length > 0 && <RelationGroup label={t('children')} persons={children} locale={locale} />}

        {/* Edit link */}
        {user && (
          <Link
            href={`/${locale}/person/${person.id}/edit`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Edit className="w-4 h-4" />
            {t('proposeEdit')}
          </Link>
        )}
      </div>
    </div>
  );
}

function RelationGroup({ label, persons, locale }: { label: string; persons: Person[]; locale: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {persons.map((p) => (
          <span key={p.id} className={`text-sm bg-slate-100 rounded px-2 py-0.5 ${locale === 'ml' && p.name_ml ? 'font-ml' : ''}`}>
            {locale === 'ml' && p.name_ml ? p.name_ml : p.name_en}
          </span>
        ))}
      </div>
    </div>
  );
}
