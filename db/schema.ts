import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const itemType = pgEnum("item_type", ["article", "media", "statement"]);
export const itemStatus = pgEnum("item_status", ["draft", "published"]);
export const itemLanguage = pgEnum("item_language", ["ar", "en"]);
export const mediaFormat = pgEnum("media_format", [
  "tv",
  "radio",
  "video",
  "podcast",
  "print",
]);

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: itemType("type").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  url: text("url").notNull(),
  source: text("source").notNull(),
  publishedDate: date("published_date"),
  thumbnailUrl: text("thumbnail_url"),
  excerpt: text("excerpt"),
  language: itemLanguage("language").notNull().default("ar"),
  mediaFormat: mediaFormat("media_format"),
  topic: text("topic"),
  status: itemStatus("status").notNull().default("published"),
  featured: boolean("featured").notNull().default(false),
  // normalized URL, prevents accidental double-adds
  dedupKey: text("dedup_key").notNull().unique(),
  addedAt: timestamp("added_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
