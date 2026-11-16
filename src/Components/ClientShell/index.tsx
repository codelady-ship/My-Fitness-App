"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";

/**
 * Client wrapper for the whole app: reads saved data and preferences from
 * localStorage, applies the light/dark theme and renders the sidebar + navbar.
 * Kept separate so that the root layout can stay a Server Component and export metadata.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const pathname = usePathname();

  useEffect(() => {
    useSidebarStore.persist.rehydrate();
    useDataStore.persist.rehydrate();
  }, []);

  // Close the phone drawer after navigating.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <div className={`flex min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
