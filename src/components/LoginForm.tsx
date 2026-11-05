"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

type Variant = "jemaat" | "admin";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Periksa kotak masuk Anda lalu coba lagi.";
  if (m.includes("rate limit") || m.includes("too many")) return "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.";
  if (m.includes("invalid login")) return "Email atau password salah.";
  return "Tidak dapat masuk. Periksa email dan password Anda.";
}

export function LoginForm({ variant, next = "/beranda" }: { variant: Variant; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    const supabase = getBrowserClient();
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError || !data.user) {
        setError(friendlyAuthError(authError?.message ?? ""));
        return;
      }

      if (variant === "admin") {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        if (profile?.role !== "admin") {
          await supabase.auth.signOut();
          setError("Akun ini tidak memiliki akses admin.");
          return;
        }
        router.replace("/admin");
      } else {
        router.replace(next);
      }
      router.refresh();
    } catch {
      setError("Terjadi gangguan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={loading}>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!!error}
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-invalid={!!error}
        />
      </div>

      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}

      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? "Memproses…" : variant === "admin" ? "Masuk sebagai Admin" : "Masuk"}
      </button>

      <div className="space-y-2 pt-2 text-center text-sm">
        {variant === "jemaat" && (
          <p className="text-muted">
            Belum punya akun?{" "}
            <Link href="/daftar" className="link-anim font-bold">
              Daftar sebagai Jemaat
            </Link>
          </p>
        )}
        <p>
          <Link href="/" className="link-anim font-bold">
            ← Kembali
          </Link>
        </p>
      </div>
    </form>
  );
}
