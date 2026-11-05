"use client";

import { useRef, useState } from "react";
import { Cover } from "@/components/Cover";
import { useToast } from "@/components/Toast";
import { LIMITS } from "@/config/activities";
import { ALLOWED_IMAGE_TYPES, prepareImage } from "@/lib/images";

/** Foto di form: sudah tersimpan (`file` kosong) atau baru dipilih (`file` terkompres, belum diunggah). */
export interface PhotoItem {
  key: string;
  /** URL publik (foto tersimpan) atau object URL (pratinjau foto baru) */
  url: string;
  file?: File;
}

let counter = 0;
export const newKey = () => `p${Date.now().toString(36)}${counter++}`;

const ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

async function toItems(files: FileList | File[], onError: (m: string) => void): Promise<PhotoItem[]> {
  const out: PhotoItem[] = [];
  for (const f of Array.from(files)) {
    try {
      const file = await prepareImage(f);
      out.push({ key: newKey(), url: URL.createObjectURL(file), file });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Foto tidak dapat diproses.");
    }
  }
  return out;
}

function revoke(item: PhotoItem | null | undefined) {
  if (item?.file) URL.revokeObjectURL(item.url);
}

export function CoverField({
  value,
  onChange,
  disabled,
}: {
  value: PhotoItem | null;
  onChange: (v: PhotoItem | null) => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const [item] = await toItems([files[0]], toast.error);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (item) {
      revoke(value);
      onChange(item);
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border-2 border-line">
        <Cover url={value?.url} alt={value ? "Pratinjau foto sampul" : ""} className="aspect-[16/9] w-full" />
      </div>
      <p className="mt-2 text-sm text-muted">
        {value?.file ? "Foto baru. Akan diunggah saat Anda menekan Simpan." : value ? "Foto sampul saat ini." : "Belum ada foto sampul (tampil placeholder biru muda)."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          id="cover-input"
          onChange={(e) => pick(e.target.files)}
          disabled={disabled || busy}
          tabIndex={-1}
        />
        <button type="button" className="btn btn-sm" disabled={disabled || busy} onClick={() => input.current?.click()}>
          {busy ? "Memproses…" : value ? "Ganti Foto" : "Pilih Foto"}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={disabled || busy}
            onClick={() => {
              revoke(value);
              onChange(null);
            }}
          >
            Hapus Foto
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">JPG, PNG, atau WebP. Foto dikompres otomatis sebelum diunggah.</p>
    </div>
  );
}

export function GalleryField({
  items,
  onChange,
  disabled,
}: {
  items: PhotoItem[];
  onChange: (v: PhotoItem[]) => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const remaining = LIMITS.galleryMax - items.length;

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    let list = Array.from(files);
    if (list.length > remaining) {
      toast.info(`Maksimal ${LIMITS.galleryMax} foto. Hanya ${Math.max(remaining, 0)} foto pertama yang dipakai.`);
      list = list.slice(0, Math.max(remaining, 0));
    }
    setBusy(true);
    const added = await toItems(list, toast.error);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (added.length) onChange([...items, ...added]);
  }

  return (
    <div>
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it, i) => (
            <li key={it.key} className="relative overflow-hidden rounded-2xl border-2 border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={`Pratinjau foto galeri ${i + 1}`} className="aspect-square w-full object-cover" />
              {it.file && <span className="badge absolute left-2 top-2 !text-[0.6rem]">Baru</span>}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Hapus foto galeri ${i + 1}`}
                onClick={() => {
                  revoke(it);
                  onChange(items.filter((x) => x.key !== it.key));
                }}
                className="btn btn-danger absolute bottom-2 right-2 !min-h-[36px] !w-9 !bg-bg !p-0 dark:!bg-bg"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={items.length ? "mt-4" : ""}>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => pick(e.target.files)}
          disabled={disabled || busy || remaining <= 0}
          tabIndex={-1}
        />
        <button type="button" className="btn btn-sm" disabled={disabled || busy || remaining <= 0} onClick={() => input.current?.click()}>
          {busy ? "Memproses…" : "+ Tambah Foto"}
        </button>
        <p className="mt-2 text-xs text-muted">
          {items.length}/{LIMITS.galleryMax} foto. Foto baru diunggah saat Anda menekan Simpan.
        </p>
      </div>
    </div>
  );
}
