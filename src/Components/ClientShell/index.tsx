"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../Sidebar";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";

/**
 * Client wrapper for the dashboard area: reads saved data from localStorage (then the API)
 * and renders the glass sidebar. Kept separate so layouts can stay Server Components.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const pathname = usePathname();

  useEffect(() => {
    useSidebarStore.persist.rehydrate();
    useDataStore.persist.rehydrate();
  }, []);

  // Close the phone drawer after navigating.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  return (
    <div className="app">
      <Sidebar />
      <main id="main" className="app-main">
        {children}
      </main>
    </div>
  );
}
