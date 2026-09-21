import cards from "@/data/phrase-cards.json";

// GET /api/phrases — reviewed/source-only cards. No fabricated translations (R35).
export async function GET() {
  return Response.json({
    cards: cards.map((c) => ({
      id: c.id,
      intent: c.intent,
      sourceText: c.sourceText,
      language: c.language,
      note: c.note,
    })),
    warning: "English sources only. Meiteilon targets publish after competent human review — never machine-invented.",
  });
}
