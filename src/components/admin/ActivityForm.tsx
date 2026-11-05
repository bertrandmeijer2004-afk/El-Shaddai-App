"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { saveActivity } from "@/app/admin/actions";
import { CoverField, GalleryField, newKey, type PhotoItem } from "@/components/admin/PhotoFields";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { useToast } from "@/components/Toast";
import {
  EXCLUSIVE_DAYS,
  HARI,
  LIMITS,
  getFieldsFor,
  getKategori,
  jenisForHari,
  type FieldDef,
} from "@/config/activities";
import { removeUploaded, uploadImage } from "@/lib/images";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  addDays,
  dateForHariInSameWeek,
  formatTanggalPanjang,
  hariName,
  isValidISODate,
  weekStart,
  weeklyDates,
} from "@/lib/date";
import type { ActivityDetail, Jam, SermonInput } from "@/lib/types";
import { validateActivityInput } from "@/lib/validation";

export interface ActivityFormInitial {
  id: string;
  tanggal: string;
  jenis: string;
  detail: ActivityDetail;
  coverUrl: string | null;
  gallery: { id: string; url: string }[];
  sermon: SermonInput;
}

type Errors = Record<string, string>;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="h-display text-3xl sm:text-4xl">{title}</h2>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function ActivityForm({ initial, defaultDate }: { initial?: ActivityFormInitial; defaultDate: string }) {
  const router = useRouter();
  const toast = useToast();
  const uid = useId();
  const isEdit = !!initial;

  const startDate = initial?.tanggal ?? defaultDate;
  const [tanggal, setTanggal] = useState(startDate);
  const [jenis, setJenis] = useState(() => {
    if (initial) return initial.jenis;
    const only = isValidISODate(startDate) ? jenisForHari(hariName(startDate)) : [];
    return only.length === 1 ? only[0] : "";
  });
  const [detail, setDetail] = useState<ActivityDetail>(initial?.detail ?? {});
  const [cover, setCover] = useState<PhotoItem | null>(() =>
    initial?.coverUrl ? { key: newKey(), url: initial.coverUrl } : null,
  );
  const [gallery, setGallery] = useState<PhotoItem[]>(() =>
    (initial?.gallery ?? []).map((g) => ({ key: g.id, url: g.url })),
  );
  const [sermon, setSermon] = useState<SermonInput>(
    initial?.sermon ?? { judul: "", ayat: "", isi: "", pembicara: "" },
  );
  const [repeat, setRepeat] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<string | null>(null);

  const dateOk = isValidISODate(tanggal);
  const hari = dateOk ? hariName(tanggal) : null;
  const jenisOptions = hari ? jenisForHari(hari) : [];
  const fields = jenis ? getFieldsFor(jenis) : [];
  const kategori = jenis ? getKategori(jenis) : null;
  const disabled = busy !== null;
  const backHref = `/admin?minggu=${weekStart(dateOk ? tanggal : defaultDate)}`;

  const repeatCount =
    repeat && dateOk && isValidISODate(repeatUntil) ? weeklyDates(tanggal, repeatUntil, LIMITS.repeatMaxWeeks + 2).length : 0;

  function changeTanggal(t: string) {
    setTanggal(t);
    setErrors((e) => ({ ...e, tanggal: "", jenis: "" }));
    if (!isValidISODate(t)) return;
    const allowed = jenisForHari(hariName(t));
    // Dropdown jenis otomatis menyesuaikan hari; pilihan lama dihapus jika tidak berlaku.
    if (!allowed.includes(jenis)) setJenis(allowed.length === 1 ? allowed[0] : "");
  }

  function setText(key: string, value: string) {
    setDetail((d) => ({ ...d, [key]: value }));
  }
  function setJam(key: string, part: keyof Jam, value: string) {
    setDetail((d) => {
      const cur = (typeof d[key] === "object" ? (d[key] as Jam) : {}) ?? {};
      return { ...d, [key]: { ...cur, [part]: value } };
    });
  }

  const err = (name: string) => errors[name] || "";
  const errId = (name: string) => `${uid}-${name.replace(/\./g, "-")}-err`;
  const ErrMsg = ({ name }: { name: string }) =>
    err(name) ? (
      <p id={errId(name)} className="field-error" role="alert">
        {err(name)}
      </p>
    ) : null;
  const aria = (name: string) => ({
    "aria-invalid": err(name) ? (true as const) : undefined,
    "aria-describedby": err(name) ? errId(name) : undefined,
  });

  function renderField(f: FieldDef) {
    const name = `detail.${f.key}`;
    const id = `${uid}-${f.key}`;
    if (f.type === "jam") {
      const j = (typeof detail[f.key] === "object" ? detail[f.key] : {}) as Jam;
      return (
        <fieldset key={f.key}>
          <legend className="field-label">{f.label}</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-mulai`} className="mb-1 block text-xs text-muted">Mulai</label>
              <input id={`${id}-mulai`} type="time" className="field" value={j?.mulai ?? ""} disabled={disabled}
                onChange={(e) => setJam(f.key, "mulai", e.target.value)} {...aria(name)} />
            </div>
            <div>
              <label htmlFor={`${id}-selesai`} className="mb-1 block text-xs text-muted">Selesai</label>
              <input id={`${id}-selesai`} type="time" className="field" value={j?.selesai ?? ""} disabled={disabled}
                onChange={(e) => setJam(f.key, "selesai", e.target.value)} {...aria(name)} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">Waktu dalam WIB.</p>
          <ErrMsg name={name} />
        </fieldset>
      );
    }
    const value = typeof detail[f.key] === "string" ? (detail[f.key] as string) : "";
    return (
      <div key={f.key}>
        <label htmlFor={id} className="field-label">{f.label}</label>
        {f.type === "textarea" ? (
          <textarea id={id} className="field min-h-[120px]" rows={4} value={value} disabled={disabled}
            maxLength={LIMITS.textarea} placeholder={f.placeholder}
            onChange={(e) => setText(f.key, e.target.value)} {...aria(name)} />
        ) : (
          <input id={id} type="text" className="field" value={value} disabled={disabled}
            maxLength={LIMITS.text} placeholder={f.placeholder}
            onChange={(e) => setText(f.key, e.target.value)} {...aria(name)} />
        )}
        <ErrMsg name={name} />
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;

    const base = {
      tanggal,
      jenis,
      detail,
      sermon,
      repeatUntil: !isEdit && repeat ? repeatUntil : null,
    };
    const v = validateActivityInput({ ...base, coverUrl: null, galleryUrls: [] }, { skipPhotos: true });
    const fieldErrors: Errors = v.ok ? {} : { ...v.fieldErrors };
    if (!isEdit && repeat && !repeatUntil) fieldErrors.repeatUntil = "Pilih tanggal akhir pengulangan.";
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      toast.error("Periksa kembali isian yang bertanda merah.");
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setErrors({});

    const supabase = getBrowserClient();
    const uploaded: string[] = [];
    try {
      const pending = [cover, ...gallery].filter((p): p is PhotoItem => !!p?.file).length;
      let done = 0;
      const resolveUrl = async (p: PhotoItem) => {
        if (!p.file) return p.url;
        setBusy(`Mengunggah foto ${++done}/${pending}…`);
        const url = await uploadImage(supabase, p.file);
        uploaded.push(url);
        return url;
      };

      const coverUrl = cover ? await resolveUrl(cover) : null;
      const galleryUrls: string[] = [];
      for (const g of gallery) galleryUrls.push(await resolveUrl(g));

      setBusy("Menyimpan…");
      const res = await saveActivity({ id: initial?.id, ...base, coverUrl, galleryUrls });

      if (!res.ok) {
        await removeUploaded(supabase, uploaded);
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      toast.success(res.message ?? "Kegiatan tersimpan.");
      router.push(`/admin?minggu=${res.weekStart ?? weekStart(tanggal)}`);
      router.refresh();
    } catch (error) {
      await removeUploaded(supabase, uploaded);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  const maxRepeat = dateOk ? addDays(tanggal, LIMITS.repeatMaxWeeks * 7) : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" aria-busy={disabled}>
      {/* 1. Jadwal */}
      <Section title="Jadwal" hint="Pilih hari atau tanggal. Pilihan jenis kegiatan menyesuaikan hari yang dipilih.">
        <div>
          <span className="field-label" id={`${uid}-hari-label`}>Hari</span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${uid}-hari-label`}>
            {HARI.map((h) => {
              const active = hari === h;
              return (
                <button
                  key={h}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => changeTanggal(dateForHariInSameWeek(dateOk ? tanggal : defaultDate, h))}
                  className={`btn btn-sm ${active ? "" : "btn-outline"}`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-tanggal`} className="field-label">Tanggal</label>
            <input id={`${uid}-tanggal`} type="date" className="field" value={tanggal} disabled={disabled}
              onChange={(e) => changeTanggal(e.target.value)} required {...aria("tanggal")} />
            {dateOk && <p className="mt-1 text-sm text-muted">{formatTanggalPanjang(tanggal)}</p>}
            <ErrMsg name="tanggal" />
          </div>

          <div>
            <label htmlFor={`${uid}-jenis`} className="field-label">Jenis Kegiatan</label>
            <select id={`${uid}-jenis`} className="field" value={jenis} disabled={disabled || !hari}
              onChange={(e) => { setJenis(e.target.value); setErrors((x) => ({ ...x, jenis: "" })); }}
              required {...aria("jenis")}>
              <option value="">{hari ? "Pilih jenis kegiatan" : "Pilih tanggal dahulu"}</option>
              {jenisOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            {kategori && <p className="mt-1 text-sm text-muted">Kategori: {kategori}</p>}
            {hari && EXCLUSIVE_DAYS.includes(hari) && (
              <p className="mt-1 text-sm text-muted">Hari {hari}: hanya satu dari pilihan ini yang dapat dijadwalkan per tanggal.</p>
            )}
            <ErrMsg name="jenis" />
          </div>
        </div>

        {!isEdit && (
          <div className="rounded-2xl bg-surface p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--accent))]" checked={repeat} disabled={disabled}
                onChange={(e) => { setRepeat(e.target.checked); if (!e.target.checked) setRepeatUntil(""); }} />
              <span className="font-semibold">Ulangi setiap minggu sampai tanggal …</span>
            </label>
            {repeat && (
              <div className="mt-4">
                <label htmlFor={`${uid}-ulang`} className="field-label">Ulangi sampai</label>
                <input id={`${uid}-ulang`} type="date" className="field max-w-xs" value={repeatUntil} min={dateOk ? tanggal : undefined}
                  max={maxRepeat} disabled={disabled} onChange={(e) => setRepeatUntil(e.target.value)} {...aria("repeatUntil")} />
                <ErrMsg name="repeatUntil" />
                {repeatCount > 0 && (
                  <p className="mt-2 text-sm text-muted">
                    Akan dibuat {repeatCount} kegiatan (tiap hari {hari}). Salinan memakai detail dan foto sampul yang sama;
                    Firman dan galeri hanya untuk kegiatan pertama. Tanggal yang sudah terisi dilewati.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 2. Detail dinamis */}
      {jenis && (
        <Section title="Detail Kegiatan" hint="Isian yang dikosongkan tidak akan ditampilkan kepada jemaat.">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.filter((f) => f.type !== "textarea").map(renderField)}
          </div>
          {fields.filter((f) => f.type === "textarea").map(renderField)}
        </Section>
      )}

      {/* 3. Foto */}
      <Section title="Foto" hint="Foto sampul tampil di kartu beranda dan sebagai hero halaman detail.">
        <div>
          <span className="field-label">Foto Sampul</span>
          <CoverField value={cover} onChange={setCover} disabled={disabled} />
        </div>
        <div>
          <span className="field-label">Galeri Foto</span>
          <GalleryField items={gallery} onChange={setGallery} disabled={disabled} />
        </div>
      </Section>

      {/* 4. Firman */}
      <Section title="Firman" hint="Opsional. Kosongkan semua isian jika kegiatan ini tidak memiliki Firman.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-f-judul`} className="field-label">Judul / Tema</label>
            <input id={`${uid}-f-judul`} className="field" value={sermon.judul} maxLength={LIMITS.firmanJudul} disabled={disabled}
              onChange={(e) => setSermon((s) => ({ ...s, judul: e.target.value }))} {...aria("sermon.judul")} />
            <ErrMsg name="sermon.judul" />
          </div>
          <div>
            <label htmlFor={`${uid}-f-ayat`} className="field-label">Referensi Ayat</label>
            <input id={`${uid}-f-ayat`} className="field" placeholder="Contoh: Yohanes 3:16" value={sermon.ayat}
              maxLength={LIMITS.firmanAyat} disabled={disabled}
              onChange={(e) => setSermon((s) => ({ ...s, ayat: e.target.value }))} {...aria("sermon.ayat")} />
            <ErrMsg name="sermon.ayat" />
          </div>
          <div>
            <label htmlFor={`${uid}-f-pembicara`} className="field-label">Pembicara (opsional)</label>
            <input id={`${uid}-f-pembicara`} className="field" value={sermon.pembicara} maxLength={LIMITS.firmanPembicara} disabled={disabled}
              onChange={(e) => setSermon((s) => ({ ...s, pembicara: e.target.value }))} {...aria("sermon.pembicara")} />
            <ErrMsg name="sermon.pembicara" />
          </div>
        </div>
        <div>
          <span className="field-label" id={`${uid}-f-isi-label`}>Isi Firman</span>
          <RichTextEditor
            id={`${uid}-f-isi`}
            value={initial?.sermon.isi ?? ""}
            onChange={(html) => setSermon((s) => ({ ...s, isi: html }))}
            invalid={!!err("sermon.isi")}
            describedBy={err("sermon.isi") ? errId("sermon.isi") : undefined}
          />
          <ErrMsg name="sermon.isi" />
        </div>
      </Section>

      {/* Aksi */}
      <div className="sticky bottom-0 z-20 -mx-5 flex flex-col-reverse gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-3xl sm:border sm:px-6">
        <Link href={backHref} className="btn btn-outline" aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}>
          Batal
        </Link>
        <button type="submit" className="btn" disabled={disabled}>
          {busy ?? (isEdit ? "Simpan Perubahan" : repeat ? "Buat Kegiatan Berulang" : "Simpan Kegiatan")}
        </button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{busy ?? ""}</p>
    </form>
  );
}
