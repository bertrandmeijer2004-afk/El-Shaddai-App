import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Cover } from "@/components/Cover";
import { Gallery } from "@/components/Gallery";
import { Reveal } from "@/components/Reveal";
import { getDetailRows, getPengumuman } from "@/lib/activity";
import { getSession } from "@/lib/auth";
import { formatTanggalPanjang } from "@/lib/date";
import { getActivityFull, isUuid } from "@/lib/queries";
import { richToText, sanitizeRich } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const load = cache(async (id: string) => {
  const { supabase, profile } = await getSession();
  const activity = await getActivityFull(supabase, id);
  return { activity, isAdmin: profile?.role === "admin" };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Kegiatan tidak ditemukan" };
  const { activity } = await load(id);
  return { title: activity ? activity.jenis : "Kegiatan tidak ditemukan" };
}

export default async function KegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { activity, isAdmin } = await load(id);
  if (!activity) notFound();

  const rows = getDetailRows(activity.jenis, activity.detail);
  const pengumuman = getPengumuman(activity.detail);
  const sermon = activity.sermon;
  const sermonHtml = sermon ? sanitizeRich(sermon.isi) : "";
  const hasFirman = !!sermon && !!(sermon.judul || sermon.ayat || richToText(sermonHtml));

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[55svh] items-end overflow-hidden bg-ink text-white">
        <Cover url={activity.cover_url} className="absolute inset-0 -z-20 h-full w-full" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
        <div className="container-page pb-10 pt-24 sm:pb-14">
          <Link href="/beranda#minggu-ini" className="text-xs font-bold uppercase tracking-nav text-primary no-underline hover:underline">
            ← Kembali ke jadwal
          </Link>
          <div className="mt-5">
            <span className="badge">{activity.kategori}</span>
          </div>
          <h1 className="h-display mt-4 text-[clamp(3rem,11vw,8rem)]">{activity.jenis}</h1>
          <p className="mt-3 text-lg font-semibold text-white/90">{formatTanggalPanjang(activity.tanggal)}</p>
        </div>
      </section>

      <div className="container-page grid gap-14 py-14 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div className="space-y-14">
          {/* PENGUMUMAN */}
          {pengumuman && (
            <Reveal>
              <h2 className="h-display text-4xl sm:text-5xl">Pengumuman</h2>
              <p className="mt-4 whitespace-pre-line rounded-3xl bg-surface p-6 text-lg leading-relaxed">{pengumuman}</p>
            </Reveal>
          )}

          {/* FIRMAN */}
          {hasFirman && sermon && (
            <Reveal>
              <p className="eyebrow">Firman</p>
              <h2 className="h-display mt-2 text-4xl sm:text-6xl">{sermon.judul || "Firman Tuhan"}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {sermon.ayat && <span className="badge">{sermon.ayat}</span>}
                {sermon.pembicara && (
                  <span className="text-sm font-bold uppercase tracking-wideish text-muted">Pembicara: {sermon.pembicara}</span>
                )}
              </div>
              {sermonHtml && (
                <div className="prose-firman mt-6 max-w-2xl" dangerouslySetInnerHTML={{ __html: sermonHtml }} />
              )}
            </Reveal>
          )}

          {/* GALERI */}
          {activity.photos.length > 0 && (
            <Reveal>
              <h2 className="h-display text-4xl sm:text-5xl">Galeri Foto</h2>
              <div className="mt-6">
                <Gallery photos={activity.photos.map((p) => ({ id: p.id, url: p.url }))} title={activity.jenis} />
              </div>
            </Reveal>
          )}

          {!pengumuman && !hasFirman && activity.photos.length === 0 && rows.length === 0 && (
            <p className="rounded-2xl bg-surface px-5 py-4 text-muted">Detail kegiatan ini belum diisi.</p>
          )}
        </div>

        {/* DETAIL BERLABEL */}
        {rows.length > 0 && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal className="card p-6">
              <h2 className="h-display text-3xl">Detail Kegiatan</h2>
              <dl className="mt-4 divide-y divide-line">
                {rows.map((r) => (
                  <div key={r.key} className="py-3">
                    <dt className="eyebrow">{r.label}</dt>
                    <dd className="mt-1 text-base font-semibold">{r.value}</dd>
                  </div>
                ))}
              </dl>
              {isAdmin && (
                <Link href={`/admin/kegiatan/${activity.id}/edit`} className="btn btn-outline btn-sm mt-5 w-full">
                  Edit Kegiatan
                </Link>
              )}
            </Reveal>
          </aside>
        )}
      </div>
    </>
  );
}
