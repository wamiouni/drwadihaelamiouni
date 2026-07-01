import { isArabic } from "./url";

export type Enriched = {
  title: string;
  source: string;
  publishedDate: string | null;
  thumbnailUrl: string | null;
  language: "ar" | "en";
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function meta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

export async function enrich(
  url: string,
  _type: "article" | "media",
): Promise<Enriched> {
  // YouTube / Vimeo via oEmbed
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) {
    try {
      const o = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      ).then((r) => r.json());
      const title: string = o.title ?? "";
      return {
        title,
        source: o.author_name ?? "YouTube",
        publishedDate: null,
        thumbnailUrl: o.thumbnail_url ?? null,
        language: isArabic(title) ? "ar" : "en",
      };
    } catch {
      /* fall through */
    }
  }

  let html = "";
  try {
    html = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; WadihaSite/1.0)" },
      redirect: "follow",
    }).then((r) => r.text());
  } catch {
    /* leave html empty */
  }

  const title =
    meta(html, "og:title") ??
    decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "");
  const thumbnailUrl = meta(html, "og:image");
  const site = meta(html, "og:site_name");

  let publishedDate: string | null = null;
  const dm =
    html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/) ||
    html.match(
      /(?:property|name)=["']article:published_time["'][^>]+content=["'](\d{4}-\d{2}-\d{2})/i,
    );
  if (dm) publishedDate = dm[1];

  let source = site ?? "";
  if (!source) {
    try {
      source = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      source = "";
    }
  }

  return {
    title,
    source,
    publishedDate,
    thumbnailUrl,
    language: isArabic(title) ? "ar" : "en",
  };
}
