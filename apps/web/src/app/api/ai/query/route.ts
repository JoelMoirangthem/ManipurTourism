import { z } from "zod";
import { routeQuery, routeQueryEvents } from "@/lib/rag";

const Body = z.object({ query: z.string().min(1).max(500), stream: z.boolean().optional() });

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// POST /api/ai/query — server-only LLM + Tavily calls; keys never reach the browser.
// Non-stream (default): JSON RouterResult (backward compatible).
// Stream: { query, stream: true } OR Accept: text/event-stream → text/event-stream
//   events: status {message} → sources {sources,intent,matched} → token {token}* → done {result}.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: "query is required (1–500 chars)" }, { status: 400 });
  const wantsStream = parsed.data.stream === true || (request.headers.get("accept") ?? "").includes("text/event-stream");
  if (!wantsStream) {
    const result = await routeQuery(parsed.data.query);
    return Response.json(result);
  }
  const query = parsed.data.query;
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(enc.encode(sseEncode(event, data)));
      try {
        for await (const ev of routeQueryEvents(query)) {
          if (ev.type === "status") send("status", { message: ev.message });
          else if (ev.type === "sources") send("sources", { sources: ev.sources, intent: ev.intent, matched: ev.matched });
          else if (ev.type === "token") send("token", { token: ev.token });
          else if (ev.type === "done") {
            send("done", ev.result);
            break;
          }
        }
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "stream failed" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
