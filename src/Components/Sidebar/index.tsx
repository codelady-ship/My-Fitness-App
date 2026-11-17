"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowLeft, FiLogIn, FiLogOut, FiX } from "react-icons/fi";
import { links } from "../../../Mock/links";
import useSidebarStore from "../../../Store/SidebarStore";
import Logo from "../pulsa/Logo";
import { useSession } from "../pulsa/useSession";
import { logout } from "@/lib/api";

/** Glass sidebar. Desktop: sticky rail. Below 1024px: off-canvas drawer opened from the page header. */
const Sidebar = () => {
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const path = usePathname();
  const router = useRouter();
  const { session } = useSession();
  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      {mobileOpen && <div className="drawer-backdrop" aria-hidden onClick={() => setMobileOpen(false)} />}
      <aside id="sidebar" aria-label="Dashboard navigation" className={`app-side${mobileOpen ? " open" : ""}`}>
        <div className="app-side-inner glass">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px" }}>
            <Logo />
            <button type="button" className="icon-btn mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <FiX />
            </button>
          </div>

          <nav className="app-nav">
            <span className="group-label">My heart</span>
            <Link href={links[0].to} aria-current={isActive(links[0].to) ? "page" : undefined}>
              {React.createElement(links[0].icon, { "aria-hidden": true })}
              {links[0].title}
            </Link>
            <span className="group-label">Gym admin</span>
            {links.slice(1).map(({ id, title, to, icon }) => (
              <Link key={id} href={to} aria-current={isActive(to) ? "page" : undefined}>
                {React.createElement(icon, { "aria-hidden": true })}
                {title}
              </Link>
            ))}
          </nav>

          <div className="app-nav" style={{ marginTop: "auto" }}>
            <Link href="/">
              <FiArrowLeft aria-hidden /> Back to site
            </Link>
            {session ? (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 16, border: 0, color: "var(--ink-2)" }}
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                <FiLogOut aria-hidden style={{ fontSize: 19 }} /> Log out
              </button>
            ) : (
              <Link href="/login">
                <FiLogIn aria-hidden /> Log in
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
