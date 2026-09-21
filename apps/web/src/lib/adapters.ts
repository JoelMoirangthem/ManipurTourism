// Adapters — implement ports. Swappable without touching domain or router.
// Server-side only: never import this file from client components.

import type { ILLMProvider, IRetriever, PlaceRecord, PlacePhoto } from "./ports";
import type { UploadRecord } from "./uploadStore";
import { listApprovedUploads } from "./uploadStore";
import seedPlaces from "../data/seed-places.json";

// ---------- seedRetriever (IRetriever) ----------
// SQL/PostGIS replaces this adapter in Phase 1 hardening; interface unchanged.
const places = seedPlaces as unknown as PlaceRecord[];

/**
 * Merge seed fixtures with approved community uploads.
 * GAP FIXED: approved media previously had no consumer, so the upload/review
 * loop terminated in the moderation queue. Approved assets now surface on the
 * place they were filed against, labelled by origin so a visitor can tell a
 * curated photo from a contributed one.
 */
async function withApprovedMedia(place: PlaceRecord): Promise<PlaceRecord> {
  const approved: UploadRecord[] = await listApprovedUploads(place.id);
  if (approved.length === 0) return place;
  const contributed: PlacePhoto[] = approved.map((u) => ({
    storageKey: `/api/uploads/${u.id}/raw`,
    caption: u.caption,
    attribution: u.attribution,
    license: u.license,
    sourcePage: "",
    origin: "approved-upload",
    uploadedAt: u.reviewedAt ?? u.createdAt,
  }));
  return {
    ...place,
    photos: [
      ...place.photos.map((p) => ({ ...p, origin: p.origin ?? ("seed" as const) })),
      ...contributed,
    ],
  };
}

export const seedRetriever: IRetriever = {
  async searchPlaces(query: string, opts?: { district?: string; category?: string; limit?: number }) {
    const q = query.toLowerCase().trim();
    const STOPWORDS = new Set([
      "what", "is", "the", "of", "to", "in", "a", "an", "and", "for", "on", "at",
      "me", "my", "you", "your", "please", "how", "do", "does", "did", "i", "it",
      "this", "that", "there", "here", "are", "was", "were", "be", "or", "with",
      "hi", "hello", "hey", "thanks", "thank", "dear", "near", "nearby", "around",
    ]);
    const terms = q.split(/\s+/).filter(Boolean).filter((t) => !STOPWORDS.has(t));
    // An empty query is a browse-all, not an empty result (used by /api/places
    // with no search term and by the health check).
    const pool = places
      .filter(
        (p) =>
          (!opts?.district || p.district.toLowerCase().includes(opts.district.toLowerCase())) &&
          (!opts?.category || p.category.toLowerCase() === opts.category.toLowerCase())
      )
      .map((p) => {
        if (terms.length === 0) return { p, score: 0 };
        const hay = `${p.name} ${p.aliases.join(" ")} ${p.category} ${p.district} ${p.summary}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0) + (p.name.toLowerCase().includes(t) ? 3 : 0), 0);
        return { p, score };
      })
      .filter((r) => (terms.length === 0 ? true : r.score > 0))
      .sort((a, b) => b.score - a.score);
    return pool.slice(0, opts?.limit ?? 6).map((r) => r.p);
  },

  async getPlace(id: string) {
    const found = places.find((p) => p.id === id) ?? null;
    return found ? withApprovedMedia(found) : null;
  },

  async listAll() {
    return places;
  },

  async nearby(lat: number, lng: number, radiusKm: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const distKm = (a: number, b: number, c: number, d: number) => {
      const R = 6371;
      const h =
        Math.sin(toRad(c - a) / 2) ** 2 +
        Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(toRad(d - b) / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    return places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ place: p, distanceKm: distKm(lat, lng, p.lat!, p.lng!) }))
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },
};

/** Places that can receive an inquiry (have a listing). */
export function contactablePlaces(): PlaceRecord[] {
  return places.filter((p) => p.category === "Stay" || p.category === "Lake" || p.category === "Heritage" || p.category === "Trek");
}

// ---------- agentRouterLLM (ILLMProvider) ----------
// OpenAI-compatible /chat/completions against AGENTROUTER_BASE_URL.
// Key lives in server env only. 12s timeout; throws on failure so the
// router falls back to templates (ADR-09).
// stream() yields OpenAI SSE deltas so /api/ai/query can flush tokens
// without waiting for the full completion.
export async function* streamAgentRouter(
  system: string,
  user: string,
  opts?: { maxTokens?: number; timeoutMs?: number }
): AsyncGenerator<string> {
  const baseUrl = process.env.AGENTROUTER_BASE_URL ?? "https://agentrouter.org/v1";
  const apiKey = process.env.AGENTROUTER_API_KEY ?? "";
  const model = process.env.AGENTROUTER_MODEL ?? "deepseek-v4-flash";
  const userAgent = process.env.AGENTROUTER_USER_AGENT ?? "opencode/1.0.0";
  if (!apiKey) throw new Error("AGENTROUTER_API_KEY is not configured");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 30000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": userAgent,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: opts?.maxTokens ?? 600,
        temperature: 0.2,
        stream: true,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`AgentRouter HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string }; message?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
          if (delta) yield delta;
        } catch {
          /* partial SSE frame — keep buffering */
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

export function agentRouterLLM(): ILLMProvider {
  const baseUrl = process.env.AGENTROUTER_BASE_URL ?? "https://agentrouter.org/v1";
  const apiKey = process.env.AGENTROUTER_API_KEY ?? "";
  const model = process.env.AGENTROUTER_MODEL ?? "deepseek-v4-flash";
  // Gateway rejects requests without this header — keep /v1 at end, never append /chat/completions to base.
  const userAgent = process.env.AGENTROUTER_USER_AGENT ?? "opencode/1.0.0";
  return {
    async complete(system: string, user: string, opts?: { maxTokens?: number; timeoutMs?: number }) {
      if (!apiKey) throw new Error("AGENTROUTER_API_KEY is not configured");
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 12000);
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "User-Agent": userAgent },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            max_tokens: opts?.maxTokens ?? 600,
            temperature: 0.2,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`AgentRouter HTTP ${res.status}`);
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error("AgentRouter returned empty content");
        return text;
      } finally {
        clearTimeout(timer);
      }
    },
    async *stream(system: string, user: string, opts?: { maxTokens?: number; timeoutMs?: number }) {
      yield* streamAgentRouter(system, user, opts);
    },
  };
}

// ---------- openMeteoWeather ----------
// Free, keyless. Returns a model snapshot with valid time — context only.
// Never implies open/safe/operational (R21). 4s budget; throws → caller hides section.
export interface WeatherSnapshot {
  tempC: number;
  windKph: number;
  code: number;
  validTime: string;
  provider: "open-meteo";
}

// WMO 4677 weather codes as used by Open-Meteo. Bands follow the actual code
// table: 1 = mainly clear, 2 = partly cloudy, 3 = overcast are NOT the same
// thing; and the "freezing" variants (56/57 freezing drizzle, 66/67 freezing
// rain) are called out separately because they are the ones that matter for
// hill roads — collapsing them into "drizzle"/"rain" would hide the hazard.
export function weatherDescription(code: number): string {
  if (code === 0) return "clear sky";
  if (code === 1) return "mainly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code === 56 || code === 57) return "freezing drizzle";
  if (code >= 61 && code <= 65) return "rain";
  if (code === 66 || code === 67) return "freezing rain";
  if (code >= 71 && code <= 75) return "snowfall";
  if (code === 77) return "snow grains";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code === 85 || code === 86) return "snow showers";
  if (code === 95) return "thunderstorm";
  if (code === 96 || code === 99) return "thunderstorm with hail";
  return "unknown conditions";
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`open-meteo HTTP ${res.status}`);
    const data = (await res.json()) as {
      current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number; time: string };
    };
    if (!data.current) throw new Error("open-meteo empty current");
    return {
      tempC: data.current.temperature_2m,
      windKph: data.current.wind_speed_10m,
      code: data.current.weather_code,
      validTime: data.current.time,
      provider: "open-meteo",
    };
  } finally {
    clearTimeout(timer);
  }
}
