'use client';

import type { ExtNode } from 'relatives-tree/lib/types';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { getGenerationStyle } from '@/lib/tree/generationColors';
import { getInitials, getStorageUrl } from '@/lib/utils';
import { useTreeStore } from '@/store/treeStore';
import type { Person, House } from '@/types/tree';
import { ZoomIn } from 'lucide-react';

interface Props {
  node: ExtNode;
  person: Person;
  house?: House;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export default function FamilyNode({ node, person, house, isSelected, onClick }: Props) {
  const locale = useLocale();
  const { setFocusedBranch } = useTreeStore();

  const style = getGenerationStyle(person.generation_number);
  const displayName = locale === 'ml' && person.name_ml ? person.name_ml : person.name_en;
  const photoUrl = getStorageUrl(person.profile_photo);
  // A "married-in" person has no parents AND no children in the tree (pure spouse node)
  const isMarriedIn = node.parents.length === 0 && node.children.length === 0 && !person.is_root;

  const years = person.birth_date
    ? `${person.birth_date.slice(0, 4)}${!person.is_alive && person.death_date ? ` – ${person.death_date.slice(0, 4)}` : '–'}`
    : null;

  return (
    <div
      className={`tree-node w-full h-full rounded-2xl overflow-hidden group cursor-pointer transition-all duration-150
        ${isSelected
          ? 'shadow-lg ring-2 ring-offset-1'
          : 'shadow-sm hover:shadow-md hover:-translate-y-px'
        }
        ${isMarriedIn ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200'}
      `}
      style={{
        borderLeft: `4px solid ${style.border}`,
        ...(isSelected ? { '--tw-ring-color': style.border } as React.CSSProperties : {}),
      }}
      onClick={() => onClick(person.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(person.id)}
      aria-label={`View ${displayName}`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 h-full relative">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-sm"
          style={{ backgroundColor: style.bg }}
        >
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={displayName}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-sm font-bold">{getInitials(person.name_en)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-[13px] leading-snug text-gray-900 truncate ${locale === 'ml' ? 'font-ml' : ''}`}
            title={displayName}
          >
            {displayName}
          </p>
          {house && (
            <p className="text-gray-400 text-[10px] truncate leading-tight mt-0.5">{house.name_en}</p>
          )}
          {years ? (
            <p className="text-gray-500 text-[11px] mt-0.5 tabular-nums">{years}</p>
          ) : person.generation_number !== null ? (
            <p className="text-gray-400 text-[10px] mt-0.5">Gen {person.generation_number}</p>
          ) : null}
          {isMarriedIn && (
            <p className="text-amber-500 text-[9px] font-medium mt-0.5 uppercase tracking-wide">Spouse</p>
          )}
        </div>

        {/* Branch focus button */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-gray-100 rounded-lg p-0.5 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            setFocusedBranch(person.id);
          }}
          title="Focus this branch"
          aria-label="Focus branch"
        >
          <ZoomIn className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
