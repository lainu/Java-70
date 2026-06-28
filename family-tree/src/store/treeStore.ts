import { create } from 'zustand';

interface TreeState {
  selectedPersonId: string | null;
  focusedBranchRootId: string | null;
  filterHouseId: string | null;
  setSelectedPerson: (id: string | null) => void;
  setFocusedBranch: (id: string | null) => void;
  setFilterHouse: (id: string | null) => void;
  reset: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  selectedPersonId: null,
  focusedBranchRootId: null,
  filterHouseId: null,
  setSelectedPerson: (id) => set({ selectedPersonId: id }),
  setFocusedBranch: (id) => set({ focusedBranchRootId: id }),
  setFilterHouse: (id) => set({ filterHouseId: id }),
  reset: () => set({ selectedPersonId: null, focusedBranchRootId: null, filterHouseId: null }),
}));
