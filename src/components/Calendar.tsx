"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { describeActivity } from "@/lib/activity";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  BULAN,
  HARI_SINGKAT,
  addMonths,
  formatTanggalPanjang,
  monthGrid,
  monthGridRange,
  monthKey,
  parseISODate,
} from "@/lib/date";
import { getActivitiesBetween } from "@/lib/queries";
import type { ActivitySummary } from "@/lib/types";

export function Calendar({
  today,
  initialActivities,
}: {
  /** Tanggal hari ini (WIB) dari server */
  today: string;
  /** Kegiatan untuk rentang grid bulan berjalan */
  initialActivities: ActivitySummary[];
}) {
  const toast = useToast();
  const t = parseISODate(today)!;
  const [view, setView] = useState({ y: t.y, m0: t.m - 1 });
  const [cache, setCache] = useState<Record<string, ActivitySummary[]>>({
    [monthKey(t.y, t.m - 1)]: initialActivities,
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const requested = useRef(new Set<string>([monthKey(t.y, t.m - 1)]));

  const key = monthKey(view.y, view.m0);
  const grid = useMemo(() => monthGrid(view.y, view.m0), [view]);

  // Semua kegiatan dari bulan yang pernah dimuat, dikelompokkan per tanggal
  const byDate = useMemo(() => {
    const map = new Map<string, ActivitySummary[]>();
    for (const list of Object.values(cache)) {
      for (const a of list) {
        const arr = map.get(a.tanggal) ?? [];
        if (!arr.some((x) => x.id === a.id)) arr.push(a);
        map.set(a.tanggal, arr);
      }
    }
    return map;
  }, [cache]);

  const go = useCallback(
    async (delta: number) => {
      const next = addMonths(view.y, view.m0, delta);
      const nextKey = monthKey(next.y, next.m0);
      setView(next);
      if (requested.current.has(nextKey)) return;
      requested.current.add(nextKey);
      setLoadingKey(nextKey);
      try {
        const { from, to } = monthGridRange(next.y, next.m0);
        const list = await getActivitiesBetween(getBrowserClient(), from, to);
        setCache((c) => ({ ...c, [nextKey]: list }));
      } catch {
        requested.current.delete(nextKey); // izinkan coba lagi
        toast.error("Gagal memuat kegiatan bulan ini. Coba lagi.");
      } finally {
        setLoadingKey((k) => (k === nextKey ? null : k));
      }
    },
    [view, toast],
  );

  const selectedList = selected ? (byDate.get(selected) ?? []) : [];
  const loading = loadingKey === key;

  return (
    <div className="card p-4 sm:p-6" aria-busy={loading}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" className="btn btn-outline !w-11 !p-0" onClick={() => go(-1)} aria-label="Bulan sebelumnya">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 className="h-display text-center text-3xl sm:text-4xl" aria-live="polite">
          {BULAN[view.m0]} {view.y}
        </h3>
        <button type="button" className="btn btn-outline !w-11 !p-0" onClick={() => go(1)} aria-label="Bulan berikutnya">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5" role="group" aria-label={`Kalender ${BULAN[view.m0]} ${view.y}`}>
        {HARI_SINGKAT.map((h) => (
          <div key={h} className="py-2 text-[0.68rem] font-bold uppercase tracking-wideish text-muted sm:text-xs">
            {h}
          </div>
        ))}

        {grid.flat().map((iso) => {
          const p = parseISODate(iso)!;
          const inMonth = p.m - 1 === view.m0;
          const isToday = iso === today;
          const list = byDate.get(iso) ?? [];
          const count = list.length;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(iso)}
              aria-label={`${formatTanggalPanjang(iso)}${isToday ? ", hari ini" : ""}, ${count ? `${count} kegiatan` : "tidak ada kegiatan"}`}
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition duration-150 sm:rounded-2xl sm:text-base",
                "active:scale-95 active:border-white active:bg-ink active:text-white",
                isToday
                  ? "border-ink bg-primary text-ink dark:border-white"
                  : "border-transparent hover:border-accent hover:bg-surface",
                inMonth ? "text-fg" : "text-muted font-medium",
              ].join(" ")}
            >
              <span>{p.d}</span>
              {count > 0 && (
                <span className="absolute bottom-1.5 flex gap-0.5 sm:bottom-2" aria-hidden="true">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-ink" : "bg-link"}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-link" aria-hidden="true" /> Ada kegiatan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border-2 border-ink bg-primary dark:border-white" aria-hidden="true" /> Hari ini
        </span>
        {loading && <span role="status">Memuat…</span>}
      </p>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected ? formatTanggalPanjang(selected) : ""}>
        {selectedList.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-center font-semibold">Tidak ada kegiatan pada tanggal ini</p>
        ) : (
          <ul className="space-y-3">
            {selectedList.map((a, i) => {
              const desc = describeActivity(a.detail);
              return (
                <li key={a.id}>
                  <Link
                    href={`/kegiatan/${a.id}`}
                    data-autofocus={i === 0 ? true : undefined}
                    className="group block rounded-2xl border-2 border-line p-4 no-underline transition hover:border-accent hover:bg-surface active:border-white active:bg-ink active:text-white"
                  >
                    <span className="badge mb-2">{a.kategori}</span>
                    <span className="block text-base leading-snug">
                      <strong className="font-bold">{a.jenis}</strong>
                      {desc && <span className="text-muted group-active:text-white"> – {desc}</span>}
                    </span>
                    <span className="mt-2 block text-xs font-bold uppercase tracking-nav text-link group-active:text-white">
                      Lihat detail →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
