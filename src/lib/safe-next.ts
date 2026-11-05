/** Hanya menerima jalur internal dan bukan /admin, untuk parameter `next` setelah login jemaat (cegah open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/beranda"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (next === "/admin" || next.startsWith("/admin/")) return fallback;
  return next;
}
