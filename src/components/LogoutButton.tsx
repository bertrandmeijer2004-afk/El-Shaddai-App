"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "btn btn-outline btn-sm" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await getBrowserClient().auth.signOut();
    } finally {
      // Muat ulang penuh agar seluruh state klien dan cache router bersih.
      window.location.assign("/");
    }
  }

  return (
    <button type="button" onClick={logout} disabled={loading} className={className}>
      {loading ? "Keluar…" : "Logout"}
    </button>
  );
}
