import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70dvh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Error 404</p>
      <h1 className="h-display mt-2 text-5xl sm:text-7xl">Halaman tidak ditemukan</h1>
      <Link href="/beranda" className="btn mt-8">
        Ke Beranda
      </Link>
    </div>
  );
}
