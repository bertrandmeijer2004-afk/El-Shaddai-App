"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { findConflict, LIMITS } from "@/config/activities";
import { addDays, hariIndex, hariName, isValidISODate, weekStart, weeklyDates } from "@/lib/date";
import { isUuid } from "@/lib/queries";
import { richToText, sanitizeRich } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET, photoUrlPrefix, storagePathFromUrl } from "@/lib/supabase/env";
import type { ActionResult, ActivityDetail, ActivityInput } from "@/lib/types";
import { validateActivityInput, type ValidatedActivity } from "@/lib/validation";

// ---------- helper ----------

type AdminContext =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; error: string };

/** Setiap action memeriksa role di server. RLS di database adalah lapisan kedua. */
async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk kembali." };

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") return { ok: false, error: "Anda tidak memiliki izin untuk tindakan ini." };
  return { ok: true, supabase, userId: user.id };
}

function dbError(error: { code?: string; message: string }): ActionResult {
  if (error.code === "23505") {
    return {
      ok: false,
      error: "Kegiatan dengan jenis ini sudah ada pada tanggal tersebut.",
      fieldErrors: { jenis: "Sudah ada pada tanggal ini." },
    };
  }
  if (error.code === "42501") return { ok: false, error: "Anda tidak memiliki izin untuk tindakan ini." };
  console.error("[admin action] database error:", error.code, error.message);
  return { ok: false, error: "Terjadi kesalahan pada database. Coba lagi." };
}

function refreshPages(id?: string) {
  revalidatePath("/beranda");
  revalidatePath("/admin");
  if (id) revalidatePath(`/kegiatan/${id}`);
}

/** Hapus file dari Storage hanya jika tidak lagi dipakai kegiatan mana pun (cover/galeri bisa dibagi antar salinan). */
async function removeUnreferencedFiles(supabase: SupabaseClient, urls: Array<string | null | undefined>) {
  try {
    const paths: string[] = [];
    for (const url of new Set(urls.filter((u): u is string => !!u))) {
      const path = storagePathFromUrl(url);
      if (!path) continue;
      const [cover, photo] = await Promise.all([
        supabase.from("activities").select("id", { count: "exact", head: true }).eq("cover_url", url),
        supabase.from("activity_photos").select("id", { count: "exact", head: true }).eq("url", url),
      ]);
      if (!cover.count && !photo.count) paths.push(path);
    }
    if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  } catch (e) {
    console.error("[admin action] gagal membersihkan file:", e);
  }
}

function hasFirman(s: { judul: string; ayat: string; isi: string }): boolean {
  return !!(s.judul || s.ayat || richToText(s.isi));
}

// ---------- simpan (buat / ubah) ----------

export async function saveActivity(raw: ActivityInput): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { supabase, userId } = ctx;

  const v = validateActivityInput(raw, { photoPrefix: photoUrlPrefix() });
  if (!v.ok) return { ok: false, error: v.error, fieldErrors: v.fieldErrors };
  const d = v.data;

  const sermon = { ...d.sermon, isi: sanitizeRich(d.sermon.isi) };
  const withSermon = hasFirman(sermon);

  const editingId = raw && typeof raw === "object" && "id" in raw && raw.id ? raw.id : undefined;
  if (editingId !== undefined) {
    if (!isUuid(editingId)) return { ok: false, error: "ID kegiatan tidak valid." };
    return updateActivity(supabase, editingId, d, sermon, withSermon);
  }
  return createActivity(supabase, userId, d, sermon, withSermon);
}

async function createActivity(
  supabase: SupabaseClient,
  userId: string,
  d: ValidatedActivity,
  sermon: ValidatedActivity["sermon"],
  withSermon: boolean,
): Promise<ActionResult> {
  const dates = d.repeatUntil ? weeklyDates(d.tanggal, d.repeatUntil, LIMITS.repeatMaxWeeks + 1) : [d.tanggal];

  // Kegiatan yang sudah ada pada tanggal-tanggal tsb (untuk cek duplikat dan bentrok hari "ATAU")
  const { data: existing, error: exErr } = await supabase
    .from("activities")
    .select("tanggal, jenis")
    .in("tanggal", dates);
  if (exErr) return dbError(exErr);

  const byDate = new Map<string, { jenis: string }[]>();
  for (const e of existing ?? []) {
    const list = byDate.get(e.tanggal) ?? [];
    list.push({ jenis: e.jenis });
    byDate.set(e.tanggal, list);
  }

  const primaryConflict = findConflict(d.hari, d.jenis, byDate.get(d.tanggal) ?? []);
  if (primaryConflict) {
    return { ok: false, error: primaryConflict, fieldErrors: { jenis: primaryConflict } };
  }

  const freeDates = dates.filter((t) => !findConflict(hariName(t), d.jenis, byDate.get(t) ?? []));
  const skipped = dates.length - freeDates.length;

  const rows = freeDates.map((t) => ({
    tanggal: t,
    hari: hariName(t),
    kategori: d.kategori,
    jenis: d.jenis,
    detail: d.detail,
    cover_url: d.coverUrl,
    created_by: userId,
  }));

  const { data: inserted, error } = await supabase.from("activities").insert(rows).select("id, tanggal");
  if (error) return dbError(error);

  const primary = (inserted ?? []).find((r) => r.tanggal === d.tanggal);
  if (!primary) return { ok: false, error: "Kegiatan gagal disimpan." };
  const insertedIds = (inserted ?? []).map((r) => r.id as string);

  // Firman dan galeri hanya untuk kegiatan utama; salinan mingguan memakai detail + foto sampul.
  const failAndRollback = async (e: { code?: string; message: string }) => {
    await supabase.from("activities").delete().in("id", insertedIds);
    return dbError(e);
  };

  if (withSermon) {
    const { error: sErr } = await supabase.from("sermons").insert({ activity_id: primary.id, ...sermon });
    if (sErr) return failAndRollback(sErr);
  }
  if (d.galleryUrls.length) {
    const { error: pErr } = await supabase.from("activity_photos").insert(
      d.galleryUrls.map((url, i) => ({ activity_id: primary.id, url, urutan: i })),
    );
    if (pErr) return failAndRollback(pErr);
  }

  refreshPages();
  const count = insertedIds.length;
  let message = count > 1 ? `${count} kegiatan berhasil dibuat.` : "Kegiatan berhasil dibuat.";
  if (skipped > 0) message += ` ${skipped} tanggal dilewati karena sudah ada kegiatan.`;
  return { ok: true, id: primary.id, weekStart: weekStart(d.tanggal), message };
}

async function updateActivity(
  supabase: SupabaseClient,
  id: string,
  d: ValidatedActivity,
  sermon: ValidatedActivity["sermon"],
  withSermon: boolean,
): Promise<ActionResult> {
  const { data: current, error: curErr } = await supabase
    .from("activities")
    .select("id, cover_url, activity_photos(url)")
    .eq("id", id)
    .maybeSingle();
  if (curErr) return dbError(curErr);
  if (!current) return { ok: false, error: "Kegiatan tidak ditemukan. Mungkin sudah dihapus." };

  // Bentrok dengan kegiatan lain pada tanggal tujuan
  const { data: others, error: othErr } = await supabase
    .from("activities")
    .select("jenis")
    .eq("tanggal", d.tanggal)
    .neq("id", id);
  if (othErr) return dbError(othErr);
  const conflict = findConflict(d.hari, d.jenis, others ?? []);
  if (conflict) return { ok: false, error: conflict, fieldErrors: { jenis: conflict } };

  const { error } = await supabase
    .from("activities")
    .update({
      tanggal: d.tanggal,
      hari: d.hari,
      kategori: d.kategori,
      jenis: d.jenis,
      detail: d.detail as ActivityDetail,
      cover_url: d.coverUrl,
    })
    .eq("id", id);
  if (error) return dbError(error);

  if (withSermon) {
    const { error: sErr } = await supabase
      .from("sermons")
      .upsert({ activity_id: id, ...sermon }, { onConflict: "activity_id" });
    if (sErr) return dbError(sErr);
  } else {
    const { error: sErr } = await supabase.from("sermons").delete().eq("activity_id", id);
    if (sErr) return dbError(sErr);
  }

  const { error: delErr } = await supabase.from("activity_photos").delete().eq("activity_id", id);
  if (delErr) return dbError(delErr);
  if (d.galleryUrls.length) {
    const { error: pErr } = await supabase.from("activity_photos").insert(
      d.galleryUrls.map((url, i) => ({ activity_id: id, url, urutan: i })),
    );
    if (pErr) return dbError(pErr);
  }

  // Bersihkan file yang tidak dipakai lagi
  const oldUrls = [
    current.cover_url as string | null,
    ...((current.activity_photos as { url: string }[] | null) ?? []).map((p) => p.url),
  ];
  const keep = new Set([d.coverUrl, ...d.galleryUrls]);
  await removeUnreferencedFiles(supabase, oldUrls.filter((u) => !keep.has(u)));

  refreshPages(id);
  return { ok: true, id, weekStart: weekStart(d.tanggal), message: "Perubahan berhasil disimpan." };
}

// ---------- hapus ----------

export async function deleteActivity(id: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { supabase } = ctx;
  if (!isUuid(id)) return { ok: false, error: "ID kegiatan tidak valid." };

  const { data: current } = await supabase
    .from("activities")
    .select("tanggal, cover_url, activity_photos(url)")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Kegiatan tidak ditemukan. Mungkin sudah dihapus." };

  const { error } = await supabase.from("activities").delete().eq("id", id); // foto & Firman ikut terhapus (cascade)
  if (error) return dbError(error);

  await removeUnreferencedFiles(supabase, [
    current.cover_url as string | null,
    ...((current.activity_photos as { url: string }[] | null) ?? []).map((p) => p.url),
  ]);

  refreshPages(id);
  return { ok: true, weekStart: weekStart(current.tanggal as string), message: "Kegiatan dihapus." };
}

// ---------- duplikat dari minggu lalu ----------

/** Salin kegiatan minggu sebelumnya ke minggu `targetWeekStart` (Senin). Firman dan galeri tidak ikut disalin. */
export async function duplicateFromPreviousWeek(targetWeekStart: string): Promise<ActionResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { supabase, userId } = ctx;

  if (!isValidISODate(targetWeekStart) || hariIndex(targetWeekStart) !== 0) {
    return { ok: false, error: "Minggu tujuan tidak valid." };
  }
  const srcStart = addDays(targetWeekStart, -7);

  const { data: source, error: srcErr } = await supabase
    .from("activities")
    .select("tanggal, kategori, jenis, detail, cover_url")
    .gte("tanggal", srcStart)
    .lte("tanggal", addDays(srcStart, 6));
  if (srcErr) return dbError(srcErr);
  if (!source?.length) return { ok: false, error: "Tidak ada kegiatan pada minggu sebelumnya untuk disalin." };

  const { data: existing, error: exErr } = await supabase
    .from("activities")
    .select("tanggal, jenis")
    .gte("tanggal", targetWeekStart)
    .lte("tanggal", addDays(targetWeekStart, 6));
  if (exErr) return dbError(exErr);

  const byDate = new Map<string, { jenis: string }[]>();
  for (const e of existing ?? []) {
    const list = byDate.get(e.tanggal) ?? [];
    list.push({ jenis: e.jenis });
    byDate.set(e.tanggal, list);
  }

  const rows = [];
  for (const s of source) {
    const tanggal = addDays(s.tanggal as string, 7);
    const list = byDate.get(tanggal) ?? [];
    if (findConflict(hariName(tanggal), s.jenis as string, list)) continue;
    list.push({ jenis: s.jenis as string }); // cegah dua jenis eksklusif masuk ke tanggal yang sama
    byDate.set(tanggal, list);
    rows.push({
      tanggal,
      hari: hariName(tanggal),
      kategori: s.kategori,
      jenis: s.jenis,
      detail: s.detail,
      cover_url: s.cover_url,
      created_by: userId,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "Semua kegiatan minggu lalu sudah ada pada minggu ini." };
  }
  const { error } = await supabase.from("activities").insert(rows);
  if (error) return dbError(error);

  refreshPages();
  return { ok: true, weekStart: targetWeekStart, message: `${rows.length} kegiatan disalin dari minggu lalu.` };
}
