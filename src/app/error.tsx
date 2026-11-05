"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70dvh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Terjadi kesalahan</p>
      <h1 className="h-display mt-2 text-5xl sm:text-7xl">Halaman gagal dimuat</h1>
      <p className="mt-4 max-w-xl text-muted">
        Periksa koneksi internet Anda lalu coba lagi. Jika masalah berlanjut, pastikan skema database Supabase sudah dijalankan.
      </p>
      <button type="button" onClick={reset} className="btn mt-8">
        Coba Lagi
      </button>
    </div>
  );
}
