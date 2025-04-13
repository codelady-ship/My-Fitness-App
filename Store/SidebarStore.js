// src/Store/SidebarStore.ts
import { create } from "zustand";

const useSidebarStore = create((set) => ({
  isOpen: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),

  darkMode: false,
  toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),

  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
}));

export default useSidebarStore;
