import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getItems(type: "article" | "media") {
  return db
    .select()
    .from(items)
    .where(and(eq(items.type, type), eq(items.status, "published")))
    .orderBy(
      sql`${items.publishedDate} desc nulls last`,
      sql`${items.addedAt} desc`,
    );
}

export async function getLatest(type: "article" | "media", limit = 10) {
  return db
    .select()
    .from(items)
    .where(and(eq(items.type, type), eq(items.status, "published")))
    .orderBy(
      sql`${items.featured} desc`,
      sql`${items.publishedDate} desc nulls last`,
    )
    .limit(limit);
}

export async function getAllItems() {
  return db.select().from(items).orderBy(sql`${items.addedAt} desc`);
}
