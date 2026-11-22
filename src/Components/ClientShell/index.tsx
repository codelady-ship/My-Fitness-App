"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { InfoIcon } from "lucide-react";
import Sidebar from "../Sidebar";
import { Toaster } from "../ui/sonner";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import { useSession } from "../pulsa/useSession";

/**
 * Client wrapper for the dashboard area: reads saved data from localStorage (then the API)
 * and renders the sidebar. Kept separate so layouts can stay Server Components.
 * `.admin-shell` is what src/app/(app)/admin.css keys the white page and the admin tokens on.
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
    <div className="admin-shell flex min-h-dvh bg-background text-foreground">
      <Sidebar />
      <main id="main" className="flex min-w-0 flex-1 flex-col">
        {demoNote && (
          <p role="status" className="flex items-start gap-2 border-b border-[#ffd9d2] bg-accent px-4 py-2.5 text-sm leading-snug font-medium text-[#8f2a1b] sm:px-6 lg:px-8">
            <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {demoNote}
          </p>
        )}
        <div className="flex-1 px-4 pb-12 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
