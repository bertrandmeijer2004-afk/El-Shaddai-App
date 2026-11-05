import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE } from "@/config/site";

/** Gerbang masuk. Pengguna yang sudah login dialihkan ke /beranda oleh middleware. */
export default function GatePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="container-page flex items-center justify-between py-4">
        <Logo href="/" />
        <ThemeToggle />
      </header>

      <main id="konten" className="flex flex-1 flex-col justify-center">
        <div className="container-page py-10 sm:py-16">
          <Reveal>
            <p className="eyebrow">Selamat datang</p>
            <h1 className="h-display mt-3 text-[clamp(3.5rem,14vw,9rem)]">{SITE.namaAplikasi}</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              {SITE.tagline}. Masuk untuk melihat jadwal kegiatan, petugas, dan Firman minggu ini.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            <Link href="/masuk" className="btn">
              Masuk sebagai Jemaat
            </Link>
            <Link href="/daftar" className="btn btn-outline">
              Daftar sebagai Jemaat
            </Link>
            <Link href="/admin/login" className="btn btn-outline">
              Masuk sebagai Admin
            </Link>
          </Reveal>
        </div>
      </main>

      <Marquee text={SITE.semboyan} repeat={6} />
    </div>
  );
}
