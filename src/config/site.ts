/**
 * Identitas gereja. Ubah nilai di sini; semua halaman memakainya.
 * Teks berkurung siku [ ... ] adalah isian yang perlu Anda lengkapi.
 */
export const SITE = {
  nama: "El-Shaddai",
  namaAplikasi: "El-Shaddai App",
  tagline: "Bersekutu, Beribadah, dan Berdoa Bersama",
  deskripsi: "Jadwal kegiatan, petugas, dan Firman mingguan jemaat El-Shaddai.",

  /** Semboyan gereja untuk strip teks berjalan di beranda. */
  semboyan: "[ISI SEMBOYAN]",

  /** Footer */
  alamat: "[ISI ALAMAT GEREJA]",
  kontak: "" as string, // opsional, contoh: "0812-0000-0000"
  email: "" as string, // opsional

  /** Foto hero beranda. Bisa diganti lewat env NEXT_PUBLIC_HERO_IMAGE_URL. */
  heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE_URL || "/hero.svg",
} as const;
