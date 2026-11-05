import { FIELDS, getFieldsFor } from "@/config/activities";
import { formatJam } from "@/lib/date";
import type { ActivityDetail, Jam } from "@/lib/types";

function asText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function getLokasi(detail: ActivityDetail | null | undefined): string {
  return asText(detail?.lokasi);
}

export function getJamParts(detail: ActivityDetail | null | undefined): Jam {
  const v = detail?.jam;
  if (v && typeof v === "object") return { mulai: asText(v.mulai), selesai: asText(v.selesai) };
  return {};
}

/** "19.00–21.00 WIB" atau "" */
export function getJamText(detail: ActivityDetail | null | undefined): string {
  const j = getJamParts(detail);
  return formatJam(j.mulai, j.selesai);
}

/** Jam mulai untuk pengurutan; kegiatan tanpa jam diletakkan paling akhir. */
export function jamSortKey(detail: ActivityDetail | null | undefined): string {
  const j = getJamParts(detail);
  return j.mulai || j.selesai || "99:99";
}

/** "Lokasi: Aula Gereja, Pukul 19.00–21.00 WIB" */
export function describeActivity(detail: ActivityDetail | null | undefined): string {
  const parts: string[] = [];
  const lokasi = getLokasi(detail);
  const jam = getJamText(detail);
  if (lokasi) parts.push(`Lokasi: ${lokasi}`);
  if (jam) parts.push(jam.startsWith("s.d.") ? jam : `Pukul ${jam}`);
  return parts.join(", ");
}

export interface DetailRow {
  key: string;
  label: string;
  value: string;
}

/** Baris berlabel untuk halaman detail: hanya field yang terisi, urutan sesuai konfigurasi. Pengumuman dikecualikan (ditampilkan terpisah). */
export function getDetailRows(jenis: string, detail: ActivityDetail | null | undefined): DetailRow[] {
  const rows: DetailRow[] = [];
  for (const f of getFieldsFor(jenis)) {
    if (f.type === "textarea") continue;
    let value = "";
    if (f.type === "jam") value = getJamText(detail);
    else value = asText(detail?.[f.key]);
    if (value) rows.push({ key: f.key, label: FIELDS[f.key].label, value });
  }
  return rows;
}

export function getPengumuman(detail: ActivityDetail | null | undefined): string {
  return asText(detail?.pengumuman);
}

export function sortActivities<T extends { detail: ActivityDetail; tanggal: string; jenis: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      a.tanggal.localeCompare(b.tanggal) ||
      jamSortKey(a.detail).localeCompare(jamSortKey(b.detail)) ||
      a.jenis.localeCompare(b.jenis),
  );
}
