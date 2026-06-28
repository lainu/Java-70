import { describe, it, expect } from 'vitest';
import { focusBranch } from '@/lib/tree/focusBranch';
import type { Person, Relationship } from '@/types/tree';

function makePerson(id: string): Person {
  return {
    id,
    name_en: id,
    name_ml: null,
    gender: 'unknown',
    birth_date: null,
    birth_date_approx: false,
    death_date: null,
    is_alive: true,
    biography_en: null,
    biography_ml: null,
    profile_photo: null,
    house_id: null,
    generation_number: null,
    is_root: false,
    created_at: new Date().toISOString(),
  };
}

function makeRel(parentId: string, childId: string): Relationship {
  return {
    id: `${parentId}-${childId}`,
    person_a_id: parentId,
    person_b_id: childId,
    relationship_type: 'biological_child',
    marriage_date: null,
    divorce_date: null,
  };
}

describe('focusBranch', () => {
  const persons = ['grandpa', 'grandma', 'dad', 'mom', 'child1', 'child2', 'unrelated'].map(
    makePerson
  );

  const relationships: Relationship[] = [
    makeRel('grandpa', 'dad'),
    makeRel('grandma', 'dad'),
    makeRel('dad', 'child1'),
    makeRel('mom', 'child1'),
    makeRel('dad', 'child2'),
    {
      id: 'dad-mom-spouse',
      person_a_id: 'dad',
      person_b_id: 'mom',
      relationship_type: 'spouse',
      marriage_date: null,
      divorce_date: null,
    },
  ];

  it('includes the root person', () => {
    const result = focusBranch('dad', persons, relationships);
    expect(result.has('dad')).toBe(true);
  });

  it('includes ancestors of the root', () => {
    const result = focusBranch('dad', persons, relationships);
    expect(result.has('grandpa')).toBe(true);
    expect(result.has('grandma')).toBe(true);
  });

  it('includes descendants of the root', () => {
    const result = focusBranch('dad', persons, relationships);
    expect(result.has('child1')).toBe(true);
    expect(result.has('child2')).toBe(true);
  });

  it('includes spouses', () => {
    const result = focusBranch('dad', persons, relationships);
    expect(result.has('mom')).toBe(true);
  });

  it('excludes unrelated persons', () => {
    const result = focusBranch('dad', persons, relationships);
    expect(result.has('unrelated')).toBe(false);
  });
});
