// apps/web/src/lib/wishlist.ts — browser-persisted shortlist. Ids only, capped at 50.
const WISHLIST_KEY = "mit_wishlist_v1";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, 50);
  } catch {
    return [];
  }
}

export function toggleWishlist(ids: string[], id: string): string[] {
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  const capped = next.slice(0, 50);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(capped));
    } catch {
      /* ignore */
    }
  }
  return capped;
}
