'use client';

import { useQuery } from '@tanstack/react-query';
import type { FamilyTreeData } from '@/types/tree';

async function fetchFamilyTree(): Promise<FamilyTreeData> {
  const res = await fetch('/api/persons');
  if (!res.ok) throw new Error('Failed to fetch family tree');
  return res.json();
}

export function useFamilyTree() {
  return useQuery({
    queryKey: ['family-tree'],
    queryFn: fetchFamilyTree,
    staleTime: 60_000,
  });
}
