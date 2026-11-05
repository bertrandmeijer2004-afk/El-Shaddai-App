import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Gerbang akses di server:
 *  - menyegarkan sesi Supabase (cookie),
 *  - halaman jemaat wajib login,
 *  - /admin/* hanya untuk role = 'admin' (selain /admin/login).
 * Row Level Security di database tetap menjadi lapisan pertahanan terakhir.
 */
const GATE_PATHS = new Set(["/", "/masuk", "/daftar"]);
const PUBLIC_PATHS = new Set(["/", "/masuk", "/daftar", "/admin/login", "/auth/callback"]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  /** Redirect yang tetap membawa cookie sesi hasil penyegaran. */
  const redirect = (to: string) => {
    const target = request.nextUrl.clone();
    const [path, query = ""] = to.split("?");
    target.pathname = path;
    target.search = query ? `?${query}` : "";
    const res = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  async function isAdmin(): Promise<boolean> {
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return data?.role === "admin";
  }

  if (isAdminArea) {
    if (pathname === "/admin/login") {
      if (user && (await isAdmin())) return redirect("/admin");
      return response;
    }
    if (!user) return redirect("/admin/login");
    if (!(await isAdmin())) return redirect("/beranda"); // jemaat diarahkan keluar dari /admin
    return response;
  }

  if (!user) {
    if (PUBLIC_PATHS.has(pathname)) return response;
    const next = encodeURIComponent(pathname + search);
    return redirect(`/masuk?next=${next}`);
  }

  if (GATE_PATHS.has(pathname)) return redirect("/beranda");
  return response;
}

export const config = {
  matcher: [
    // Semua jalur kecuali aset statis
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
