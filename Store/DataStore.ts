import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ICard } from "../Interface/card";
import { IStaff } from "../Interface/staff";
import { makeSeedCards } from "../Mock/cards";
import { staffData } from "../Mock/staff";
import { api, getMembers, getStaff } from "../lib/api";

type Source = "api" | "demo";

type DataState = {
  /** true once localStorage has been read (or seeded) in the browser */
  ready: boolean;
  /** true after demo data was written once, so deleting everything does not re-seed */
  seeded: boolean;
  /** "api" when members and staff came from the Pulsa API; "demo" = this browser only */
  source: Source;
  cards: ICard[];
  staff: IStaff[];
  setCards: (cards: ICard[]) => void;
  addMember: (card: ICard) => void;
  updateMember: (card: ICard) => void;
  removeMember: (id: string) => void;
  addStaff: (member: IStaff) => void;
  updateStaff: (member: IStaff) => void;
  removeStaff: (id: string) => void;
  resetDemoData: () => void;
  /** Load members and staff from the API (keeps the local copy if the API is unreachable). */
  syncFromApi: () => Promise<void>;
};

/** Run an API write in the background; on failure the local change stays (demo behaviour). */
const sync = (fn: () => Promise<unknown>) => {
  if (useDataStore.getState().source !== "api") return;
  fn().catch((err) => console.warn("[pulsa] API write failed, kept locally:", err));
};

/**
 * Members ("users") and staff. With NEXT_PUBLIC_API_URL set they are read from and written to the
 * API; otherwise (or while it is down) they live in localStorage so adds, edits and deletes survive a reload.
 */
const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ready: false,
      seeded: false,
      source: "demo",
      cards: [],
      staff: [],
      setCards: (cards) => set({ cards }),
      addMember: (card) => {
        set((s) => ({ cards: [...s.cards, card] }));
        sync(async () => {
          const saved = await api.createMember(card);
          if (saved.id) set((s) => ({ cards: s.cards.map((c) => (c.id === card.id ? { ...card, id: saved.id } : c)) }));
        });
      },
      updateMember: (card) => {
        set((s) => ({ cards: s.cards.map((c) => (c.id === card.id ? card : c)) }));
        sync(() => api.updateMember(card));
      },
      removeMember: (id) => {
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
        sync(() => api.deleteMember(id));
      },
      addStaff: (member) => {
        set((s) => ({ staff: [...s.staff, member] }));
        sync(async () => {
          const saved = await api.createStaff(member);
          if (saved.id) set((s) => ({ staff: s.staff.map((m) => (m.id === member.id ? { ...member, id: saved.id } : m)) }));
        });
      },
      updateStaff: (member) => {
        set((s) => ({ staff: s.staff.map((m) => (m.id === member.id ? member : m)) }));
        sync(() => api.updateStaff(member));
      },
      removeStaff: (id) => {
        set((s) => ({ staff: s.staff.filter((m) => m.id !== id) }));
        sync(() => api.deleteStaff(id));
      },
      // Demo dates are generated relative to today.
      resetDemoData: () => set({ cards: makeSeedCards(), staff: staffData, seeded: true }),
      syncFromApi: async () => {
        const [members, staff] = await Promise.all([getMembers(), getStaff()]);
        if (members.source === "api" && staff.source === "api") {
          set({ cards: members.data, staff: staff.data, source: "api" });
        } else if (!get().seeded) {
          get().resetDemoData();
        }
      },
    }),
    {
      name: "my-fitness-data",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cards: s.cards, staff: s.staff, seeded: s.seeded }),
      // Rehydrated in the app shell after mount, so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded) state.resetDemoData();
        useDataStore.setState({ ready: true });
        void useDataStore.getState().syncFromApi();
      },
    },
  ),
);

export default useDataStore;
