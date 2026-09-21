// src/lib/messages.ts — pure, client-safe helpers for the merged /messages surface.
export function threadUrl(id: string): string {
  return `/messages/${id}`;
}

export function roleCopy(role: string): { title: string; lede: string } {
  if (role === "provider-demo" || role === "provider")
    return {
      title: "Messages for your listings",
      lede: "Threads addressed to listings you own. Replies are host-reported and expire — never reservations.",
    };
  if (role === "reviewer-demo" || role === "reviewer" || role === "admin-demo" || role === "admin")
    return {
      title: "All message threads",
      lede: "Moderation view — read-only. Scope is enforced server-side.",
    };
  return {
    title: "My messages",
    lede: "Threads you started. Only you and the addressed host can read them.",
  };
}

export const KIND_LABEL: Record<string, string> = {
  reported_available: "Host reports available",
  reported_unavailable: "Host reports unavailable",
  needs_details: "Host needs more details",
};
