'use client';

import { useMemo, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import calcTree from 'relatives-tree';
import type { ExtNode } from 'relatives-tree/lib/types';
import { useTreeStore } from '@/store/treeStore';
import { buildTreeNodes } from '@/lib/tree/adapter';
import { focusBranch } from '@/lib/tree/focusBranch';
import type { Person, Relationship, House } from '@/types/tree';
import FamilyNode from './FamilyNode';
import TreeControls from './TreeControls';
import TreeSidebar from './TreeSidebar';
import GenerationLegend from './GenerationLegend';
import PersonDetailDrawer from '@/components/person/PersonDetailDrawer';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 130;
const PX_W = NODE_WIDTH / 2; // 130 — pixels per half-unit (x axis)
const PX_H = NODE_HEIGHT / 2; // 65 — pixels per half-unit (y axis)

interface Props {
  initialPersons: Person[];
  initialRelationships: Relationship[];
  initialHouses: House[];
}

export default function FamilyTreeCanvas({
  initialPersons,
  initialRelationships,
  initialHouses,
}: Props) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const { filterHouseId, focusedBranchRootId, selectedPersonId, setSelectedPerson } =
    useTreeStore();

  const filteredPersons = useMemo(() => {
    if (!filterHouseId) return initialPersons;
    return initialPersons.filter((p) => p.house_id === filterHouseId);
  }, [initialPersons, filterHouseId]);

  const visiblePersons = useMemo(() => {
    if (!focusedBranchRootId) return filteredPersons;
    const branchIds = focusBranch(focusedBranchRootId, filteredPersons, initialRelationships);
    return filteredPersons.filter((p) => branchIds.has(p.id));
  }, [filteredPersons, focusedBranchRootId, initialRelationships]);

  const visibleIds = useMemo(() => new Set(visiblePersons.map((p) => p.id)), [visiblePersons]);

  const visibleRelationships = useMemo(
    () =>
      initialRelationships.filter(
        (r) => visibleIds.has(r.person_a_id) && visibleIds.has(r.person_b_id)
      ),
    [initialRelationships, visibleIds]
  );

  const personMap = useMemo(
    () => Object.fromEntries(initialPersons.map((p) => [p.id, p])),
    [initialPersons]
  );

  // Split into connected components, then compute positioned layout via relatives-tree
  const positionedComponents = useMemo(() => {
    if (visiblePersons.length === 0) return [];

    const adj = new Map<string, Set<string>>();
    for (const p of visiblePersons) adj.set(p.id, new Set());
    for (const r of visibleRelationships) {
      adj.get(r.person_a_id)?.add(r.person_b_id);
      adj.get(r.person_b_id)?.add(r.person_a_id);
    }

    const visited = new Set<string>();
    const result: Array<{ rootId: string; data: ReturnType<typeof calcTree> }> = [];

    for (const p of visiblePersons) {
      if (visited.has(p.id)) continue;
      const ids: string[] = [];
      const queue = [p.id];
      visited.add(p.id);
      while (queue.length) {
        const curr = queue.shift()!;
        ids.push(curr);
        for (const nb of adj.get(curr) ?? []) {
          if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        }
      }
      const idSet = new Set(ids);
      const compPersons = visiblePersons.filter((x) => idSet.has(x.id));
      const compRels = visibleRelationships.filter(
        (r) => idSet.has(r.person_a_id) && idSet.has(r.person_b_id)
      );
      const nodes = buildTreeNodes(compPersons, compRels);
      const root =
        compPersons.find((x) => x.is_root) ??
        [...compPersons].sort((a, b) => (a.generation_number ?? 99) - (b.generation_number ?? 99))[0];
      const rootId = root?.id ?? ids[0];

      try {
        const data = calcTree(nodes, { rootId });
        result.push({ rootId, data });
      } catch {
        // Skip malformed components
      }
    }
    return result;
  }, [visiblePersons, visibleRelationships]);

  const handleNodeClick = useCallback(
    (personId: string) => setSelectedPerson(personId),
    [setSelectedPerson]
  );

  const selectedPerson = selectedPersonId ? personMap[selectedPersonId] : null;

  const renderNode = (node: ExtNode) => {
    const person = personMap[node.id];
    if (!person) return null;
    return (
      <div
        key={node.id}
        style={{
          position: 'absolute',
          left: node.left * PX_W,
          top: node.top * PX_H,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          padding: '5px 10px',
        }}
      >
        <FamilyNode
          node={node}
          person={person}
          house={person.house_id ? initialHouses.find((h) => h.id === person.house_id) : undefined}
          isSelected={selectedPersonId === node.id}
          onClick={handleNodeClick}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-50">
      <TreeSidebar />
      <div className="absolute inset-0 left-[4.5rem]">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.8}
          minScale={0.1}
          maxScale={3}
          centerOnInit
          limitToBounds={false}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%' }}
          >
            <div className="tree-canvas p-16">
              {positionedComponents.length > 0 ? (
                <div className="flex flex-col gap-16">
                  {positionedComponents.map(({ rootId, data }) => (
                    <div
                      key={rootId}
                      style={{
                        position: 'relative',
                        width: data.canvas.width * PX_W,
                        height: data.canvas.height * PX_H,
                      }}
                    >
                      {/* SVG connector lines — replaces the invisible <i> elements */}
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          overflow: 'visible',
                        }}
                      >
                        {data.connectors.map(([x1, y1, x2, y2], i) => (
                          <line
                            key={i}
                            x1={x1 * PX_W}
                            y1={y1 * PX_H}
                            x2={x2 * PX_W}
                            y2={y2 * PX_H}
                            stroke="#7c3aed"
                            strokeWidth="2"
                            strokeOpacity="0.5"
                            strokeLinecap="round"
                          />
                        ))}
                      </svg>
                      {/* Node cards */}
                      {data.nodes.map(renderNode)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No family members yet.
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>

        <TreeControls transformRef={transformRef} houses={initialHouses} />
        <GenerationLegend persons={visiblePersons} />

        {selectedPerson && (
          <PersonDetailDrawer
            person={selectedPerson}
            relationships={initialRelationships}
            personMap={personMap}
            houses={initialHouses}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </div>
    </div>
  );
}
