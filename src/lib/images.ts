import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET, storagePathFromUrl } from "@/lib/supabase/env";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Batas ukuran file asli sebelum dikompres */
export const MAX_RAW_BYTES = 15 * 1024 * 1024;
/** Batas ukuran setelah dikompres (sama dengan batas bucket di database) */
export const MAX_FINAL_BYTES = 5 * 1024 * 1024;

/**
 * Validasi format & ukuran, lalu kompres di browser (maks. 1920 px, target <= ~0.8 MB, keluaran JPEG).
 * Melempar Error berbahasa Indonesia jika tidak memenuhi syarat.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}": format tidak didukung. Gunakan JPG, PNG, atau WebP.`);
  }
  if (file.size > MAX_RAW_BYTES) {
    throw new Error(`"${file.name}": ukuran melebihi 15 MB.`);
  }

  const { default: imageCompression } = await import("browser-image-compression");
  let out: File;
  try {
    out = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.82,
    });
  } catch {
    throw new Error(`"${file.name}": foto tidak dapat diproses. Coba foto lain.`);
  }

  if (out.size > MAX_FINAL_BYTES) {
    throw new Error(`"${file.name}": ukuran masih terlalu besar setelah dikompres.`);
  }
  const base = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "foto";
  return new File([out], `${base}.jpg`, { type: "image/jpeg" });
}

/** Unggah ke Supabase Storage; mengembalikan URL publik. Hanya admin yang diizinkan (RLS storage). */
export async function uploadImage(supabase: SupabaseClient, file: File): Promise<string> {
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Foto gagal diunggah. Periksa koneksi atau izin akun Anda.");
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Hapus file yang sudah terunggah tetapi tidak jadi disimpan (best effort). */
export async function removeUploaded(supabase: SupabaseClient, urls: string[]) {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  try {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  } catch {
    /* diabaikan */
  }
}
