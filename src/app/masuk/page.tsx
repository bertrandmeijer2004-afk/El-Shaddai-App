import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Masuk sebagai Jemaat" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Masuk Jemaat" subtitle="Masuk untuk melihat jadwal kegiatan gereja.">
      <LoginForm variant="jemaat" next={safeNext(next)} />
    </AuthShell>
  );
}
