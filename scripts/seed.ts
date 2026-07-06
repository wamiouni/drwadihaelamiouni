import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { items, type NewItem } from "../db/schema";
import { dedupKey, isArabic } from "../lib/url";

const XLSX_PATH = path.resolve(
  process.cwd(),
  "Wadiha_El_Amiouni_Articles_and_Media.xlsx",
);

const SHEETS: { name: string; type: "article" | "media" | "statement" }[] = [
  { name: "Articles مقالات", type: "article" },
  { name: "Media ظهور إعلامي", type: "media" },
  { name: "Statements تصريح", type: "statement" },
];

function normDate(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "—" || s === "-") return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

async function main() {
  const wb = XLSX.read(readFileSync(XLSX_PATH));
  const rows: NewItem[] = [];
  const seen = new Set<string>();

  for (const sheet of SHEETS) {
    const ws = wb.Sheets[sheet.name];
    if (!ws) {
      console.warn(`⚠︎ sheet not found: ${sheet.name}`);
      continue;
    }
    const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
    });
    for (const r of grid) {
      const idx = r[0];
      const title = String(r[1] ?? "").trim();
      const source = String(r[2] ?? "").trim();
      const date = normDate(r[3]);
      const url = String(r[4] ?? "").trim();
      if (typeof idx !== "number") continue; // skip header/title rows
      if (!/^https?:\/\//i.test(url)) continue;
      if (!title) continue;
      const key = dedupKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        type: sheet.type,
        title,
        source,
        url,
        publishedDate: date,
        language: isArabic(title) ? "ar" : "en",
        status: "published",
        dedupKey: key,
      });
    }
  }

  console.log(`Parsed ${rows.length} items from spreadsheet.`);
  if (!rows.length) throw new Error("No rows parsed — check sheet names/format.");

  const db = drizzle(neon(process.env.DATABASE_URL!));

  // Opt-in reset for a clean re-seed (dev / handoff). Never auto-wipes admin content.
  if (process.argv.includes("--reset")) {
    await db.delete(items);
    console.log("↺ Cleared items table (--reset).");
  }

  const inserted = await db
    .insert(items)
    .values(rows)
    .onConflictDoNothing({ target: items.dedupKey })
    .returning({ id: items.id });

  console.log(
    `✓ Inserted ${inserted.length} new items (skipped ${
      rows.length - inserted.length
    } existing).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
