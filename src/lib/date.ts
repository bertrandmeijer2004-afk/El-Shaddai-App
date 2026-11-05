/**
 * Utilitas tanggal. Semua tanggal disimpan/dioper sebagai string ISO "YYYY-MM-DD"
 * (tipe `date` di Postgres) sehingga bebas masalah zona waktu.
 * "Hari ini" selalu dihitung dalam WIB (UTC+7).
 */
import { HARI, type Hari } from "@/config/activities";

export const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

export const HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

export function parseISODate(s: unknown): { y: number; m: number; d: number } | null {
  if (typeof s !== "string") return null;
  const match = ISO_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return { y, m, d };
}

export function isValidISODate(s: unknown): s is string {
  return parseISODate(s) !== null;
}

export function toISO(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`;
}

function toUTCDate(iso: string): Date {
  const p = parseISODate(iso);
  if (!p) throw new Error(`Tanggal tidak valid: ${iso}`);
  return new Date(Date.UTC(p.y, p.m - 1, p.d));
}

function fromUTCDate(dt: Date): string {
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Tanggal hari ini menurut WIB. */
export function todayWIB(now: Date = new Date()): string {
  return fromUTCDate(new Date(now.getTime() + WIB_OFFSET_MS));
}

export function addDays(iso: string, n: number): string {
  return fromUTCDate(new Date(toUTCDate(iso).getTime() + n * DAY_MS));
}

/** Indeks hari, Senin = 0 ... Minggu = 6 */
export function hariIndex(iso: string): number {
  return (toUTCDate(iso).getUTCDay() + 6) % 7;
}

export function hariName(iso: string): Hari {
  return HARI[hariIndex(iso)];
}

/** Tanggal Senin pada minggu yang memuat `iso`. */
export function weekStart(iso: string): string {
  return addDays(iso, -hariIndex(iso));
}

export function weekDates(startIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
}

/** Tanggal pada minggu yang sama dengan `iso`, untuk hari tertentu. */
export function dateForHariInSameWeek(iso: string, hari: Hari): string {
  return addDays(weekStart(iso), HARI.indexOf(hari));
}

/** "5 November 2026" */
export function formatTanggal(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return iso;
  return `${p.d} ${BULAN[p.m - 1]} ${p.y}`;
}

/** "Kamis, 5 November 2026" */
export function formatTanggalPanjang(iso: string): string {
  if (!parseISODate(iso)) return iso;
  return `${hariName(iso)}, ${formatTanggal(iso)}`;
}

/** "5 November" */
export function formatTanggalPendek(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return iso;
  return `${p.d} ${BULAN[p.m - 1]}`;
}

/** "2 – 8 November 2026" atau "26 Oktober – 1 November 2026" */
export function formatRentangMinggu(startIso: string): string {
  const a = parseISODate(startIso);
  const b = parseISODate(addDays(startIso, 6));
  if (!a || !b) return startIso;
  if (a.m === b.m && a.y === b.y) return `${a.d} – ${b.d} ${BULAN[b.m - 1]} ${b.y}`;
  if (a.y === b.y) return `${a.d} ${BULAN[a.m - 1]} – ${b.d} ${BULAN[b.m - 1]} ${b.y}`;
  return `${a.d} ${BULAN[a.m - 1]} ${a.y} – ${b.d} ${BULAN[b.m - 1]} ${b.y}`;
}

const JAM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidJam(s: unknown): s is string {
  return typeof s === "string" && JAM_RE.test(s);
}

/** "19:00" -> "19.00" */
export function formatJamSatu(jam: string): string {
  return jam.replace(":", ".");
}

/** "19.00–21.00 WIB", "19.00 WIB", atau "" jika kosong. */
export function formatJam(mulai?: string, selesai?: string): string {
  const a = mulai && isValidJam(mulai) ? formatJamSatu(mulai) : "";
  const b = selesai && isValidJam(selesai) ? formatJamSatu(selesai) : "";
  if (a && b) return `${a}–${b} WIB`;
  if (a) return `${a} WIB`;
  if (b) return `s.d. ${b} WIB`;
  return "";
}

export function monthKey(y: number, m0: number): string {
  return `${y}-${pad(m0 + 1)}`;
}

export function addMonths(y: number, m0: number, delta: number): { y: number; m0: number } {
  const total = y * 12 + m0 + delta;
  return { y: Math.floor(total / 12), m0: ((total % 12) + 12) % 12 };
}

/**
 * Grid kalender (Senin pertama) untuk satu bulan.
 * Mengembalikan baris-baris minggu; tiap sel berisi tanggal ISO.
 */
export function monthGrid(y: number, m0: number): string[][] {
  const first = toISO(y, m0 + 1, 1);
  const start = weekStart(first);
  const lastDay = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  const last = toISO(y, m0 + 1, lastDay);
  const end = addDays(weekStart(last), 6);
  const rows: string[][] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 7)) rows.push(weekDates(cur));
  return rows;
}

export function monthGridRange(y: number, m0: number): { from: string; to: string } {
  const grid = monthGrid(y, m0);
  return { from: grid[0][0], to: grid[grid.length - 1][6] };
}

/** Tanggal berulang tiap 7 hari dari `start` sampai `until` (inklusif), maksimal `max`. */
export function weeklyDates(start: string, until: string, max = 52): string[] {
  const out: string[] = [];
  for (let cur = start; cur <= until && out.length < max; cur = addDays(cur, 7)) out.push(cur);
  return out;
}
