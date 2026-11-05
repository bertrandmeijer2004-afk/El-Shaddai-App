import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Pengguna + profil dari sesi saat ini (server). `getUser()` memverifikasi token ke server Supabase. */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };

  const { data } = await supabase
    .from("profiles")
    .select("id, nama, email, role")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profile: (data as Profile | null) ?? null };
}
