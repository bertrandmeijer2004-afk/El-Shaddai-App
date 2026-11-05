import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { profile } = await getSession();

  const links = [
    { href: "/beranda#minggu-ini", label: "Jadwal" },
    { href: "/beranda#kalender", label: "Kalender" },
    { href: "/beranda#firman", label: "Firman" },
    ...(profile?.role === "admin" ? [{ href: "/admin", label: "Panel Admin" }] : []),
  ];

  return (
    <>
      <Navbar links={links} nama={profile?.nama} />
      <main id="konten">{children}</main>
      <Footer />
    </>
  );
}
