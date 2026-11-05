import Link from "next/link";
import type { Metadata } from "next";
import { ActivityCard } from "@/components/ActivityCard";
import { Calendar } from "@/components/Calendar";
import { Cover } from "@/components/Cover";
import { Marquee } from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { ACTIVITY_TYPES, HARI, KATEGORI, type Kategori } from "@/config/activities";
import { SITE } from "@/config/site";
import { getSession } from "@/lib/auth";
import {
  formatRentangMinggu,
  formatTanggalPanjang,
  formatTanggal,
  formatTanggalPendek,
  monthGridRange,
  parseISODate,
  todayWIB,
  weekDates,
  weekStart,
} from "@/lib/date";
import { getActivitiesBetween, getFirmanTerbaru, getWeekActivities } from "@/lib/queries";
import { excerpt, richToText } from "@/lib/sanitize";

export const metadata: Metadata = { title: "Beranda" };
export const dynamic = "force-dynamic"; // tanggal "hari ini" dan data selalu segar

const KATEGORI_COPY: Record<Kategori, { judul: string; teks: string }> = {
  Persekutuan: {
    judul: "Bertumbuh dalam kasih",
    teks: "Persekutuan mempertemukan setiap kelompok jemaat untuk saling menguatkan, belajar Firman, dan melayani bersama.",
  },
  Ibadah: {
    judul: "Menyembah bersama",
    teks: "Kita berkumpul sebagai satu keluarga untuk memuji Tuhan, mendengar Firman-Nya, dan merayakan perjamuan kudus.",
  },
  Doa: {
    judul: "Berdoa tanpa putus asa",
    teks: "Doa menopang gereja, para pelayan, dan sesama. Bergabunglah dalam doa pelayan, doa malam, dan doa perjamuan suci.",
  },
};

export default async function BerandaPage() {
  const { supabase } = await getSession();
  const today = todayWIB();
  const start = weekStart(today);
  const t = parseISODate(today)!;
  const range = monthGridRange(t.y, t.m - 1);

  const [week, monthActivities, firman] = await Promise.all([
    getWeekActivities(supabase, start),
    getActivitiesBetween(supabase, range.from, range.to),
    getFirmanTerbaru(supabase, today, 3),
  ]);

  const dates = weekDates(start);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-ink text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SITE.heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/35" />
        <div className="container-page pb-14 pt-24 sm:pb-20">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-nav text-primary">{formatTanggalPanjang(today)}</p>
            <h1 className="h-display mt-4 text-[clamp(3.8rem,15vw,11rem)]">{SITE.nama}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/90 sm:text-xl">{SITE.tagline}</p>
            <a href="#minggu-ini" className="btn mt-8">
              Lihat Jadwal Minggu Ini
            </a>
          </Reveal>
        </div>
      </section>

      <Marquee text={SITE.semboyan} />

      {/* KEGIATAN MINGGU INI */}
      <section id="minggu-ini" className="container-page pt-20 sm:pt-28" aria-labelledby="h-minggu">
        <Reveal>
          <p className="eyebrow">{formatRentangMinggu(start)}</p>
          <h2 id="h-minggu" className="h-display mt-2 text-5xl sm:text-7xl">
            Kegiatan Minggu Ini
          </h2>
        </Reveal>

        <div className="mt-10">
          {dates.map((iso, i) => {
            const list = week.filter((a) => a.tanggal === iso);
            const isToday = iso === today;
            return (
              <div key={iso} className="grid gap-5 border-t border-line py-8 md:grid-cols-[11rem_1fr] md:gap-8">
                <Reveal>
                  <h3 className="h-display text-4xl">{HARI[i]}</h3>
                  <p className="eyebrow mt-1">{formatTanggalPendek(iso)}</p>
                  {isToday && <span className="badge mt-3">Hari ini</span>}
                </Reveal>
                {list.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((a, j) => (
                      <Reveal key={a.id} delay={Math.min(j, 3) * 0.08}>
                        <ActivityCard activity={a} />
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <p className="self-center rounded-2xl bg-surface px-5 py-4 text-muted">Belum ada kegiatan terjadwal.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* BAGIAN BERGANTIAN GAMBAR / TEKS */}
      <section className="container-page mt-24 space-y-16 sm:mt-32 sm:space-y-24" aria-label="Tentang kegiatan gereja">
        {KATEGORI.map((k, i) => {
          const sample = week.find((a) => a.kategori === k && a.cover_url) ?? null;
          const jenisList = Object.entries(ACTIVITY_TYPES)
            .filter(([, d]) => d.kategori === k)
            .map(([nama]) => nama);
          const copy = KATEGORI_COPY[k];
          return (
            <Reveal key={k} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={`overflow-hidden rounded-4xl ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <Cover url={sample?.cover_url} className="aspect-[4/3] w-full" />
              </div>
              <div>
                <p className="eyebrow">{k}</p>
                <h2 className="h-display mt-2 text-5xl sm:text-6xl">{copy.judul}</h2>
                <p className="mt-5 text-lg text-muted">{copy.teks}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {jenisList.map((j) => (
                    <li key={j} className="badge">
                      {j}
                    </li>
                  ))}
                </ul>
                <a href="#minggu-ini" className="btn btn-outline mt-7">
                  Lihat Jadwal
                </a>
              </div>
            </Reveal>
          );
        })}
      </section>

      {/* KALENDER */}
      <section id="kalender" className="container-page mt-24 sm:mt-32" aria-labelledby="h-kalender">
        <Reveal>
          <p className="eyebrow">Semua kegiatan</p>
          <h2 id="h-kalender" className="h-display mt-2 text-5xl sm:text-7xl">
            Kalender
          </h2>
          <p className="mt-3 max-w-xl text-muted">Pilih tanggal untuk melihat kegiatan pada hari itu.</p>
        </Reveal>
        <Reveal className="mx-auto mt-8 max-w-3xl">
          <Calendar today={today} initialActivities={monthActivities} />
        </Reveal>
      </section>

      {/* FIRMAN TERBARU */}
      <section id="firman" className="container-page mt-24 sm:mt-32" aria-labelledby="h-firman">
        <Reveal>
          <p className="eyebrow">Renungan jemaat</p>
          <h2 id="h-firman" className="h-display mt-2 text-5xl sm:text-7xl">
            Firman Terbaru
          </h2>
        </Reveal>

        {firman.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-surface px-5 py-4 text-muted">Belum ada Firman yang dipublikasikan.</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {firman.map((f, i) => (
              <Reveal key={f.activity_id} delay={i * 0.1}>
                <article className="group card flex h-full flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {f.ayat && <span className="badge self-start">{f.ayat}</span>}
                  <h3 className="h-display mt-4 text-3xl">{f.judul || f.jenis}</h3>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wideish text-muted">
                    {f.jenis} · {formatTanggal(f.tanggal)}
                    {f.pembicara ? ` · ${f.pembicara}` : ""}
                  </p>
                  <p className="mt-4 flex-1 text-muted">{excerpt(richToText(f.isi), 160)}</p>
                  <Link href={`/kegiatan/${f.activity_id}`} className="btn btn-sm mt-5 self-start">
                    Baca Selengkapnya
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
