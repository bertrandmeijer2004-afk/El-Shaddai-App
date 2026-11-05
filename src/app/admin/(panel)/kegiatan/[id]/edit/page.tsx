import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/admin/ActivityForm";
import { getSession } from "@/lib/auth";
import { weekStart } from "@/lib/date";
import { getActivityFull, isUuid } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit Kegiatan" };

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { supabase } = await getSession();
  const activity = await getActivityFull(supabase, id);
  if (!activity) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin?minggu=${weekStart(activity.tanggal)}`} className="link-anim text-sm font-bold">
        ← Kembali ke dashboard
      </Link>
      <h1 className="h-display mb-8 mt-4 text-5xl sm:text-6xl">Edit Kegiatan</h1>
      <ActivityForm
        defaultDate={activity.tanggal}
        initial={{
          id: activity.id,
          tanggal: activity.tanggal,
          jenis: activity.jenis,
          detail: activity.detail ?? {},
          coverUrl: activity.cover_url,
          gallery: activity.photos.map((p) => ({ id: p.id, url: p.url })),
          sermon: {
            judul: activity.sermon?.judul ?? "",
            ayat: activity.sermon?.ayat ?? "",
            isi: activity.sermon?.isi ?? "",
            pembicara: activity.sermon?.pembicara ?? "",
          },
        }}
      />
    </div>
  );
}
