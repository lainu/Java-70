'use client';

import type { RefObject } from 'react';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTreeStore } from '@/store/treeStore';
import type { House } from '@/types/tree';

interface Props {
  transformRef: RefObject<ReactZoomPanPinchRef | null>;
  houses: House[];
}

export default function TreeControls({ transformRef, houses }: Props) {
  const t = useTranslations('tree');
  const { filterHouseId, focusedBranchRootId, setFilterHouse, setFocusedBranch } = useTreeStore();

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {/* Zoom controls */}
      <div className="flex flex-col gap-1 bg-white rounded-lg shadow-md p-1 border">
        <button
          onClick={() => transformRef.current?.zoomIn()}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
          title={t('zoomIn')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => transformRef.current?.zoomOut()}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
          title={t('zoomOut')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => transformRef.current?.resetTransform()}
          className="p-2 hover:bg-slate-100 rounded transition-colors"
          title={t('resetView')}
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* House filter */}
      {houses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-2 border">
          <p className="text-xs text-muted-foreground mb-1">{t('filterByHouse')}</p>
          <select
            value={filterHouseId ?? ''}
            onChange={(e) => setFilterHouse(e.target.value || null)}
            className="text-xs border rounded px-1 py-0.5 w-40"
          >
            <option value="">{t('allHouses')}</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name_en}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Exit branch focus */}
      {focusedBranchRootId && (
        <button
          onClick={() => setFocusedBranch(null)}
          className="flex items-center gap-1 bg-white rounded-lg shadow-md px-3 py-2 border text-xs hover:bg-slate-50 transition-colors"
        >
          <X className="w-3 h-3" />
          {t('exitFocus')}
        </button>
      )}
    </div>
  );
}
