import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UiState = {
  /** desktop: sidebar expanded (labels visible) */
  isOpen: boolean;
  toggleSidebar: () => void;
  /** phone/tablet: drawer open */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** kept for the SweetAlert2 helpers; the Pulsa design is light-only */
  darkMode: boolean;
  toggleTheme: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

const useSidebarStore = create<UiState>()(
  persist(
    (set) => ({
      isOpen: true,
      toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),
      mobileOpen: false,
      setMobileOpen: (open) => set({ mobileOpen: open }),
      darkMode: false,
      toggleTheme: () => set((s) => ({ darkMode: !s.darkMode })),
      searchTerm: "",
      setSearchTerm: (term) => set({ searchTerm: term }),
    }),
    {
      name: "my-fitness-ui",
      storage: createJSONStorage(() => localStorage),
      // Only remember preferences, not transient UI state.
      partialize: (s) => ({ isOpen: s.isOpen }),
      // Rehydrated in ClientShell after mount, so server and first client render match.
      skipHydration: true,
    },
  ),
);

export default useSidebarStore;
