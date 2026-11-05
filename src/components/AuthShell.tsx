import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Kerangka halaman masuk/daftar: header minimal + kartu di tengah. */
export function AuthShell({
  title,
  subtitle,
  children,
  logoHref = "/",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  logoHref?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="container-page flex items-center justify-between py-4">
        <Logo href={logoHref} />
        <ThemeToggle />
      </header>
      <main id="konten" className="container-page flex flex-1 items-center justify-center pb-12 pt-4">
        <div className="card w-full max-w-md p-6 shadow-sm sm:p-8">
          <h1 className="h-display text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
