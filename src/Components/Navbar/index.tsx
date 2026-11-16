"use client";
import Link from "next/link";
import { FaBars, FaMoon, FaSun } from "react-icons/fa";
import useSidebarStore from "../../../Store/SidebarStore";

const Navbar = () => {
  const { darkMode, toggleTheme, setMobileOpen } = useSidebarStore();

  return (
    <header
      className={`sticky top-0 z-20 border-b px-4 sm:px-6 ${
        darkMode ? "border-gray-700 bg-black" : "border-amber-200 bg-yellow-50"
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-xl md:hidden"
            aria-label="Open menu"
            aria-controls="sidebar"
          >
            <FaBars />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
            My Fitness <span aria-hidden>🏋️</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-full bg-amber-500 font-semibold text-white"
            >
              A
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="font-semibold">Admin</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-amber-800"}`}>Front desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full p-2 text-lg ${darkMode ? "text-yellow-300 hover:bg-gray-800" : "text-amber-700 hover:bg-amber-100"}`}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            title={darkMode ? "Light theme" : "Dark theme"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
