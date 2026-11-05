"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteActivity, duplicateFromPreviousWeek } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { HARI } from "@/config/activities";
import { getJamText, getLokasi } from "@/lib/activity";
import { addDays, formatRentangMinggu, formatTanggalPanjang, formatTanggalPendek, weekDates } from "@/lib/date";
import type { ActivitySummary } from "@/lib/types";

export function AdminDashboard({
  weekStart,
  today,
  activities,
}: {
  weekStart: string;
  today: string;
  activities: ActivitySummary[];
}) {
  const router = useRouter();
  const toast = useToast();
  const dates = weekDates(weekStart);
  const todayIdx = dates.indexOf(today);
  const [selected, setSelected] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [toDelete, setToDelete] = useState<ActivitySummary | null>(null);
  const [confirmDup, setConfirmDup] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    if (!toDelete || busy) return;
    setBusy(true);
    try {
      const res = await deleteActivity(toDelete.id);
      if (res.ok) {
        toast.success(res.message ?? "Kegiatan dihapus.");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal menghapus. Periksa koneksi Anda.");
    } finally {
      setBusy(false);
    }
  }

  async function doDuplicate() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await duplicateFromPreviousWeek(weekStart);
      if (res.ok) {
        toast.success(res.message ?? "Kegiatan disalin.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setConfirmDup(false);
    } catch {
      toast.error("Gagal menyalin. Periksa koneksi Anda.");
    } finally {
      setBusy(false);
    }
  }

  const navLink = (to: string, label: string, aria?: string) => (
    <Link href={`/admin?minggu=${to}`} className="btn btn-outline btn-sm" aria-label={aria}>
      {label}
    </Link>
  );

  return (
    <div>
      {/* Toolbar minggu */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Dashboard Admin</p>
          <h1 className="h-display mt-2 text-5xl sm:text-6xl">Jadwal Minggu</h1>
          <p className="mt-2 text-lg font-semibold" aria-live="polite">{formatRentangMinggu(weekStart)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {navLink(addDays(weekStart, -7), "← Sebelumnya", "Minggu sebelumnya")}
          {navLink(today, "Minggu Ini")}
          {navLink(addDays(weekStart, 7), "Berikutnya →", "Minggu berikutnya")}
          <button type="button" className="btn btn-sm" onClick={() => setConfirmDup(true)}>
            Duplikat dari Minggu Lalu
          </button>
        </div>
      </div>

      {/* Tab hari (ponsel/tablet) */}
      <div className="mt-8 xl:hidden">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0" role="tablist" aria-label="Hari dalam minggu">
          {HARI.map((h, i) => {
            const active = i === selected;
            const count = activities.filter((a) => a.tanggal === dates[i]).length;
            return (
              <button
                key={h}
                type="button"
                role="tab"
                id={`tab-${i}`}
                aria-selected={active}
                aria-controls={`panel-${i}`}
                onClick={() => setSelected(i)}
                className={`btn btn-sm shrink-0 ${active ? "" : "btn-outline"}`}
              >
                {h.slice(0, 3)} {formatTanggalPendek(dates[i]).split(" ")[0]}
                {count > 0 && <span className="rounded-full bg-ink px-1.5 text-[0.65rem] text-white dark:bg-white dark:text-ink">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kolom hari (desktop lebar menampilkan 7 kolom sekaligus) */}
      <div className="mt-4 grid gap-4 xl:mt-8 xl:grid-cols-7">
        {HARI.map((h, i) => {
          const iso = dates[i];
          const list = activities.filter((a) => a.tanggal === iso);
          const isToday = iso === today;
          return (
            <section
              key={h}
              id={`panel-${i}`}
              role="tabpanel"
              aria-labelledby={`tab-${i}`}
              aria-label={`${h}, ${formatTanggalPendek(iso)}`}
              className={`${i === selected ? "block" : "hidden"} card p-4 xl:block ${isToday ? "border-2 !border-accent" : ""}`}
            >
              <header className="mb-3">
                <h2 className="h-display text-3xl">{h}</h2>
                <p className="eyebrow mt-0.5">{formatTanggalPendek(iso)}</p>
                {isToday && <span className="badge mt-2">Hari ini</span>}
              </header>

              <ul className="space-y-3">
                {list.map((a) => {
                  const jam = getJamText(a.detail);
                  const lokasi = getLokasi(a.detail);
                  return (
                    <li key={a.id} className="rounded-2xl border-2 border-line bg-bg p-3">
                      <span className="badge !text-[0.6rem]">{a.kategori}</span>
                      <p className="mt-1.5 font-bold leading-snug">{a.jenis}</p>
                      <p className="mt-1 text-sm text-muted">{jam || "Jam belum diisi"}</p>
                      {lokasi && <p className="text-sm text-muted">{lokasi}</p>}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Link href={`/kegiatan/${a.id}`} className="btn btn-outline btn-sm !px-3">
                          Lihat
                        </Link>
                        <Link href={`/admin/kegiatan/${a.id}/edit`} className="btn btn-sm !px-3">
                          Edit
                        </Link>
                        <button type="button" className="btn btn-danger btn-sm !px-3" onClick={() => setToDelete(a)}>
                          Hapus
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {list.length === 0 && <p className="rounded-2xl bg-surface p-3 text-sm text-muted">Belum ada kegiatan.</p>}

              <Link href={`/admin/kegiatan/baru?tanggal=${iso}`} className="btn btn-outline btn-sm mt-3 w-full !px-3">
                + Tambah Kegiatan
              </Link>
            </section>
          );
        })}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Hapus kegiatan?"
        confirmLabel="Ya, Hapus"
        danger
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <p>
            <strong>{toDelete.jenis}</strong> pada {formatTanggalPanjang(toDelete.tanggal)} akan dihapus beserta
            Firman dan foto galerinya. Tindakan ini tidak dapat dibatalkan.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDup}
        title="Duplikat dari minggu lalu?"
        confirmLabel="Ya, Duplikat"
        loading={busy}
        onConfirm={doDuplicate}
        onCancel={() => setConfirmDup(false)}
      >
        <p>
          Kegiatan minggu {formatRentangMinggu(addDays(weekStart, -7))} akan disalin ke minggu ini (detail dan foto
          sampul). Firman dan galeri tidak ikut disalin, dan kegiatan yang sudah ada dilewati.
        </p>
      </ConfirmDialog>
    </div>
  );
}
