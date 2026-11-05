import type { Hari, Kategori } from "@/config/activities";

export type Role = "user" | "admin";

export interface Profile {
  id: string;
  nama: string;
  email: string;
  role: Role;
}

export interface Jam {
  mulai?: string;
  selesai?: string;
}

/** Nilai field detail: teks biasa, atau objek {mulai, selesai} untuk field "jam". */
export type DetailValue = string | Jam;
export type ActivityDetail = Record<string, DetailValue | undefined>;

export interface Activity {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari: Hari;
  kategori: Kategori;
  jenis: string;
  detail: ActivityDetail;
  cover_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityPhoto {
  id: string;
  activity_id: string;
  url: string;
  urutan: number;
}

export interface Sermon {
  id: string;
  activity_id: string;
  judul: string;
  ayat: string;
  isi: string;
  pembicara: string;
}

export interface ActivityFull extends Activity {
  sermon: Sermon | null;
  photos: ActivityPhoto[];
}

/** Bentuk ringkas untuk kalender dan kartu. */
export type ActivitySummary = Pick<
  Activity,
  "id" | "tanggal" | "hari" | "kategori" | "jenis" | "detail" | "cover_url"
>;

export interface SermonInput {
  judul: string;
  ayat: string;
  isi: string;
  pembicara: string;
}

/** Payload dari form admin ke server action `saveActivity`. */
export interface ActivityInput {
  id?: string;
  tanggal: string;
  jenis: string;
  detail: ActivityDetail;
  coverUrl: string | null;
  /** URL foto galeri (sudah terunggah) sesuai urutan akhir */
  galleryUrls: string[];
  sermon: SermonInput;
  /** Hanya saat membuat: ulangi tiap minggu sampai tanggal ini (inklusif) */
  repeatUntil?: string | null;
}

export type ActionResult =
  | { ok: true; id?: string; weekStart?: string; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
