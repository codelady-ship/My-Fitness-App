"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import { links } from "../../../Mock/links";
import useSidebarStore from "../../../Store/SidebarStore";

/**
 * Desktop (md+): sticky rail that can be expanded (labels) or collapsed (icons).
 * Phone/tablet: hidden off-canvas drawer opened from the navbar.
 */
const Sidebar = () => {
  const { isOpen, toggleSidebar, darkMode, mobileOpen, setMobileOpen } = useSidebarStore();
  const path = usePathname();

  const isActive = (to: string) => path === to || path.startsWith(to + "/");
  // In the phone drawer labels are always shown.
  const showLabels = isOpen || mobileOpen;

  return (
    <>
      {/* backdrop for the phone drawer */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isOpen ? "md:w-60" : "md:w-20"} ${darkMode ? "border-gray-700 bg-black" : "border-amber-200 bg-yellow-50"}`}
      >
        <div className="flex h-16 items-center px-4">
          {/* desktop: expand / collapse */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden rounded-md p-2 text-2xl md:block"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isOpen}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
          {/* phone: close drawer */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-2xl md:hidden"
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {links.map(({ id, title, to, icon }) => (
            <Link
              key={id}
              href={to}
              title={title}
              aria-current={isActive(to) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg p-3 font-semibold ${showLabels ? "" : "md:justify-center"} ${
                isActive(to)
                  ? "bg-amber-500 text-white"
                  : darkMode
                    ? "text-gray-100 hover:bg-gray-800"
                    : "text-gray-800 hover:bg-amber-100"
              }`}
            >
              <span className="text-2xl">{React.createElement(icon)}</span>
              <span className={`text-lg ${showLabels ? "" : "md:sr-only"}`}>{title}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
