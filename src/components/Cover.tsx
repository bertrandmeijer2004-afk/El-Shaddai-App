/** Foto sampul; jika belum ada, tampilkan placeholder biru muda. */
export function Cover({
  url,
  alt = "",
  className = "",
  priority = false,
}: {
  url: string | null | undefined;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={`object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-primary to-accent/60 ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <svg viewBox="0 0 24 24" className="h-1/4 w-1/4 max-h-16 max-w-16 text-ink/30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 3v18M6 9h12" />
      </svg>
    </div>
  );
}
