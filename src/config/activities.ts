/**
 * KONFIGURASI KEGIATAN (satu-satunya tempat yang perlu diubah)
 * ------------------------------------------------------------
 * - FIELDS          : daftar semua field detail yang mungkin dipakai.
 * - ACTIVITY_TYPES  : jenis kegiatan -> kategori + field apa saja yang tampil (urutan = urutan tampil).
 * - DAY_ACTIVITIES  : jenis kegiatan yang boleh dipilih admin untuk tiap hari.
 *
 * Detail tiap kegiatan disimpan sebagai JSONB di kolom `activities.detail`,
 * dengan `key` field sebagai nama properti. Menambah/mengubah field tidak
 * memerlukan migrasi database.
 */

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
export type Hari = (typeof HARI)[number];

export const KATEGORI = ["Persekutuan", "Ibadah", "Doa"] as const;
export type Kategori = (typeof KATEGORI)[number];

/** text = teks satu baris, jam = waktu mulai & selesai, textarea = teks panjang */
export type FieldType = "text" | "jam" | "textarea";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
}

export const FIELDS: Record<string, FieldDef> = {
  prepare: { key: "prepare", label: "Prepare", type: "text" },
  worship_leader: { key: "worship_leader", label: "Worship Leader", type: "text" },
  pemimpin: { key: "pemimpin", label: "Pemimpin", type: "text" },
  pelayan: { key: "pelayan", label: "Pelayan", type: "text" },
  singers: { key: "singers", label: "Singers", type: "text", placeholder: "Pisahkan nama dengan koma" },
  pelayan_musik: { key: "pelayan_musik", label: "Pelayan Musik", type: "text", placeholder: "Pisahkan nama dengan koma" },
  doa_pembuka: { key: "doa_pembuka", label: "Doa Pembuka", type: "text" },
  doa_gsm: { key: "doa_gsm", label: "Doa GSM", type: "text" },
  doa_firman: { key: "doa_firman", label: "Doa Firman", type: "text" },
  kolektan: { key: "kolektan", label: "Kolektan", type: "text", placeholder: "Pisahkan nama dengan koma" },
  doa_kolektan: { key: "doa_kolektan", label: "Doa Kolektan", type: "text" },
  usher: { key: "usher", label: "Usher", type: "text", placeholder: "Pisahkan nama dengan koma" },
  mulmed: { key: "mulmed", label: "Mulmed", type: "text", placeholder: "Pisahkan nama dengan koma" },
  tamborin: { key: "tamborin", label: "Tamborin", type: "text", placeholder: "Pisahkan nama dengan koma" },
  banners: { key: "banners", label: "Banners", type: "text", placeholder: "Pisahkan nama dengan koma" },
  lokasi: { key: "lokasi", label: "Lokasi", type: "text", placeholder: "Contoh: Aula Gereja" },
  jam: { key: "jam", label: "Jam", type: "jam" },
  pengumuman: { key: "pengumuman", label: "Pengumuman", type: "textarea" },
};

export interface ActivityTypeDef {
  kategori: Kategori;
  /** key dari FIELDS, urutan = urutan tampil di form dan halaman detail */
  fields: string[];
}

const IBADAH_RAYA_FIELDS = [
  "worship_leader", "singers", "doa_pembuka", "kolektan", "doa_kolektan",
  "doa_firman", "usher", "mulmed", "tamborin", "banners", "lokasi", "jam", "pengumuman",
];

export const ACTIVITY_TYPES: Record<string, ActivityTypeDef> = {
  // Persekutuan
  "Persekutuan Kaleb": {
    kategori: "Persekutuan",
    fields: ["worship_leader", "pelayan", "lokasi", "jam", "pengumuman"],
  },
  "Persekutuan Yosua": {
    kategori: "Persekutuan",
    fields: ["pelayan", "lokasi", "jam", "pengumuman"],
  },
  "Persekutuan Argopuro": {
    kategori: "Persekutuan",
    fields: ["worship_leader", "lokasi", "jam", "pengumuman"],
  },
  "Persekutuan Bapak/Ibu": {
    kategori: "Persekutuan",
    fields: ["worship_leader", "doa_pembuka", "doa_firman", "kolektan", "lokasi", "jam", "pengumuman"],
  },
  "Persekutuan Remaja": {
    kategori: "Persekutuan",
    fields: [
      "worship_leader", "singers", "doa_pembuka", "kolektan", "doa_kolektan",
      "doa_firman", "mulmed", "lokasi", "jam", "pengumuman",
    ],
  },
  "Persekutuan Sekolah Minggu": {
    kategori: "Persekutuan",
    fields: [
      "prepare", "doa_pembuka", "doa_gsm", "worship_leader", "kolektan",
      "doa_firman", "usher", "mulmed", "lokasi", "jam", "pengumuman",
    ],
  },
  // Ibadah
  "Ibadah Raya": { kategori: "Ibadah", fields: IBADAH_RAYA_FIELDS },
  "Ibadah Perjamuan Suci": { kategori: "Ibadah", fields: IBADAH_RAYA_FIELDS },
  "Ibadah Tengah Minggu": {
    kategori: "Ibadah",
    fields: ["worship_leader", "singers", "pelayan_musik", "mulmed", "lokasi", "jam", "pengumuman"],
  },
  // Doa
  "Doa Pelayan": { kategori: "Doa", fields: ["pemimpin", "lokasi", "jam", "pengumuman"] },
  "Doa Malam": { kategori: "Doa", fields: ["lokasi", "jam", "pengumuman"] },
  "Doa Pelayan Perjamuan Suci": { kategori: "Doa", fields: ["lokasi", "jam"] },
};

export const DAY_ACTIVITIES: Record<Hari, string[]> = {
  Senin: ["Persekutuan Kaleb"],
  Selasa: ["Persekutuan Yosua"],
  Rabu: ["Ibadah Tengah Minggu"],
  Kamis: ["Doa Pelayan", "Doa Malam", "Persekutuan Argopuro"],
  Jumat: ["Persekutuan Bapak/Ibu", "Doa Pelayan Perjamuan Suci"],
  Sabtu: ["Persekutuan Remaja"],
  Minggu: ["Ibadah Raya", "Ibadah Perjamuan Suci", "Persekutuan Sekolah Minggu"],
};

/**
 * Hari yang kegiatannya saling meniadakan ("ATAU"): pada tanggal tersebut hanya boleh
 * ada satu kegiatan. Jumat: Persekutuan Bapak/Ibu ATAU Doa Pelayan Perjamuan Suci.
 * Kosongkan array ini jika kedua kegiatan boleh ada bersamaan.
 */
export const EXCLUSIVE_DAYS: Hari[] = ["Jumat"];

/**
 * Cek bentrok pada satu tanggal. `existing` = kegiatan lain yang sudah ada di tanggal itu.
 * Mengembalikan pesan kesalahan, atau null jika aman.
 */
export function findConflict(hari: Hari, jenis: string, existing: { jenis: string }[]): string | null {
  if (existing.some((e) => e.jenis === jenis)) {
    return `${jenis} sudah terjadwal pada tanggal ini.`;
  }
  if (EXCLUSIVE_DAYS.includes(hari)) {
    const other = existing.find((e) => e.jenis !== jenis);
    if (other) return `Pada hari ${hari} hanya boleh satu kegiatan. ${other.jenis} sudah terjadwal pada tanggal ini.`;
  }
  return null;
}

/** Batas panjang input (dipakai form dan validasi server) */
export const LIMITS = {
  text: 200,
  textarea: 3000,
  firmanJudul: 200,
  firmanAyat: 120,
  firmanPembicara: 120,
  firmanIsi: 20000,
  galleryMax: 20,
  repeatMaxWeeks: 52,
} as const;

// ---------- helper ----------

export function getKategori(jenis: string): Kategori | null {
  return ACTIVITY_TYPES[jenis]?.kategori ?? null;
}

export function getFieldsFor(jenis: string): FieldDef[] {
  const def = ACTIVITY_TYPES[jenis];
  if (!def) return [];
  return def.fields.map((k) => FIELDS[k]).filter((f): f is FieldDef => Boolean(f));
}

export function jenisForHari(hari: string): string[] {
  return DAY_ACTIVITIES[hari as Hari] ?? [];
}

export function isJenisAllowedOn(hari: string, jenis: string): boolean {
  return jenisForHari(hari).includes(jenis) && jenis in ACTIVITY_TYPES;
}

// Pemeriksaan konsistensi konfigurasi saat modul dimuat: gagal cepat jika ada salah ketik.
for (const [jenis, def] of Object.entries(ACTIVITY_TYPES)) {
  for (const k of def.fields) {
    if (!FIELDS[k]) throw new Error(`Konfigurasi salah: field "${k}" pada "${jenis}" tidak ada di FIELDS`);
  }
}
for (const [hari, list] of Object.entries(DAY_ACTIVITIES)) {
  for (const j of list) {
    if (!ACTIVITY_TYPES[j]) throw new Error(`Konfigurasi salah: jenis "${j}" pada hari ${hari} tidak ada di ACTIVITY_TYPES`);
  }
}
