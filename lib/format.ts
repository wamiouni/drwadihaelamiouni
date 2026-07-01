import type { Lang } from "./i18n";

export function formatDate(date: string | null, lang: Lang): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
