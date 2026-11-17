"use client";
import { FiMenu } from "react-icons/fi";
import useSidebarStore from "../../../Store/SidebarStore";
import { useSession } from "../pulsa/useSession";

/** Glass title bar at the top of every dashboard page (holds the page's single h1). */
const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { session } = useSession();
  const name = session?.user.name ?? "Guest";

  return (
    <header className="app-top glass">
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <button
          type="button"
          className="icon-btn mobile-only"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-controls="sidebar"
        >
          <FiMenu />
        </button>
        <h1>{title}</h1>
      </div>
      <div className="actions">
        {children}
        <div className="user-chip">
          <span className="initial" aria-hidden="true">
            {name[0]?.toUpperCase()}
          </span>
          <span className="who">
            <b>{name}</b>
            <span className="muted">
              {session ? (session.user.role === "admin" ? "Admin" : "Member") + (session.demo ? " · demo" : "") : "Demo mode"}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
