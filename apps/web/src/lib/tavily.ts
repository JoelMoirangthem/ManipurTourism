// tavily.ts — server-only real-time web tool for the assistant.
// Never import from client components. Key lives in TAVILY_API_KEY only.
// Failures → null (silent) so rag.ts falls back to Wikipedia/template.
// Docs: POST https://api.tavily.com/search, Bearer tvly-... (2026-09-21).

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate: string | null;
}

export interface TavilyOptions {
  topic?: "general" | "news" | "finance";
  maxResults?: number;
  timeRange?: "day" | "week" | "month" | "year";
  searchDepth?: "basic" | "advanced";
}

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

function timeoutSignal(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

/** Real-time search. Returns null when unconfigured, timed out, or upstream fails. */
export async function tavilySearch(query: string, opts?: TavilyOptions): Promise<TavilyResult[] | null> {
  const apiKey = process.env.TAVILY_API_KEY ?? "";
  const q = query.trim().slice(0, 400);
  if (!apiKey || !q) return null;
  const { signal, done } = timeoutSignal(6000);
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: q,
        search_depth: opts?.searchDepth ?? "basic",
        topic: opts?.topic ?? "general",
        max_results: Math.min(Math.max(opts?.maxResults ?? 5, 1), 10),
        include_answer: false,
        include_raw_content: false,
        ...(opts?.timeRange ? { time_range: opts.timeRange } : {}),
      }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { title?: string; url?: string; content?: string; score?: number; published_date?: string }[];
    };
    if (!Array.isArray(data.results)) return null;
    const out: TavilyResult[] = data.results
      .filter((r) => r.url && r.title)
      .slice(0, 10)
      .map((r) => ({
        title: String(r.title ?? "").slice(0, 200),
        url: String(r.url ?? ""),
        content: String(r.content ?? "").slice(0, 1200),
        score: typeof r.score === "number" ? r.score : 0,
        publishedDate: r.published_date ?? null,
      }));
    return out;
  } catch {
    return null;
  } finally {
    done();
  }
}

/** Topic picker: news for real-time/current queries, general otherwise. */
export function pickTavilyTopic(query: string, intent?: string): "general" | "news" {
  if (intent === "weather_context") return "news";
  if (/\b(now|today|current|latest|recent|news|update|weather|forecast|condition|status|open|closed)\b/i.test(query)) {
    return "news";
  }
  return "general";
}
