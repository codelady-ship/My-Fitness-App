// src/Store/SidebarStore.ts
import { create } from "zustand";

const useSidebarStore = create((set) => ({
  isOpen: false,  
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),  // Toggle sidebar 
  darkMode: false, 
  toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),  // Toggle dark mode
}));

export default useSidebarStore;
