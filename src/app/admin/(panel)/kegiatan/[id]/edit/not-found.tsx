import Link from "next/link";

export default function EditNotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="h-display text-5xl">Kegiatan tidak ditemukan</h1>
      <p className="mt-4 text-muted">Mungkin sudah dihapus oleh admin lain.</p>
      <Link href="/admin" className="btn mt-8">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
