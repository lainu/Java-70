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

const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;

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

  const nodes = useMemo(
    () => buildTreeNodes(visiblePersons, visibleRelationships),
    [visiblePersons, visibleRelationships]
  );

  const handleNodeClick = useCallback(
    (personId: string) => {
      setSelectedPerson(personId);
    },
    [setSelectedPerson]
  );

  const selectedPerson = selectedPersonId ? personMap[selectedPersonId] : null;

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
            {nodes.length > 0 ? (
              <ReactFamilyTree
                nodes={nodes}
                rootId={nodes[0]?.id ?? ''}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                renderNode={(node: ExtNode) => {
                  const person = personMap[node.id];
                  if (!person) return null;
                  return (
                    <FamilyNode
                      key={node.id}
                      node={node}
                      person={person}
                      house={person.house_id ? initialHouses.find((h) => h.id === person.house_id) : undefined}
                      isSelected={selectedPersonId === node.id}
                      onClick={handleNodeClick}
                    />
                  );
                }}
              />
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
