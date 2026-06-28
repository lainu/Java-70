import type { Node } from 'relatives-tree/lib/types';
import type { Person, Relationship } from '@/types/tree';

/**
 * Converts flat DB rows to the format expected by the `relatives-tree` layout engine.
 *
 * relatives-tree models each person as a Node with typed Relation arrays.
 * Parent-child is represented via `children` on the parent node.
 * Spouses share a spouse Relation. The library handles couple layout internally.
 */
export function buildTreeNodes(persons: Person[], relationships: Relationship[]): Node[] {
  const parentEdges = relationships.filter(
    (r) => r.relationship_type === 'biological_child' || r.relationship_type === 'adopted_child'
  );
  const spouseEdges = relationships.filter((r) => r.relationship_type === 'spouse');

  // person → children IDs
  const childrenByParent = new Map<string, string[]>();
  for (const r of parentEdges) {
    const arr = childrenByParent.get(r.person_a_id) ?? [];
    arr.push(r.person_b_id);
    childrenByParent.set(r.person_a_id, arr);
  }

  // person → parent IDs
  const parentsByChild = new Map<string, string[]>();
  for (const r of parentEdges) {
    const arr = parentsByChild.get(r.person_b_id) ?? [];
    arr.push(r.person_a_id);
    parentsByChild.set(r.person_b_id, arr);
  }

  // person → spouse IDs
  const spousesByPerson = new Map<string, string[]>();
  for (const r of spouseEdges) {
    const a = spousesByPerson.get(r.person_a_id) ?? [];
    a.push(r.person_b_id);
    spousesByPerson.set(r.person_a_id, a);

    const b = spousesByPerson.get(r.person_b_id) ?? [];
    b.push(r.person_a_id);
    spousesByPerson.set(r.person_b_id, b);
  }

  return persons.map((person) => {
    const children = childrenByParent.get(person.id) ?? [];
    const parents = parentsByChild.get(person.id) ?? [];
    const spouses = spousesByPerson.get(person.id) ?? [];

    // const enum (Gender, RelType) can't be imported across module boundaries with
    // isolatedModules — cast through unknown to satisfy the Node type.
    return {
      id: person.id,
      gender: person.gender === 'female' ? 'female' : 'male',
      parents: parents.map((pid) => ({ id: pid, type: 'blood' })),
      children: children.map((cid) => ({ id: cid, type: 'blood' })),
      siblings: [],
      spouses: spouses.map((sid) => ({ id: sid, type: 'married' })),
    } as unknown as Node;
  });
}
