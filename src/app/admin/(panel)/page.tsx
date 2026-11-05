import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getSession } from "@/lib/auth";
import { isValidISODate, todayWIB, weekStart } from "@/lib/date";
import { getWeekActivities } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ minggu?: string }> }) {
  const { minggu } = await searchParams;
  const { supabase } = await getSession();
  const today = todayWIB();
  const start = weekStart(isValidISODate(minggu) ? minggu : today);
  const activities = await getWeekActivities(supabase, start);

  // `key` mengatur ulang tab terpilih saat pindah minggu
  return <AdminDashboard key={start} weekStart={start} today={today} activities={activities} />;
}
