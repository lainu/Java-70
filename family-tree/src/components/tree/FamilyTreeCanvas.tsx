'use client';

import { useMemo, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import ReactFamilyTree from 'react-family-tree';
import type { ExtNode } from 'relatives-tree/lib/types';
import { useTreeStore } from '@/store/treeStore';
import { buildTreeNodes } from '@/lib/tree/adapter';
import { focusBranch } from '@/lib/tree/focusBranch';
import type { Person, Relationship, House } from '@/types/tree';
import FamilyNode from './FamilyNode';
import TreeControls from './TreeControls';
import GenerationLegend from './GenerationLegend';
import PersonDetailDrawer from '@/components/person/PersonDetailDrawer';

const NODE_WIDTH = 260;
const NODE_HEIGHT = 130;

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

  // Filter persons by house if active
  const filteredPersons = useMemo(() => {
    if (!filterHouseId) return initialPersons;
    return initialPersons.filter((p) => p.house_id === filterHouseId);
  }, [initialPersons, filterHouseId]);

  // Further filter to branch if focused
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

  // Split persons into connected components so all nodes render, even disconnected ones.
  const components = useMemo(() => {
    if (visiblePersons.length === 0) return [];

    const adj = new Map<string, Set<string>>();
    for (const p of visiblePersons) adj.set(p.id, new Set());
    for (const r of visibleRelationships) {
      adj.get(r.person_a_id)?.add(r.person_b_id);
      adj.get(r.person_b_id)?.add(r.person_a_id);
    }

    const visited = new Set<string>();
    const result: Array<{ nodes: ReturnType<typeof buildTreeNodes>; rootId: string }> = [];

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
      const compRels = visibleRelationships.filter((r) => idSet.has(r.person_a_id) && idSet.has(r.person_b_id));
      const compNodes = buildTreeNodes(compPersons, compRels);
      const root =
        compPersons.find((x) => x.is_root) ??
        [...compPersons].sort((a, b) => (a.generation_number ?? 99) - (b.generation_number ?? 99))[0];
      result.push({ nodes: compNodes, rootId: root?.id ?? ids[0] });
    }
    return result;
  }, [visiblePersons, visibleRelationships]);

  const handleNodeClick = useCallback(
    (personId: string) => {
      setSelectedPerson(personId);
    },
    [setSelectedPerson]
  );

  const selectedPerson = selectedPersonId ? personMap[selectedPersonId] : null;

  // react-family-tree@3.x does NOT add wrapper divs — renderNode must position each node.
  const renderTree = (node: ExtNode) => {
    const person = personMap[node.id];
    if (!person) return null;
    return (
      <div
        key={node.id}
        style={{
          position: 'absolute',
          left: node.left * (NODE_WIDTH / 2),
          top: node.top * (NODE_HEIGHT / 2),
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
            {components.length > 0 ? (
              <div className="flex flex-col gap-16">
                {components.map(({ nodes, rootId }) => (
                  <div key={rootId}>
                    <ReactFamilyTree
                      nodes={nodes}
                      rootId={rootId}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      renderNode={renderTree}
                    />
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

      <TreeControls
        transformRef={transformRef}
        houses={initialHouses}
      />
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
  );
}
