import { HARI, DAY_ACTIVITIES } from "@/config/activities";
import { SITE } from "@/config/site";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-surface dark:border-line">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-muted">{SITE.tagline}.</p>

          <h2 className="eyebrow mt-8">Alamat</h2>
          <p className="mt-2 whitespace-pre-line font-semibold">{SITE.alamat}</p>
          {(SITE.kontak || SITE.email) && (
            <p className="mt-2 text-muted">
              {SITE.kontak}
              {SITE.kontak && SITE.email ? " · " : ""}
              {SITE.email}
            </p>
          )}
        </div>

        <div>
          <h2 className="eyebrow">Jadwal Rutin Mingguan</h2>
          <dl className="mt-3 divide-y divide-line">
            {HARI.map((h) => (
              <div key={h} className="grid grid-cols-[6rem_1fr] gap-3 py-2.5 text-sm">
                <dt className="font-bold uppercase tracking-wideish">{h}</dt>
                <dd className="text-muted">{DAY_ACTIVITIES[h].join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs uppercase tracking-nav text-muted">
        © {new Date().getFullYear()} {SITE.namaAplikasi}
      </div>
    </footer>
  );
}
