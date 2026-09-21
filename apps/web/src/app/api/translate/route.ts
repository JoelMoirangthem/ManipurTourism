import { z } from "zod";

const Body = z.object({
  text: z.string().min(1).max(2000),
  sourceLang: z.string().default("en"),
  targetLang: z.string().min(1).max(16),
});

const LANG_NAMES: Record<string, string> = {
  mni: "Manipuri (Meiteilon)",
  "mni-IN": "Manipuri (Meiteilon)",
  en: "English",
  "en-IN": "English",
  hi: "Hindi",
  "hi-IN": "Hindi",
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

async function geminiTranslate(
  text: string,
  targetName: string,
  signal: AbortSignal
): Promise<{ text: string; model: string }> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) throw new Error("gemini not configured");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=` + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate the following text to ${targetName}. Respond with only the translation, no explanation:\n"${text}"`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.2 },
      }),
      signal,
    }
  );
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const out = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!out) throw new Error("gemini empty result");
  return { text: out, model: GEMINI_MODEL };
}

async function sarvamTranslate(text: string, sourceLang: string, targetLang: string, signal: AbortSignal): Promise<string> {
  const key = process.env.SARVAM_API_KEY ?? "";
  if (!key) throw new Error("sarvam not configured");
  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
      model: "sarvam-translate:v1",
    }),
    signal,
  });
  if (!res.ok) throw new Error(`sarvam HTTP ${res.status}`);
  const data = (await res.json()) as { translated_text?: string };
  if (!data.translated_text) throw new Error("sarvam empty result");
  return data.translated_text;
}

// POST /api/translate — Gemini primary (verified live 2026-09-20), Sarvam
// failover when configured. Machine output always labeled; original preserved
// on failure, never silently substituted (R35/R36).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: "text and targetLang required" }, { status: 400 });

  const targetName = LANG_NAMES[parsed.data.targetLang] ?? parsed.data.targetLang;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    try {
      const { text, model } = await geminiTranslate(parsed.data.text, targetName, ctrl.signal);
      return Response.json({
        text,
        provider: "gemini",
        model, // the model actually used, not a hardcoded string (R31)
        quality: "machine_unreviewed",
        warning: "Machine output — verify critical details (dates, amounts, negation) with the other party. Meiteilon output needs native-speaker review before reviewed use.",
      });
    } catch {
      const text = await sarvamTranslate(parsed.data.text, parsed.data.sourceLang, parsed.data.targetLang, ctrl.signal);
      return Response.json({
        text,
        provider: "sarvam",
        model: "sarvam-translate:v1",
        quality: "machine_unreviewed",
        warning: "Machine output — verify critical details (dates, amounts, negation) with the other party.",
      });
    }
  } catch {
    return Response.json(
      { error: "Translation unavailable — original preserved. Use reviewed phrase cards + structured fields." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
