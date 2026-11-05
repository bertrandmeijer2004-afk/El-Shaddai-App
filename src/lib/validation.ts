/**
 * Validasi input kegiatan. Dipakai di klien (umpan balik cepat, `skipPhotos`) dan
 * di server (otoritatif, dengan `photoPrefix`). Modul ini tidak punya dependensi server.
 */
import {
  LIMITS,
  getFieldsFor,
  getKategori,
  isJenisAllowedOn,
  type Hari,
  type Kategori,
} from "@/config/activities";
import { hariName, isValidISODate, isValidJam, weeklyDates } from "@/lib/date";
import type { ActivityDetail, SermonInput } from "@/lib/types";

export interface ValidatedActivity {
  tanggal: string;
  hari: Hari;
  kategori: Kategori;
  jenis: string;
  detail: ActivityDetail;
  coverUrl: string | null;
  galleryUrls: string[];
  sermon: SermonInput;
  repeatUntil: string | null;
}

export type ValidationResult =
  | { ok: true; data: ValidatedActivity }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

interface Options {
  /** Awalan URL foto yang sah. Wajib di server. */
  photoPrefix?: string;
  /** Lewati pemeriksaan URL foto (validasi klien sebelum unggah). */
  skipPhotos?: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function validateActivityInput(raw: unknown, opts: Options = {}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!isObj(raw)) return { ok: false, error: "Data tidak valid.", fieldErrors: {} };

  // Tanggal, hari, jenis
  const tanggal = str(raw.tanggal);
  const jenis = str(raw.jenis);
  let hari: Hari | null = null;
  if (!isValidISODate(tanggal)) {
    errors.tanggal = "Pilih tanggal yang valid.";
  } else {
    hari = hariName(tanggal);
  }
  if (!jenis) {
    errors.jenis = "Pilih jenis kegiatan.";
  } else if (hari && !isJenisAllowedOn(hari, jenis)) {
    errors.jenis = `Jenis kegiatan ini tidak tersedia untuk hari ${hari}.`;
  }
  const kategori = getKategori(jenis);

  // Detail dinamis (hanya field yang didefinisikan untuk jenis ini)
  const detail: ActivityDetail = {};
  const rawDetail = isObj(raw.detail) ? raw.detail : {};
  if (kategori) {
    for (const f of getFieldsFor(jenis)) {
      const v = rawDetail[f.key];
      if (f.type === "jam") {
        const j = isObj(v) ? v : {};
        const mulai = str(j.mulai);
        const selesai = str(j.selesai);
        if (mulai && !isValidJam(mulai)) errors[`detail.${f.key}`] = "Jam mulai tidak valid.";
        else if (selesai && !isValidJam(selesai)) errors[`detail.${f.key}`] = "Jam selesai tidak valid.";
        else if (mulai && selesai && selesai <= mulai) {
          errors[`detail.${f.key}`] = "Jam selesai harus setelah jam mulai.";
        }
        if (mulai || selesai) {
          detail[f.key] = {
            ...(mulai ? { mulai } : {}),
            ...(selesai ? { selesai } : {}),
          };
        }
      } else {
        const text = str(v);
        const max = f.type === "textarea" ? LIMITS.textarea : LIMITS.text;
        if (text.length > max) errors[`detail.${f.key}`] = `Maksimal ${max} karakter.`;
        else if (text) detail[f.key] = text;
      }
    }
  }

  // Foto
  let coverUrl: string | null = null;
  let galleryUrls: string[] = [];
  if (!opts.skipPhotos) {
    const prefix = opts.photoPrefix;
    const okUrl = (u: unknown): u is string =>
      typeof u === "string" && !!prefix && u.startsWith(prefix) && u.length < 800 && !/\s/.test(u);

    if (raw.coverUrl != null && raw.coverUrl !== "") {
      if (okUrl(raw.coverUrl)) coverUrl = raw.coverUrl;
      else errors.coverUrl = "URL foto sampul tidak valid.";
    }
    if (raw.galleryUrls != null) {
      if (!Array.isArray(raw.galleryUrls)) errors.galleryUrls = "Data galeri tidak valid.";
      else if (raw.galleryUrls.length > LIMITS.galleryMax) {
        errors.galleryUrls = `Maksimal ${LIMITS.galleryMax} foto galeri.`;
      } else if (!raw.galleryUrls.every(okUrl)) errors.galleryUrls = "Ada URL foto galeri yang tidak valid.";
      else galleryUrls = [...new Set(raw.galleryUrls as string[])];
    }
  }

  // Firman
  const s = isObj(raw.sermon) ? raw.sermon : {};
  const sermon: SermonInput = {
    judul: str(s.judul),
    ayat: str(s.ayat),
    pembicara: str(s.pembicara),
    isi: typeof s.isi === "string" ? s.isi : "",
  };
  if (sermon.judul.length > LIMITS.firmanJudul) errors["sermon.judul"] = `Maksimal ${LIMITS.firmanJudul} karakter.`;
  if (sermon.ayat.length > LIMITS.firmanAyat) errors["sermon.ayat"] = `Maksimal ${LIMITS.firmanAyat} karakter.`;
  if (sermon.pembicara.length > LIMITS.firmanPembicara) {
    errors["sermon.pembicara"] = `Maksimal ${LIMITS.firmanPembicara} karakter.`;
  }
  if (sermon.isi.length > LIMITS.firmanIsi) errors["sermon.isi"] = "Isi Firman terlalu panjang.";

  // Ulangi tiap minggu
  let repeatUntil: string | null = null;
  const ru = str(raw.repeatUntil);
  if (ru) {
    if (!isValidISODate(ru)) errors.repeatUntil = "Tanggal akhir pengulangan tidak valid.";
    else if (isValidISODate(tanggal) && ru < tanggal) {
      errors.repeatUntil = "Tanggal akhir harus sama dengan atau setelah tanggal kegiatan.";
    } else if (isValidISODate(tanggal) && weeklyDates(tanggal, ru, LIMITS.repeatMaxWeeks + 2).length > LIMITS.repeatMaxWeeks + 1) {
      errors.repeatUntil = `Pengulangan maksimal ${LIMITS.repeatMaxWeeks} minggu.`;
    } else repeatUntil = ru;
  }

  if (Object.keys(errors).length > 0 || !hari || !kategori) {
    return { ok: false, error: "Periksa kembali isian yang bertanda merah.", fieldErrors: errors };
  }

  return {
    ok: true,
    data: { tanggal, hari, kategori, jenis, detail, coverUrl, galleryUrls, sermon, repeatUntil },
  };
}
