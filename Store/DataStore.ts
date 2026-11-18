import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ICard } from "../Interface/card";
import { IStaff } from "../Interface/staff";
import { makeSeedCards } from "../Mock/cards";
import { staffData } from "../Mock/staff";
import { safeStateStorage } from "../lib/api/client";
import { api, ApiError, ApiUnavailable, DEMO_MODE, getMembers, getStaff, loadSession } from "../lib/api";

type Source = "api" | "demo";

type DataState = {
  /** true once localStorage has been read (or seeded) in the browser */
  ready: boolean;
  /** true after demo data was written once, so deleting everything does not re-seed */
  seeded: boolean;
  /** "api" = members/staff of the signed-in coach/admin, kept in memory only; "demo" = demo data in this browser */
  source: Source;
  /** what the pages show */
  cards: ICard[];
  staff: IStaff[];
  /** the demo copy: the only data that is saved in localStorage */
  demoCards: ICard[];
  demoStaff: IStaff[];
  /**
   * Writes. In API mode they wait for the server and only change the list after it answers;
   * on failure nothing changes and the promise rejects with a readable message.
   */
  addMember: (card: ICard) => Promise<void>;
  updateMember: (card: ICard) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  addStaff: (member: IStaff) => Promise<IStaff>;
  updateStaff: (member: IStaff) => Promise<IStaff>;
  removeStaff: (id: string) => Promise<void>;
  resetDemoData: () => void;
  /** Show API data for a signed-in coach/admin, otherwise the demo copy (also used after login/logout). */
  syncFromApi: () => Promise<void>;
};

/** Turn any write failure into a message for the user. */
export const writeErrorMessage = (err: unknown): string => {
  if (err instanceof ApiUnavailable) return "The server could not be reached, so nothing was saved. Please try again in a minute.";
  if (err instanceof ApiError) {
    if (err.code === "DEMO_READ_ONLY") return "Demo admin is read-only: changes are not saved. Everything else works as usual.";
    if (err.status === 401) return "Your session has expired. Please log in again.";
    if (err.status === 403) return "Your account is not allowed to change this. Ask an admin.";
    return err.message;
  }
  return "Something went wrong, nothing was saved.";
};

let syncId = 0;

const useDataStore = create<DataState>()(
  persist(
    (set, get) => {
      const isApi = () => get().source === "api";
      /** Demo mode: apply the change to the visible list and to the saved demo copy. */
      const demoCardsUpdate = (fn: (c: ICard[]) => ICard[]) => set((s) => ({ cards: fn(s.cards), demoCards: fn(s.demoCards) }));
      const demoStaffUpdate = (fn: (c: IStaff[]) => IStaff[]) => set((s) => ({ staff: fn(s.staff), demoStaff: fn(s.demoStaff) }));

      return {
        ready: false,
        seeded: false,
        source: "demo",
        cards: [],
        staff: [],
        demoCards: [],
        demoStaff: [],

        addMember: async (card) => {
          if (!isApi()) return demoCardsUpdate((c) => [...c, card]);
          const saved = await api.createMember(card);
          set((s) => ({ cards: [...s.cards, saved] }));
        },
        updateMember: async (card) => {
          if (!isApi()) return demoCardsUpdate((c) => c.map((x) => (x.id === card.id ? card : x)));
          const saved = await api.updateMember(card);
          // Keep a local photo preview if the API could not store it (data URLs stay local).
          set((s) => ({ cards: s.cards.map((x) => (x.id === card.id ? { ...saved, image: saved.image || card.image } : x)) }));
        },
        removeMember: async (id) => {
          if (!isApi()) return demoCardsUpdate((c) => c.filter((x) => x.id !== id));
          await api.deleteMember(id);
          set((s) => ({ cards: s.cards.filter((x) => x.id !== id) }));
        },
        addStaff: async (member) => {
          if (!isApi()) {
            demoStaffUpdate((c) => [...c, member]);
            return member;
          }
          const saved = await api.createStaff(member);
          set((s) => ({ staff: [...s.staff, saved] }));
          return saved;
        },
        updateStaff: async (member) => {
          if (!isApi()) {
            demoStaffUpdate((c) => c.map((x) => (x.id === member.id ? member : x)));
            return member;
          }
          const saved = await api.updateStaff(member);
          const merged = { ...saved, image: saved.image || member.image };
          set((s) => ({ staff: s.staff.map((x) => (x.id === member.id ? merged : x)) }));
          return merged;
        },
        removeStaff: async (id) => {
          if (!isApi()) return demoStaffUpdate((c) => c.filter((x) => x.id !== id));
          await api.deleteStaff(id);
          set((s) => ({ staff: s.staff.filter((x) => x.id !== id) }));
        },

        // Demo dates are generated relative to today.
        resetDemoData: () => {
          const demoCards = makeSeedCards();
          const demoStaff = staffData;
          set((s) => ({ demoCards, demoStaff, seeded: true, ...(s.source === "demo" ? { cards: demoCards, staff: demoStaff } : {}) }));
        },

        syncFromApi: async () => {
          const id = ++syncId;
          const [members, staff] = await Promise.all([getMembers(), getStaff()]);
          if (id !== syncId) return; // a newer login/logout started another sync
          if (members.source === "api" && staff.source === "api") {
            set({ cards: members.data, staff: staff.data, source: "api" });
          } else {
            if (!get().seeded) get().resetDemoData();
            set((s) => ({ cards: s.demoCards, staff: s.demoStaff, source: "demo" }));
          }
          set({ ready: true });
        },
      };
    },
    {
      name: "my-fitness-data",
      version: 2,
      // localStorage, or memory where storage is blocked (cross-site iframe).
      storage: createJSONStorage(() => safeStateStorage),
      // Only the demo copy is saved. Real members/staff from the API never touch localStorage.
      partialize: (s) => ({ demoCards: s.demoCards, demoStaff: s.demoStaff, seeded: s.seeded }),
      // v1 stored { cards, staff } (demo data only, from the old localStorage-only app).
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as { cards?: ICard[]; staff?: IStaff[]; seeded?: boolean };
        if (version < 2) return { demoCards: p.cards ?? [], demoStaff: p.staff ?? [], seeded: !!p.seeded };
        return persisted as Partial<DataState>;
      },
      // Rehydrated in the app shell after mount, so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded) state.resetDemoData();
        // Signed in with a real API: show nothing until the server answers (no flash of demo data).
        const session = loadSession();
        const waitForApi = !!session && !session.demo && !DEMO_MODE;
        useDataStore.setState((s) =>
          waitForApi ? { ready: false, cards: [], staff: [] } : { ready: true, cards: s.demoCards, staff: s.demoStaff, source: "demo" },
        );
        void useDataStore.getState().syncFromApi();
      },
    },
  ),
);

export default useDataStore;
