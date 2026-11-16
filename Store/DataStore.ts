import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ICard } from "../Interface/card";
import { IStaff } from "../Interface/staff";
import { makeSeedCards } from "../Mock/cards";
import { staffData } from "../Mock/staff";

type DataState = {
  /** true once localStorage has been read (or seeded) in the browser */
  ready: boolean;
  /** true after demo data was written once, so deleting everything does not re-seed */
  seeded: boolean;
  cards: ICard[];
  staff: IStaff[];
  setCards: (cards: ICard[]) => void;
  addStaff: (member: IStaff) => void;
  updateStaff: (member: IStaff) => void;
  removeStaff: (id: string) => void;
  resetDemoData: () => void;
};

/**
 * Members ("users") and staff are saved in localStorage, so adds, edits and
 * deletes survive a reload. Nothing is sent to a server.
 */
const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ready: false,
      seeded: false,
      cards: [],
      staff: [],
      setCards: (cards) => set({ cards }),
      addStaff: (member) => set((s) => ({ staff: [...s.staff, member] })),
      updateStaff: (member) => set((s) => ({ staff: s.staff.map((m) => (m.id === member.id ? member : m)) })),
      removeStaff: (id) => set((s) => ({ staff: s.staff.filter((m) => m.id !== id) })),
      // Demo dates are generated relative to today.
      resetDemoData: () => set({ cards: makeSeedCards(), staff: staffData, seeded: true }),
    }),
    {
      name: "my-fitness-data",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cards: s.cards, staff: s.staff, seeded: s.seeded }),
      // Rehydrated in ClientShell after mount, so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded) state.resetDemoData();
        useDataStore.setState({ ready: true });
      },
    },
  ),
);

export default useDataStore;
