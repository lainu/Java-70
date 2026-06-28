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

  return (
    <div
      className={`tree-node rounded-xl overflow-hidden shadow-md border-2 group ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
      style={{
        width: 152,
        height: 92,
        left: node.left * 180,
        top: node.top * 120,
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
      onClick={() => onClick(person.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(person.id)}
      aria-label={`View ${displayName}`}
    >
      <div className="flex items-center gap-2 p-2 h-full relative">
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={displayName}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-white font-bold text-sm">{getInitials(person.name_en)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-xs leading-tight text-white truncate ${locale === 'ml' ? 'font-ml' : ''}`}
            title={displayName}
          >
            {displayName}
          </p>
          {house && (
            <p className="text-white/70 text-[10px] truncate mt-0.5">{house.name_en}</p>
          )}
          {person.birth_date && (
            <p className="text-white/60 text-[10px] mt-0.5">
              b. {person.birth_date.slice(0, 4)}
              {!person.is_alive && person.death_date ? ` – ${person.death_date.slice(0, 4)}` : ''}
            </p>
          )}
          {person.generation_number !== null && (
            <p className="text-white/50 text-[9px] mt-0.5">Gen {person.generation_number}</p>
          )}
        </div>

        {/* Branch focus button */}
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/40 rounded p-0.5"
          onClick={(e) => {
            e.stopPropagation();
            setFocusedBranch(person.id);
          }}
          title="Zoom to this branch"
          aria-label="Zoom to branch"
        >
          <ZoomIn className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
}
