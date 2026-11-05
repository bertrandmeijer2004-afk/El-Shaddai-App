import Link from "next/link";
import type { ReactNode } from "react";
import { Cover } from "@/components/Cover";
import { getJamText, getLokasi } from "@/lib/activity";
import { formatTanggalPanjang } from "@/lib/date";
import type { ActivitySummary } from "@/lib/types";

function Row({ icon, children }: { icon: "clock" | "pin"; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon === "clock" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        ) : (
          <>
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </>
        )}
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function ActivityCard({ activity }: { activity: ActivitySummary }) {
  const jam = getJamText(activity.detail);
  const lokasi = getLokasi(activity.detail);

  return (
    <article className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Cover
          url={activity.cover_url}
          className="h-full w-full transition duration-700 ease-out group-hover:scale-105"
        />
        <span className="badge absolute left-3 top-3 shadow">{activity.kategori}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="h-display text-3xl">{activity.jenis}</h3>
        <p className="mt-2 text-xs font-bold uppercase tracking-wideish text-fg">
          {formatTanggalPanjang(activity.tanggal)}
        </p>
        <div className="mt-3 space-y-1.5">
          <Row icon="clock">{jam || "Jam akan diumumkan"}</Row>
          {lokasi && <Row icon="pin">{lokasi}</Row>}
        </div>
        <Link
          href={`/kegiatan/${activity.id}`}
          className="btn btn-sm mt-5 self-start"
          aria-label={`Lihat detail ${activity.jenis}, ${formatTanggalPanjang(activity.tanggal)}`}
        >
          Lihat Detail
        </Link>
      </div>
    </article>
  );
}
