import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Daftar sebagai Jemaat" };

export default function DaftarPage() {
  return (
    <AuthShell title="Daftar Jemaat" subtitle="Buat akun jemaat untuk melihat jadwal kegiatan.">
      <RegisterForm />
    </AuthShell>
  );
}
