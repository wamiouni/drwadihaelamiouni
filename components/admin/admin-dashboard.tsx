"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewAction,
  addAction,
  deleteAction,
  logoutAction,
} from "@/app/admin/actions";
import type { Item } from "@/db/schema";

type Draft = {
  title: string;
  source: string;
  publishedDate: string;
  thumbnailUrl: string;
  language: "ar" | "en";
  mediaFormat: string;
  duplicate: boolean;
};

const FORMATS = ["", "tv", "radio", "video", "podcast", "print"];
const field =
  "w-full rounded-xl border border-line bg-parchment px-3 py-2 text-sm text-ink outline-none focus:border-mauve";

export function AdminDashboard({ items }: { items: Item[] }) {
  const router = useRouter();
  const [type, setType] = useState<"article" | "media" | "statement">(
    "article",
  );
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [, startTransition] = useTransition();

  async function fetchPreview() {
    if (!/^https?:\/\//i.test(url.trim())) {
      setMsg("أدخل رابطاً صحيحاً");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const e = await previewAction(url.trim(), type);
      setDraft({
        title: e.title,
        source: e.source,
        publishedDate: e.publishedDate ?? "",
        thumbnailUrl: e.thumbnailUrl ?? "",
        language: e.language,
        mediaFormat: "",
        duplicate: e.duplicate,
      });
    } catch {
      // enrichment failed — let them fill it in manually
      setDraft({
        title: "",
        source: "",
        publishedDate: "",
        thumbnailUrl: "",
        language: "ar",
        mediaFormat: "",
        duplicate: false,
      });
      setMsg("تعذّر جلب البيانات تلقائياً — أدخلها يدوياً");
    } finally {
      setLoading(false);
    }
  }

  async function publish(status: "published" | "draft") {
    if (!draft) return;
    const res = await addAction({
      type,
      title: draft.title,
      url: url.trim(),
      source: draft.source,
      publishedDate: draft.publishedDate || null,
      thumbnailUrl: draft.thumbnailUrl || null,
      language: draft.language,
      mediaFormat: type === "media" ? draft.mediaFormat || null : null,
      status,
    });
    if (!res.ok) {
      setMsg(res.error ?? "خطأ");
      return;
    }
    setDraft(null);
    setUrl("");
    setMsg(status === "published" ? "نُشر بنجاح ✓" : "حُفظ كمسودة ✓");
    startTransition(() => router.refresh());
  }

  function remove(id: string) {
    if (!confirm("حذف هذا العنصر نهائياً؟")) return;
    startTransition(async () => {
      await deleteAction(id);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-plum">لوحة التحكم</h1>
        <button
          onClick={async () => {
            await logoutAction();
            router.refresh();
          }}
          className="text-sm text-muted hover:text-mauve"
        >
          خروج
        </button>
      </div>

      {/* Add box */}
      <div className="mt-6 rounded-2xl border border-line bg-seashell p-5">
        <div className="mb-3 inline-flex rounded-full border border-line bg-parchment p-1 text-sm">
          {(["article", "media", "statement"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-1.5 transition ${
                type === t ? "bg-mauve text-parchment" : "text-plum"
              }`}
            >
              {
                { article: "مقال", media: "ظهور إعلامي", statement: "تصريح" }[
                  t
                ]
              }
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPreview()}
            placeholder="ألصق الرابط هنا…"
            dir="ltr"
            className="flex-1 rounded-full border border-line bg-parchment px-5 py-2.5 text-sm text-ink outline-none focus:border-mauve"
          />
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="rounded-full bg-mauve px-6 py-2.5 text-sm font-medium text-parchment transition hover:bg-mauve-dark disabled:opacity-60"
          >
            {loading ? "…" : "جلب"}
          </button>
        </div>

        {msg && <p className="mt-3 text-sm text-mauve-dark">{msg}</p>}

        {draft && (
          <div className="mt-5 grid gap-3 border-t border-line pt-5">
            {draft.duplicate && (
              <p className="rounded-xl bg-antique px-3 py-2 text-sm text-plum">
                ⚠︎ هذا الرابط مُضاف مسبقاً — سيتم تجاهله عند النشر.
              </p>
            )}
            <label className="text-xs text-muted">
              العنوان
              <input
                className={field}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted">
                المصدر
                <input
                  className={field}
                  value={draft.source}
                  onChange={(e) =>
                    setDraft({ ...draft, source: e.target.value })
                  }
                />
              </label>
              <label className="text-xs text-muted">
                التاريخ (YYYY-MM-DD)
                <input
                  className={field}
                  dir="ltr"
                  placeholder="2026-01-01"
                  value={draft.publishedDate}
                  onChange={(e) =>
                    setDraft({ ...draft, publishedDate: e.target.value })
                  }
                />
              </label>
              <label className="text-xs text-muted">
                اللغة
                <select
                  className={`${field} select-pill`}
                  value={draft.language}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      language: e.target.value as "ar" | "en",
                    })
                  }
                >
                  <option value="ar">عربي</option>
                  <option value="en">إنجليزي</option>
                </select>
              </label>
              {type === "media" && (
                <label className="text-xs text-muted">
                  النوع
                  <select
                    className={`${field} select-pill`}
                    value={draft.mediaFormat}
                    onChange={(e) =>
                      setDraft({ ...draft, mediaFormat: e.target.value })
                    }
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f === ""
                          ? "—"
                          : { tv: "تلفزيون", radio: "إذاعة", video: "فيديو", podcast: "بودكاست", print: "مطبوع" }[f]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-xs text-muted sm:col-span-2">
                رابط الصورة (اختياري)
                <input
                  className={field}
                  dir="ltr"
                  value={draft.thumbnailUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, thumbnailUrl: e.target.value })
                  }
                />
              </label>
            </div>
            {draft.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/thumb?u=${encodeURIComponent(draft.thumbnailUrl)}`}
                alt=""
                className="h-32 w-auto rounded-xl border border-line bg-champagne object-cover"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => publish("published")}
                className="rounded-full bg-mauve px-6 py-2 text-sm font-medium text-parchment transition hover:bg-mauve-dark"
              >
                نشر
              </button>
              <button
                onClick={() => publish("draft")}
                className="rounded-full border border-mauve px-5 py-2 text-sm text-plum transition hover:bg-antique"
              >
                حفظ كمسودة
              </button>
              <button
                onClick={() => setDraft(null)}
                className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <h2 className="mb-3 mt-10 text-lg text-plum">
        العناصر ({items.length})
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line">
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`flex items-center gap-3 px-4 py-3 text-sm ${
              i % 2 ? "bg-parchment" : "bg-seashell"
            }`}
          >
            <span className="shrink-0 text-base">
              {it.type === "article" ? "📄" : it.type === "media" ? "📺" : "💬"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-ink">{it.title}</div>
              <div className="truncate text-xs text-muted">
                {it.source}
                {it.publishedDate ? ` · ${it.publishedDate}` : ""}
                {it.status === "draft" ? " · مسودة" : ""}
              </div>
            </div>
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-mauve hover:text-plum"
            >
              فتح ↗
            </a>
            <button
              onClick={() => remove(it.id)}
              className="shrink-0 text-xs text-red-700/80 hover:text-red-700"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
