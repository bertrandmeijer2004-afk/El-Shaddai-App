import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Masuk sebagai Admin" };

/** Login admin. Sengaja TANPA tautan daftar: akun admin dibuat manual lewat database. */
export default function AdminLoginPage() {
  return (
    <AuthShell title="Masuk Admin" subtitle="Khusus pengurus yang berwenang mengelola jadwal.">
      <LoginForm variant="admin" />
    </AuthShell>
  );
}
