import type { SupabaseClient } from "@supabase/supabase-js";
import { sortActivities } from "@/lib/activity";
import { addDays } from "@/lib/date";
import type { ActivityFull, ActivityPhoto, ActivitySummary, Sermon } from "@/lib/types";

export const SUMMARY_COLUMNS = "id, tanggal, hari, kategori, jenis, detail, cover_url";

export async function getActivitiesBetween(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<ActivitySummary[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(SUMMARY_COLUMNS)
    .gte("tanggal", from)
    .lte("tanggal", to);
  if (error) throw new Error(`Gagal memuat kegiatan: ${error.message}`);
  return sortActivities((data ?? []) as ActivitySummary[]);
}

export async function getWeekActivities(supabase: SupabaseClient, weekStartIso: string) {
  return getActivitiesBetween(supabase, weekStartIso, addDays(weekStartIso, 6));
}

export interface FirmanTerbaru {
  activity_id: string;
  tanggal: string;
  jenis: string;
  judul: string;
  ayat: string;
  isi: string;
  pembicara: string;
}

type EmbeddedSermon = Pick<Sermon, "judul" | "ayat" | "isi" | "pembicara">;

/** Firman dari kegiatan yang sudah berlangsung (tanggal <= hari ini), terbaru lebih dulu. */
export async function getFirmanTerbaru(
  supabase: SupabaseClient,
  today: string,
  limit = 3,
): Promise<FirmanTerbaru[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("id, tanggal, jenis, sermons!inner(judul, ayat, isi, pembicara)")
    .lte("tanggal", today)
    .order("tanggal", { ascending: false })
    .limit(limit * 3);
  if (error) throw new Error(`Gagal memuat Firman: ${error.message}`);

  const rows: FirmanTerbaru[] = [];
  for (const r of (data ?? []) as unknown as Array<{
    id: string;
    tanggal: string;
    jenis: string;
    sermons: EmbeddedSermon | EmbeddedSermon[] | null;
  }>) {
    const s = Array.isArray(r.sermons) ? r.sermons[0] : r.sermons;
    if (!s) continue;
    rows.push({ activity_id: r.id, tanggal: r.tanggal, jenis: r.jenis, ...s });
  }
  return rows.slice(0, limit);
}

export async function getActivityFull(supabase: SupabaseClient, id: string): Promise<ActivityFull | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("*, sermons(*), activity_photos(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Record<string, unknown> & {
    sermons: Sermon | Sermon[] | null;
    activity_photos: ActivityPhoto[] | null;
  };
  const { sermons, activity_photos, ...activity } = row;
  const sermon = Array.isArray(sermons) ? (sermons[0] ?? null) : sermons;
  const photos = [...(activity_photos ?? [])].sort((a, b) => a.urutan - b.urutan);
  return { ...(activity as unknown as ActivityFull), sermon, photos };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);
