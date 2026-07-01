import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull } from "drizzle-orm";
import { items } from "../db/schema";

function ytId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/shorts\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

async function ogImage(url: string): Promise<string | null> {
  try {
    const html = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; WadihaSite/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    }).then((r) => r.text());
    const m =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      ) ||
      html.match(
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      );
    return m ? m[1].replace(/&amp;/g, "&") : null;
  } catch {
    return null;
  }
}

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const rows = await db.select().from(items).where(isNull(items.thumbnailUrl));
  console.log(`${rows.length} items without thumbnail.`);

  let yt = 0,
    og = 0,
    miss = 0;
  // small concurrency pool
  const pool = 6;
  for (let i = 0; i < rows.length; i += pool) {
    const batch = rows.slice(i, i + pool);
    await Promise.all(
      batch.map(async (r) => {
        let thumb: string | null = null;
        const id = ytId(r.url);
        if (id) {
          thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
          yt++;
        } else {
          thumb = await ogImage(r.url);
          if (thumb) og++;
          else miss++;
        }
        if (thumb) {
          await db
            .update(items)
            .set({ thumbnailUrl: thumb })
            .where(eq(items.id, r.id));
        }
      }),
    );
    process.stdout.write(".");
  }
  console.log(
    `\n✓ YouTube: ${yt}, og:image: ${og}, no thumbnail: ${miss}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
