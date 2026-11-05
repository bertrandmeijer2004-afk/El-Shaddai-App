"use client";

import { useEffect, useRef } from "react";

interface Cmd {
  label: string;
  title: string;
  run: () => void;
  className?: string;
}

const exec = (command: string, value?: string) => document.execCommand(command, false, value);

/**
 * Editor teks kaya ringan (tanpa dependensi). Menghasilkan HTML sederhana
 * (p, strong, em, u, h3, ul/ol/li, blockquote). Server tetap menyaring ulang HTML ini (sanitize-html).
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  /** Nilai awal. Editor tidak dikontrol penuh supaya posisi kursor tidak melompat. */
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value;
    // hanya sekali saat dipasang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    const el = ref.current;
    if (!el) return;
    // Browser sering meninggalkan <br> / <p><br></p> saat kosong: anggap kosong agar placeholder tampil.
    if (!el.textContent?.trim() && !el.querySelector("li")) {
      el.innerHTML = "";
      onChange("");
      return;
    }
    onChange(el.innerHTML);
  }

  const commands: Cmd[] = [
    { label: "B", title: "Tebal", run: () => exec("bold"), className: "font-black" },
    { label: "I", title: "Miring", run: () => exec("italic"), className: "italic" },
    { label: "U", title: "Garis bawah", run: () => exec("underline"), className: "underline" },
    { label: "Subjudul", title: "Subjudul", run: () => exec("formatBlock", "h3") },
    { label: "Paragraf", title: "Paragraf biasa", run: () => exec("formatBlock", "p") },
    { label: "• Daftar", title: "Daftar poin", run: () => exec("insertUnorderedList") },
    { label: "1. Daftar", title: "Daftar bernomor", run: () => exec("insertOrderedList") },
    { label: "Kutipan", title: "Kutipan ayat", run: () => exec("formatBlock", "blockquote") },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-line focus-within:border-accent aria-[invalid=true]:border-red-600" aria-invalid={invalid || undefined}>
      <div className="flex flex-wrap gap-1.5 border-b-2 border-line bg-surface p-2" role="toolbar" aria-label="Format teks">
        {commands.map((c) => (
          <button
            key={c.title}
            type="button"
            title={c.title}
            aria-label={c.title}
            // mousedown dicegah agar seleksi teks di editor tidak hilang saat tombol ditekan
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              c.run();
              emit();
            }}
            className={`rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-bold text-fg transition hover:bg-primary hover:text-ink active:bg-ink active:text-white dark:active:ring-2 dark:active:ring-white ${c.className ?? ""}`}
            style={{ minHeight: 36 }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-describedby={describedBy}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Tulis isi Firman di sini…"
        className="rte prose-firman min-h-[220px] bg-bg px-4 py-3 outline-none"
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Tempel sebagai teks polos agar format dari Word/web tidak ikut masuk.
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          exec("insertText", text);
        }}
      />
    </div>
  );
}
