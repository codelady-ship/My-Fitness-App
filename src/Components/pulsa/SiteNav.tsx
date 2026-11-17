"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { CloseIcon, MenuIcon } from "./Icons";
import { SITE_LINKS } from "@/lib/site";

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const current = (href: string): "page" | undefined => ((href === "/" ? path === "/" : path.startsWith(href)) ? "page" : undefined);

  return (
    <header className="site-nav">
      <Logo />
      <nav aria-label="Main">
        <ul className="nav-links glass">
          {SITE_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={current(l.href)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="nav-right">
        <Link href="/contact" className="btn btn-glass hide-xs" aria-current={current("/contact")}>
          Contact us
        </Link>
        <button
          ref={button}
          type="button"
          className="icon-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <div ref={panel} id="site-menu" className="menu-panel glass">
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" aria-current={current("/contact")}>
            Contact us
          </Link>
          <hr />
          <Link href="/login">Log in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      )}
    </header>
  );
}
