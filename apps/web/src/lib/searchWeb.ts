// searchWeb — bounded internet tools for the assistant (public-apis audit 2026-09-20).
// Keyless, attributed, never authoritative: results are "sourced web information"
// (R28). Never writes operational status or inventory. Failures → null (silent).

const UA = process.env.AGENTROUTER_USER_AGENT ?? "opencode/1.0.0";

// Nominatim's usage policy requires a User-Agent that identifies THIS app, and
// at most one request per second. Reusing the LLM gateway's UA would misidentify
// us to the upstream service, so a distinct UA is used.
const NOMINATIM_UA = process.env.NOMINATIM_USER_AGENT ?? "manipur-tourism-mit/0.1 (prototype; contact via app owner)";
let lastNominatimAt = 0;

/** Serialise Nominatim calls to <=1 req/s as its usage policy requires. */
async function nominatimGate(): Promise<void> {
  const now = Date.now();
  const wait = 1000 - (now - lastNominatimAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimAt = Date.now();
}

async function getJson(url: string, timeoutMs: number, userAgent: string = UA): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": userAgent }, signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface WebSummary {
  title: string;
  extract: string;
  url: string;
  source: "wikipedia";
}

/** Wikipedia REST summary for a place/topic. Null when absent. */
export async function wikipediaSummary(topic: string): Promise<WebSummary | null> {
  const data = (await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
    6000
  )) as {
    extract?: string;
    type?: string;
    title?: string;
    content_urls?: { desktop?: { page?: string } };
  } | null;
  if (!data?.extract || data.type === "disambiguation") return null;
  return {
    title: data.title ?? topic,
    extract: data.extract.slice(0, 600),
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
    source: "wikipedia",
  };
}

export interface GeoCheck {
  displayName: string;
  lat: number;
  lng: number;
}

/** Nominatim lookup (usage policy: ≤1 req/s, identifying UA). Used for coord cross-checks. */
export async function nominatimLookup(query: string): Promise<GeoCheck | null> {
  await nominatimGate();
  const data = (await getJson(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    6000,
    NOMINATIM_UA
  )) as { display_name?: string; lat?: string; lon?: string }[] | null;
  if (!Array.isArray(data) || data.length === 0) return null;
  return { displayName: data[0].display_name ?? query, lat: Number(data[0].lat), lng: Number(data[0].lon) };
}
