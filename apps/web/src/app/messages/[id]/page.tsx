import { notFound } from "next/navigation";
import Link from "next/link";
import { getInquiryScoped, ScopeDenied } from "@/lib/inquiryStore";
import { resolveActor } from "@/lib/actors";
import { seedRetriever } from "@/lib/adapters";
import { Badge, Card, Disclaimer, Notice } from "@/components/ui";
import { KIND_LABEL } from "@/lib/messages";
import ReplyForm from "@/components/ReplyForm";

// Next 16: page params are async. Server-rendered view of a thread.
//
// This page ENFORCES scope. An earlier version called the unscoped `getInquiry`
// and justified it as "reachable by direct link by design" — but that let any
// visitor read any thread by id, including a host's private replies. A shared
// link still requires the *recipient* to be authorised (R39, default-deny), so
// the actor is resolved server-side and the same ScopeDenied path as the API
// route applies here.

function expiryState(expiresAt: string | null): { text: string; tone: "ok" | "warn" | "bad" | "muted" } {
  if (!expiresAt) return { text: "no expiry set", tone: "muted" };
  const days = (new Date(expiresAt).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return { text: "expired — ask again", tone: "bad" };
  if (days < 2) return { text: `expires in ${Math.max(0, Math.round(days * 24))}h`, tone: "warn" };
  return { text: `expires ${new Date(expiresAt).toLocaleDateString("en-IN")}`, tone: "ok" };
}

export default async function ThreadView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveActor();
  let inquiry;
  try {
    inquiry = await getInquiryScoped(id, actor);
  } catch (e) {
    if (e instanceof ScopeDenied) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Notice tone="warn">
            <strong className="font-medium">Not available to this account.</strong> This thread is private
            to the visitor who created it and the provider it was sent to. Switch account from the header
            if you are one of them, or start your own inquiry from the{" "}
            <Link href="/inquire" className="underline">
              inquire page
            </Link>
            .
          </Notice>
        </main>
      );
    }
    throw e;
  }
  if (!inquiry) notFound();
  const place = await seedRetriever.getPlace(inquiry.placeId);

  const liveReports = inquiry.messages.filter((m) => m.availability);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-[#5D746B]">
        <Link href="/messages" className="underline">
          Messages
        </Link>
        <span> · thread {inquiry.id.slice(0, 8)}…</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[#0B3D2E]">
          {place?.name ?? inquiry.placeId}
        </h1>
        <Badge tone={inquiry.state === "answered" ? "ok" : inquiry.state === "closed" ? "muted" : "warn"}>
          {inquiry.state}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-[#5D746B]">
        {inquiry.partySize} guest(s) · {inquiry.checkIn ?? "dates not stated"} → {inquiry.checkOut ?? "—"} · opened{" "}
        {new Date(inquiry.createdAt).toLocaleString()}
      </p>

      {liveReports.length > 0 && (
        <Card className="mt-5 border-[#C19A4B]/40 bg-[#FBF6E9]">
          <h2 className="text-sm font-semibold text-[#5a4a1e]">Host-reported availability</h2>
          <ul className="mt-2 space-y-2">
            {liveReports.map((m) => {
              const e = expiryState(m.expiresAt);
              return (
                <li key={m.id} className="text-sm text-[#5a4a1e]">
                  <p className="font-medium">
                    {KIND_LABEL[m.availability!.kind] ?? m.availability!.kind} · {m.availability!.startDate} →{" "}
                    {m.availability!.endDateExclusive}
                  </p>
                  <p className="mt-0.5 text-xs">
                    {m.availability!.quantity != null && <>qty {m.availability!.quantity} · </>}
                    {m.availability!.quotePaise != null && (
                      <>₹{(m.availability!.quotePaise / 100).toLocaleString("en-IN")} · </>
                    )}
                    <Badge tone={e.tone}>{e.text}</Badge>
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-5 text-[#5a4a1e]">
            Reported by the host for those dates only. It is not held for you, it will expire, and the price may
            change. Confirm again before you travel.
          </p>
        </Card>
      )}

      <h2 className="mt-7 font-semibold">Messages</h2>
      <p className="mt-1 text-xs text-[#5D746B]">
        Original text is preserved exactly as written by each side — no silent substitution.
      </p>

      <div className="mt-3 space-y-3">
        {inquiry.messages.map((m) => (
          <div
            key={m.id}
            className={`premium-card rounded-2xl border p-3 text-sm ${
              m.senderRole === "provider" ? "border-[#0E5A42]/25 bg-[#EEF5F1]" : "border-[#0B3D2E]/10 bg-white"
            }`}
          >
            <p className="text-xs text-[#5D746B]/80">
              #{m.sequence} {m.senderRole === "provider" ? "provider" : "you"}
              {m.senderUnverified ? " (self-asserted)" : ""} · {new Date(m.acceptedAt).toLocaleString()}
            </p>
            <p className="mt-1 whitespace-pre-line text-[#1A2E28]">{m.originalText}</p>
            {m.availability && (
              <div className="mt-2 rounded-xl border border-[#C19A4B]/30 bg-[#FBF6E9] p-3 text-xs text-[#5a4a1e]">
                <Badge tone={expiryState(m.expiresAt).tone}>{expiryState(m.expiresAt).text}</Badge>
                <p className="mt-1">
                  {KIND_LABEL[m.availability.kind] ?? m.availability.kind} · {m.availability.startDate} →{" "}
                  {m.availability.endDateExclusive}
                  {m.availability.quantity != null && <> · qty {m.availability.quantity}</>}
                  {m.availability.quotePaise != null && (
                    <> · ₹{(m.availability.quotePaise / 100).toLocaleString("en-IN")}</>
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {actor.role === "provider" && <ReplyForm inquiryId={id} />}

      <Disclaimer className="mt-6" />

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/inbox" className="underline">
          Provider view
        </Link>
        <Link href={`/inquire?placeId=${inquiry.placeId}`} className="underline">
          Ask again
        </Link>
        {place && (
          <Link href={`/places/${place.id}`} className="underline">
            Back to {place.name}
          </Link>
        )}
      </div>
    </main>
  );
}
