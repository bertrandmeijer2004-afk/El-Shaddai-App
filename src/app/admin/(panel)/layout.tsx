import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  // Pemeriksaan kedua setelah middleware (defense in depth).
  const { user, profile } = await getSession();
  if (!user) redirect("/admin/login");
  if (profile?.role !== "admin") redirect("/beranda");

  return (
    <>
      <Navbar
        homeHref="/admin"
        badge="Admin"
        nama={profile.nama}
        links={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/kegiatan/baru", label: "Tambah Kegiatan" },
          { href: "/beranda", label: "Lihat Situs" },
        ]}
      />
      <main id="konten" className="container-page py-10 sm:py-14">
        {children}
      </main>
    </>
  );
}
