import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Tujuan tautan konfirmasi email Supabase: menukar `code` menjadi sesi lalu masuk ke beranda. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = request.nextUrl.clone();
  target.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      target.pathname = "/beranda";
      return NextResponse.redirect(target);
    }
  }
  target.pathname = "/masuk";
  return NextResponse.redirect(target);
}
