import Link from "next/link";
import { SITE } from "@/config/site";

export function Logo({ href = "/beranda", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 no-underline ${className}`} aria-label={`${SITE.namaAplikasi}, ke beranda`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-ink transition group-hover:bg-accent group-active:bg-ink group-active:text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 3v18M6 9h12" />
        </svg>
      </span>
      <span className="font-display text-2xl uppercase leading-none tracking-wideish text-fg">{SITE.nama}</span>
    </Link>
  );
}
