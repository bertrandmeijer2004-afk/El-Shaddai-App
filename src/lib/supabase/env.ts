export const PHOTO_BUCKET = "activity-photos";

export function getSupabaseEnv() {
  // Harus ditulis persis `process.env.NEXT_PUBLIC_...` agar Next.js menyisipkannya ke bundel browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi. Salin .env.example menjadi .env.local lalu isi nilainya.",
    );
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

/** Awalan URL publik untuk file di bucket foto. Dipakai untuk memvalidasi URL foto dari klien. */
export function photoUrlPrefix(): string {
  return `${getSupabaseEnv().url}/storage/v1/object/public/${PHOTO_BUCKET}/`;
}

/** Ambil path objek di bucket dari URL publik; null jika bukan milik bucket kita. */
export function storagePathFromUrl(url: string): string | null {
  const prefix = photoUrlPrefix();
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0]);
  return path && !path.includes("..") ? path : null;
}
