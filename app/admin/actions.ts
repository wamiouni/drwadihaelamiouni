"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { dedupKey } from "@/lib/url";
import { enrich, type Enriched } from "@/lib/enrich";
import { isAuthed, signIn, signOut } from "@/lib/auth";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/media");
  revalidatePath("/admin");
}

export async function loginAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const pw = String(formData.get("password") ?? "");
  const ok = await signIn(pw);
  return ok ? { ok: true } : { ok: false, error: "كلمة المرور غير صحيحة" };
}

export async function logoutAction(): Promise<void> {
  await signOut();
  revalidatePath("/admin");
}

export async function previewAction(
  url: string,
  type: "article" | "media",
): Promise<Enriched & { duplicate: boolean }> {
  if (!(await isAuthed())) throw new Error("unauthorized");
  const e = await enrich(url, type);
  const existing = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.dedupKey, dedupKey(url)));
  return { ...e, duplicate: existing.length > 0 };
}

export type AddInput = {
  type: "article" | "media";
  title: string;
  url: string;
  source: string;
  publishedDate: string | null;
  thumbnailUrl: string | null;
  language: "ar" | "en";
  mediaFormat: string | null;
  status: "draft" | "published";
};

export async function addAction(
  data: AddInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!data.title.trim() || !/^https?:\/\//i.test(data.url.trim())) {
    return { ok: false, error: "العنوان والرابط مطلوبان" };
  }
  const inserted = await db
    .insert(items)
    .values({
      type: data.type,
      title: data.title.trim(),
      url: data.url.trim(),
      source: data.source.trim(),
      publishedDate: data.publishedDate || null,
      thumbnailUrl: data.thumbnailUrl || null,
      language: data.language,
      mediaFormat: (data.mediaFormat || null) as never,
      status: data.status,
      dedupKey: dedupKey(data.url),
    })
    .onConflictDoNothing({ target: items.dedupKey })
    .returning({ id: items.id });

  revalidateAll();
  if (!inserted.length) return { ok: false, error: "موجود مسبقاً" };
  return { ok: true };
}

export async function deleteAction(id: string): Promise<{ ok: boolean }> {
  if (!(await isAuthed())) throw new Error("unauthorized");
  await db.delete(items).where(eq(items.id, id));
  revalidateAll();
  return { ok: true };
}
