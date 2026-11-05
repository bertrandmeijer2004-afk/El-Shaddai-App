import Link from "next/link";

export default function KegiatanNotFound() {
  return (
    <div className="container-page py-28 text-center">
      <h1 className="h-display text-6xl">Kegiatan tidak ditemukan</h1>
      <p className="mt-4 text-muted">Kegiatan ini mungkin sudah dihapus atau tautannya keliru.</p>
      <Link href="/beranda" className="btn mt-8">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
