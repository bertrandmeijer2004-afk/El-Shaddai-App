import sanitizeHtml from "sanitize-html";

/** Hanya tag pemformatan sederhana yang diizinkan untuk teks Firman. Tanpa atribut, tanpa tautan, tanpa gambar. */
const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "h3", "h4", "blockquote"],
  allowedAttributes: {},
  transformTags: {
    div: "p",
    b: "strong",
    i: "em",
    h1: "h3",
    h2: "h3",
    h5: "h4",
    h6: "h4",
  },
};

export function sanitizeRich(html: string): string {
  return sanitizeHtml(html, RICH_OPTIONS).trim();
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Teks polos dari HTML (untuk cuplikan dan pemeriksaan "kosong"). */
export function richToText(html: string): string {
  const stripped = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return stripped
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text: string, max = 140): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
