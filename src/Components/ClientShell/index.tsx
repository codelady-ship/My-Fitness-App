"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../Sidebar";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import { useSession } from "../pulsa/useSession";

/**
 * Client wrapper for the dashboard area: reads saved data from localStorage (then the API)
 * and renders the glass sidebar. Kept separate so layouts can stay Server Components.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const pathname = usePathname();
  const { session } = useSession();
  // Visible note for the public demo: the sandbox (API down) keeps changes in this browser only;
  // the read-only demo admin (API up) has every write refused by the server.
  const demoNote = session?.user.readOnly
    ? "Demo admin (read-only): changes are not saved."
    : session?.demo
      ? "Demo mode: changes stay in this browser and are not saved to a server."
      : null;

  useEffect(() => {
    useSidebarStore.persist.rehydrate();
    useDataStore.persist.rehydrate();
    // Login/logout (here or in another tab): reload members/staff for the new session.
    // After logout this switches back to the demo copy, so no API data stays on screen.
    const resync = () => void useDataStore.getState().syncFromApi();
    // Only the session key: data writes in another tab must not trigger a sync ping-pong.
    const onStorage = (e: StorageEvent) => e.key === "pulsa-session" && resync();
    window.addEventListener("pulsa-session", resync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pulsa-session", resync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Close the phone drawer after navigating.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  return (
    <div className="app">
      <Sidebar />
      <main id="main" className="app-main">
        {demoNote && (
          <p role="status" className="badge badge-coral demo-note">
            {demoNote}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
