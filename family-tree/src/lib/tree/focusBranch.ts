import type { Person, Relationship } from '@/types/tree';

/**
 * Returns the set of person IDs that form a branch rooted at `rootPersonId`.
 * Includes all ancestors (walking up parent edges) and all descendants
 * (walking down child edges), plus the person's spouses.
 */
export function focusBranch(
  rootPersonId: string,
  persons: Person[],
  relationships: Relationship[]
): Set<string> {
  const parentEdges = relationships.filter(
    (r) => r.relationship_type === 'biological_child' || r.relationship_type === 'adopted_child'
  );
  const spouseEdges = relationships.filter((r) => r.relationship_type === 'spouse');

  // Build adjacency: parent → children and child → parents
  const parentsByChild = new Map<string, string[]>();
  const childrenByParent = new Map<string, string[]>();
  for (const r of parentEdges) {
    const parents = parentsByChild.get(r.person_b_id) ?? [];
    parents.push(r.person_a_id);
    parentsByChild.set(r.person_b_id, parents);

    const children = childrenByParent.get(r.person_a_id) ?? [];
    children.push(r.person_b_id);
    childrenByParent.set(r.person_a_id, children);
  }

  const spousesByPerson = new Map<string, string[]>();
  for (const r of spouseEdges) {
    const a = spousesByPerson.get(r.person_a_id) ?? [];
    a.push(r.person_b_id);
    spousesByPerson.set(r.person_a_id, a);

    const b = spousesByPerson.get(r.person_b_id) ?? [];
    b.push(r.person_a_id);
    spousesByPerson.set(r.person_b_id, b);
  }

  const result = new Set<string>();

  // Walk ancestors
  const ancestorQueue = [rootPersonId];
  while (ancestorQueue.length > 0) {
    const id = ancestorQueue.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const parentId of parentsByChild.get(id) ?? []) {
      ancestorQueue.push(parentId);
    }
    // Include spouses of ancestors
    for (const spouseId of spousesByPerson.get(id) ?? []) {
      result.add(spouseId);
    }
  }

  // Walk descendants
  const descendantQueue = [rootPersonId];
  while (descendantQueue.length > 0) {
    const id = descendantQueue.pop()!;
    for (const childId of childrenByParent.get(id) ?? []) {
      if (!result.has(childId)) {
        result.add(childId);
        descendantQueue.push(childId);
      }
      // Include spouses of descendants
      for (const spouseId of spousesByPerson.get(childId) ?? []) {
        result.add(spouseId);
      }
    }
  }

  return result;
}
