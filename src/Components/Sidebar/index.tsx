"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowLeft, FiLogIn, FiLogOut } from "react-icons/fi";
import { links } from "../../../Mock/links";
import useSidebarStore from "../../../Store/SidebarStore";
import Logo from "../pulsa/Logo";
import { useSession } from "../pulsa/useSession";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { logout } from "@/lib/api";

const item =
  "flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-foreground aria-[current=page]:font-semibold aria-[current=page]:text-background [&_svg]:size-[18px] [&_svg]:shrink-0";
const groupLabel = "px-3 pt-4 pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

/** Logo, the two link groups and the session links. Rendered in the desktop rail and in the phone drawer. */
const SidebarBody = () => {
  const path = usePathname();
  const router = useRouter();
  const { session } = useSession();
  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  return (
    <>
      <div className="px-2">
        <Logo />
      </div>

      <nav aria-label="Dashboard" className="grid gap-1">
        <span className={groupLabel}>My heart</span>
        <Link href={links[0].to} className={item} aria-current={isActive(links[0].to) ? "page" : undefined}>
          {React.createElement(links[0].icon, { "aria-hidden": true })}
          {links[0].title}
        </Link>
        {/* Gym admin is for coaches/admins; demo visitors (no session) can try it with demo data. */}
        {session?.user.role !== "member" && (
          <>
            <span className={groupLabel}>Gym admin</span>
            {links.slice(1).map(({ id, title, to, icon }) => (
              <Link key={id} href={to} className={item} aria-current={isActive(to) ? "page" : undefined}>
                {React.createElement(icon, { "aria-hidden": true })}
                {title}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto grid gap-1 border-t pt-3">
        <Link href="/" className={item}>
          <FiArrowLeft aria-hidden /> Back to site
        </Link>
        {session ? (
          <button
            type="button"
            className={item}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <FiLogOut aria-hidden /> Log out
          </button>
        ) : (
          <Link href="/login" className={item}>
            <FiLogIn aria-hidden /> Log in
          </Link>
        )}
      </div>
    </>
  );
};

/** Desktop: sticky rail. Below 1024px: a drawer (shadcn Sheet) opened from the page header. */
const Sidebar = () => {
  const { mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <>
      <aside
        id="sidebar"
        aria-label="Dashboard navigation"
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-r bg-background px-3 py-4 lg:flex"
      >
        <SidebarBody />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 max-w-[calc(100%-3rem)] gap-2 overflow-y-auto px-3 py-4 lg:hidden">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">Pages of the Pulsa dashboard</SheetDescription>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
