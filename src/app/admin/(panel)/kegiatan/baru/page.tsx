import type { Metadata } from "next";
import Link from "next/link";
import { ActivityForm } from "@/components/admin/ActivityForm";
import { isValidISODate, todayWIB, weekStart } from "@/lib/date";

export const metadata: Metadata = { title: "Tambah Kegiatan" };

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ tanggal?: string }> }) {
  const { tanggal } = await searchParams;
  const defaultDate = isValidISODate(tanggal) ? tanggal : todayWIB();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin?minggu=${weekStart(defaultDate)}`} className="link-anim text-sm font-bold">
        ← Kembali ke dashboard
      </Link>
      <h1 className="h-display mb-8 mt-4 text-5xl sm:text-6xl">Tambah Kegiatan</h1>
      <ActivityForm defaultDate={defaultDate} />
    </div>
  );
}
