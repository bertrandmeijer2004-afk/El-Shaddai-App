"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Galeri foto dengan lightbox: klik untuk memperbesar, panah/geser untuk berpindah, Esc untuk menutup. */
export function Gallery({ photos, title }: { photos: { id: string; url: string }[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const open = index !== null;
  const count = photos.length;

  const step = useCallback(
    (d: number) => setIndex((i) => (i === null ? i : (i + d + count) % count)),
    [count],
  );
  const close = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const returnTo = triggerRef.current;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnTo?.focus?.();
    };
  }, [open, close, step]);

  if (count === 0) return null;

  const navBtn =
    "btn !min-h-[48px] !w-12 !p-0 shadow-lg";

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setIndex(i);
              }}
              aria-label={`Perbesar foto ${i + 1} dari ${count}`}
              className="group block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`${title}, foto ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && index !== null && (
              <motion.div
                className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-3 sm:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="dialog"
                aria-modal="true"
                aria-label={`Galeri foto ${title}`}
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) close();
                }}
                onTouchStart={(e) => {
                  touchX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (touchX.current === null) return;
                  const dx = e.changedTouches[0].clientX - touchX.current;
                  touchX.current = null;
                  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={photos[index].id}
                  src={photos[index].url}
                  alt={`${title}, foto ${index + 1} dari ${count}`}
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                />

                <button ref={closeRef} type="button" onClick={close} aria-label="Tutup galeri" className={`${navBtn} absolute right-3 top-3 sm:right-6 sm:top-6`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                {count > 1 && (
                  <>
                    <button type="button" onClick={() => step(-1)} aria-label="Foto sebelumnya" className={`${navBtn} absolute left-3 top-1/2 -translate-y-1/2 sm:left-6`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 5l-7 7 7 7" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label="Foto berikutnya" className={`${navBtn} absolute right-3 top-1/2 -translate-y-1/2 sm:right-6`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs font-bold uppercase tracking-nav text-white" aria-live="polite">
                  {index + 1} / {count}
                </p>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
