"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

type Errors = Partial<Record<"nama" | "email" | "password" | "konfirmasi" | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (nama.trim().length < 2) e.nama = "Nama lengkap minimal 2 karakter.";
    else if (nama.trim().length > 100) e.nama = "Nama maksimal 100 karakter.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Masukkan alamat email yang valid.";
    if (password.length < 8) e.password = "Password minimal 8 karakter.";
    if (konfirmasi !== password) e.konfirmasi = "Konfirmasi password tidak sama.";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (loading) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nama: nama.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const m = error.message.toLowerCase();
        setErrors({
          form: m.includes("already")
            ? "Email ini sudah terdaftar. Silakan masuk."
            : m.includes("password")
              ? "Password terlalu lemah. Gunakan kombinasi yang lebih panjang."
              : m.includes("rate limit")
                ? "Terlalu banyak percobaan. Tunggu beberapa saat."
                : "Pendaftaran gagal. Coba lagi.",
        });
        return;
      }

      // Email yang sudah terdaftar (konfirmasi aktif) dikembalikan tanpa identitas.
      if (data.user && data.user.identities?.length === 0) {
        setErrors({ form: "Email ini sudah terdaftar. Silakan masuk." });
        return;
      }

      if (data.session) {
        router.replace("/beranda");
        router.refresh();
      } else {
        setNeedsConfirm(true);
      }
    } catch {
      setErrors({ form: "Terjadi gangguan jaringan. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div role="status" className="space-y-4">
        <p className="rounded-2xl bg-surface p-4 font-semibold">
          Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke <strong>{email.trim()}</strong>. Buka email Anda
          untuk mengaktifkan akun, lalu masuk.
        </p>
        <Link href="/masuk" className="btn w-full">
          Ke Halaman Masuk
        </Link>
      </div>
    );
  }

  const field = (
    id: keyof Errors & string,
    label: string,
    props: InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        className="field"
        aria-invalid={!!errors[id as keyof Errors]}
        aria-describedby={errors[id as keyof Errors] ? `${id}-err` : undefined}
        {...props}
      />
      {errors[id as keyof Errors] && (
        <p id={`${id}-err`} className="field-error">{errors[id as keyof Errors]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={loading}>
      {field("nama", "Nama Lengkap", {
        type: "text",
        autoComplete: "name",
        value: nama,
        onChange: (e) => setNama(e.target.value),
        required: true,
      })}
      {field("email", "Email", {
        type: "email",
        inputMode: "email",
        autoComplete: "email",
        value: email,
        onChange: (e) => setEmail(e.target.value),
        required: true,
      })}
      {field("password", "Password", {
        type: "password",
        autoComplete: "new-password",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        required: true,
        minLength: 8,
      })}
      {field("konfirmasi", "Konfirmasi Password", {
        type: "password",
        autoComplete: "new-password",
        value: konfirmasi,
        onChange: (e) => setKonfirmasi(e.target.value),
        required: true,
      })}

      {errors.form && (
        <p role="alert" className="field-error">
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn w-full" disabled={loading}>
        {loading ? "Memproses…" : "Daftar"}
      </button>

      <div className="space-y-2 pt-2 text-center text-sm">
        <p className="text-muted">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="link-anim font-bold">
            Masuk sebagai Jemaat
          </Link>
        </p>
        <p>
          <Link href="/" className="link-anim font-bold">
            ← Kembali
          </Link>
        </p>
      </div>
    </form>
  );
}
