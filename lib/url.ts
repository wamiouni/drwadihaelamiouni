/** Normalized key used to detect duplicate items (keeps meaningful query like ?v=). */
export function dedupKey(url: string): string {
  let u = url.trim().toLowerCase().replace(/#.*$/, "");
  // strip common tracking params, keep meaningful ones (e.g. youtube ?v=)
  u = u.replace(
    /([?&])(utm_[^=&]+|fbclid|gclid|mc_[^=&]+|igshid)=[^&]*/g,
    "$1",
  );
  u = u.replace(/[?&]+$/, "").replace(/\/+$/, "");
  return u;
}

/** Detect Arabic script to set an item's language. */
export function isArabic(s: string): boolean {
  return /[؀-ۿ]/.test(s);
}
