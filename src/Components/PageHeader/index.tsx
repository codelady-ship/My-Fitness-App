"use client";
import { FiMenu } from "react-icons/fi";
import useSidebarStore from "../../../Store/SidebarStore";
import { useSession } from "../pulsa/useSession";
import { Button } from "../ui/button";

/** Title bar at the top of every dashboard page (holds the page's single h1). */
const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const { session } = useSession();
  const name = session?.user.name ?? "Guest";

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
        >
          <FiMenu aria-hidden className="size-5" />
        </Button>
        <h1 className="font-heading text-[22px] leading-none font-extrabold tracking-[-0.03em] break-words uppercase sm:text-[26px]">{title}</h1>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {children}
        <div className="flex items-center gap-2.5 pl-1">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {name[0]?.toUpperCase()}
          </span>
          <span className="hidden text-[13px] leading-tight sm:block">
            <b className="block text-sm font-semibold">{name}</b>
            <span className="text-muted-foreground">
              {session ? (session.user.role === "admin" ? "Admin" : "Member") + (session.demo ? " · demo" : "") : "Demo mode"}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
