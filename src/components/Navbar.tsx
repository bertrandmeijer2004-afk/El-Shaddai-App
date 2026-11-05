"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavLink {
  href: string;
  label: string;
}

export function Navbar({
  links,
  nama,
  homeHref = "/beranda",
  badge,
}: {
  links: NavLink[];
  nama?: string;
  homeHref?: string;
  /** Penanda area, mis. "Admin" */
  badge?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Tutup menu saat pindah halaman
  useEffect(() => setOpen(false), [pathname]);

  const linkClass =
    "rounded-full px-3 py-2 text-xs font-bold uppercase tracking-nav text-fg no-underline transition hover:bg-primary hover:text-ink active:bg-ink active:text-white dark:active:ring-2 dark:active:ring-white";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo href={homeHref} />
          {badge && <span className="badge hidden sm:inline-flex">{badge}</span>}
        </div>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {nama && <span className="hidden max-w-[10rem] truncate text-sm text-muted xl:inline">Halo, {nama}</span>}
          <ThemeToggle />
          <div className="hidden lg:block">
            <LogoutButton />
          </div>
          <button
            type="button"
            className="btn btn-outline !w-11 !p-0 lg:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Menu seluler" className="border-t border-line bg-bg lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {nama && <p className="px-3 pb-2 text-sm text-muted">Halo, {nama}</p>}
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`${linkClass} py-3 text-sm`}>
                {l.label}
              </Link>
            ))}
            <div className="px-3 pt-2">
              <LogoutButton className="btn btn-outline btn-sm w-full" />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
