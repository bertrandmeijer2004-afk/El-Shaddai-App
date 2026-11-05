/** Strip teks berjalan tak berujung. Frasa diulang dan dipisah titik "•". */
export function Marquee({ text, repeat = 8 }: { text: string; repeat?: number }) {
  const group = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {Array.from({ length: repeat }).map((_, i) => (
        <span key={i} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-3xl uppercase tracking-wideish sm:text-5xl">
            {text}
          </span>
          <span className="text-2xl sm:text-4xl" aria-hidden="true">
            •
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="overflow-hidden border-y-2 border-ink bg-primary py-4 text-ink sm:py-5"
      role="marquee"
      aria-label={text}
    >
      {/* Dua salinan identik: animasi bergeser -50% lalu mengulang tanpa jeda terlihat */}
      <div className="marquee-track animate-marquee hover:[animation-play-state:paused]">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
