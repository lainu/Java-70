'use client';

import { useTranslations } from 'next-intl';
import { getGenerationStyle } from '@/lib/tree/generationColors';
import type { Person } from '@/types/tree';

interface Props {
  persons: Person[];
}

export default function GenerationLegend({ persons }: Props) {
  const t = useTranslations('tree');

  const generations = [
    ...new Set(
      persons
        .map((p) => p.generation_number)
        .filter((g): g is number => g !== null)
        .sort((a, b) => a - b)
    ),
  ];

  if (generations.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border z-10">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('legend')}</p>
      <div className="flex flex-col gap-1">
        {generations.map((gen) => {
          const style = getGenerationStyle(gen);
          return (
            <div key={gen} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: style.bg }}
              />
              <span className="text-xs text-foreground">{t('generationLabel', { n: gen })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
