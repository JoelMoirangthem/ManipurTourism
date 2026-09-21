import Link from "next/link";
import { seedRetriever } from "@/lib/adapters";
import { COLLECTIONS, SEASONS, FESTIVALS } from "@/data/discovery";
import { Badge, Card, SectionTitle, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { TripWidget } from "@/components/TripWidget";
import { AttractionsRail } from "@/components/AttractionsRail";
import { SeasonExplorer } from "@/components/SeasonExplorer";
import { PlaceCoverCard } from "@/components/PlaceCoverCard";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";

const PILLARS = [
  {
    title: "Communicate with confidence",
    body: "Send a structured question to a provider, with reviewed phrase cards and machine translation that always labels itself. Your original words are preserved, never replaced.",
    href: "/inquire",
    cta: "Draft an inquiry",
  },
  {
    title: "Plan without invented facts",
    body: "Deterministic draft orders and budget arithmetic computed in code. Missing confirmations are listed rather than hidden behind a confident-sounding number.",
    href: "/plan",
    cta: "Draft a plan",
  },
  {
    title: "See what is actually known",
    body: "Every fact shows its source, its age, and whether it was reviewed. Capacity from a directory is never presented as availability for your dates.",
    href: "/places",
    cta: "Browse places",
  },
];

export default async function Home() {
  const places = await seedRetriever.listAll();
  const districts = new Set(places.map((p) => p.district));
  const totalClaims = places.reduce((n, p) => n + p.claims.length, 0);
  const featured = places.slice(0, 4);
  const byDistrict = (d: string) => places.filter((p) => p.district === d);
  const byCategory = (c: string) => places.filter((p) => p.category === c);
  function collectionPlaces(c: { district?: string; category?: string }) {
    if (c.district) return byDistrict(c.district);
    if (c.category) return byCategory(c.category);
    return [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Hero — the single memorable moment */}
      <section className="relative mt-8 overflow-hidden rounded-[28px] border border-[#0B3D2E]/10 bg-[#0B3D2E] px-6 py-12 sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 20% 10%, rgba(193,154,75,0.35), transparent 60%), radial-gradient(800px 400px at 90% 90%, rgba(20,113,82,0.6), transparent 60%), radial-gradient(400px 200px at 70% 20%, rgba(253,251,247,0.12), transparent 60%)",
          }}
        />
        <div className="relative max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#F3E8CF] uppercase">
              Manipur · Re-Imagining Manipur
            </span>
            <span className="rounded-full bg-[#C19A4B] px-3 py-1 text-[11px] font-semibold text-[#0B3D2E]">
              Verified source-first
            </span>
          </div>
          <h1 className="font-display mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-[#FDFBF7] sm:text-6xl">
            Plan Manipur from verified info.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#DCEBE3]">
            Browse sourced places, draft a tentative itinerary with an honest budget, and send a structured
            question to a local provider. Every answer shows its source, its age, and what is still unknown —
            never a reservation, and never a safety guarantee.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/places"
              className="inline-flex items-center justify-center rounded-full bg-[#FDFBF7] px-6 py-3 text-sm font-semibold text-[#0B3D2E] transition hover:bg-white"
            >
              Browse places →
            </Link>
            <Link
              href="/?assistant=open"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ask the assistant
            </Link>
            <Link
              href="/plan"
              className="inline-flex items-center justify-center rounded-full border border-[#C19A4B]/60 bg-transparent px-6 py-3 text-sm font-semibold text-[#F3E8CF] transition hover:bg-[#C19A4B]/20"
            >
              Draft a plan
            </Link>
          </div>
          <div className="mt-7 max-w-xl">
            <TripWidget />
            <p className="mt-3 text-xs text-[#DCEBE3]/80">
              Dates and travellers are context only — never live availability.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Quick searches">
            {[
              ["Loktak", "/places?q=Loktak"],
              ["Kangla", "/places?q=Kangla"],
              ["Trek", "/places?q=trek"],
              ["Market", "/places?q=market"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                aria-label={`Search places for ${label}`}
                className="rounded-full border border-[#C19A4B]/50 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#F3E8CF] transition hover:bg-[#C19A4B]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C19A4B]"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#DCEBE3]/80">
            <span>✓ Sources + age shown</span>
            <span>✓ No invented prices</span>
            <span>✓ Host reply ≠ booking</span>
          </div>
        </div>
      </section>

      {/* Intent Router — 3 direct primary user pathways */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Primary destinations">
        <Link
          href="/places"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm transition hover:border-[#0B3D2E]/30 hover:shadow-md"
        >
          <div>
            <span className="inline-flex rounded-full bg-[#EEF5F1] px-2.5 py-1 text-xs font-semibold text-[#0B3D2E]">
              Directory · {places.length} Places
            </span>
            <h2 className="font-display mt-3 text-xl font-semibold text-[#0B3D2E] group-hover:text-[#0E5A42]">
              Explore Destinations →
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#5D746B]">
              Discover authentic Meitei heritage, pristine wetlands, prehistoric caves, and hill country across all districts.
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#C19A4B] uppercase tracking-wider">
            Browse catalogue
          </p>
        </Link>

        <Link
          href="/nearby"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm transition hover:border-[#0B3D2E]/30 hover:shadow-md"
        >
          <div>
            <span className="inline-flex rounded-full bg-[#FBF6E9] px-2.5 py-1 text-xs font-semibold text-[#7a5f22]">
              GPS Radar & Navigation
            </span>
            <h2 className="font-display mt-3 text-xl font-semibold text-[#0B3D2E] group-hover:text-[#0E5A42]">
              What&rsquo;s Around You →
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#5D746B]">
              Find tourist places nearest your live location with adjustable 5–30 km radius and instant turn-by-turn driving directions.
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#C19A4B] uppercase tracking-wider">
            Open radar map
          </p>
        </Link>

        <Link
          href="/messages"
          className="group relative flex flex-col justify-between rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm transition hover:border-[#0B3D2E]/30 hover:shadow-md"
        >
          <div>
            <span className="inline-flex rounded-full bg-[#EEF5F1] px-2.5 py-1 text-xs font-semibold text-[#0B3D2E]">
              Role-Aware Communication
            </span>
            <h2 className="font-display mt-3 text-xl font-semibold text-[#0B3D2E] group-hover:text-[#0E5A42]">
              Inquiries & Messages →
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#5D746B]">
              Ask questions directly to local operators and authorities with structured phrase cards and verified expiry quotes.
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#C19A4B] uppercase tracking-wider">
            View conversations
          </p>
        </Link>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Catalogue statistics">
        {[
          { label: "Places in the catalogue", value: places.length, sub: "Curated records" },
          { label: "Districts covered", value: districts.size, sub: "Across Manipur" },
          { label: "Sourced claims on record", value: totalClaims, sub: "With provenance" },
        ].map((s) => (
          <Card key={s.label} className="premium-card-hover relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#0B3D2E] to-[#C19A4B]" />
            <p className="font-display text-3xl font-semibold text-[#0B3D2E]">
              <CountUp value={s.value} />
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#1A2E28]">{s.label}</p>
            <p className="text-xs text-[#5D746B]">{s.sub}</p>
          </Card>
        ))}
      </section>

      <section className="mt-12">
        <SectionTitle
          kicker="Collections"
          title="Browse by collection"
          lede="Live views over the current catalogue — a collection stays hidden when it has no places yet."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {COLLECTIONS.map((c) => {
            const items = collectionPlaces(c);
            if (items.length === 0) return null;
            const cover = items[0]?.photos[0];
            return (
              <Card key={c.slug} className="premium-card-hover flex flex-col">
                {cover && (
                  <div className="relative -m-5 mb-0 overflow-hidden rounded-t-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.storageKey}
                      alt={cover.caption}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <h3 className="font-display mt-4 text-lg font-semibold text-[#0B3D2E]">{c.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#42584F]">{c.blurb}</p>
                <p className="mt-2 text-xs font-semibold tracking-wide text-[#9A7A2E] uppercase">
                  {items.length} place{items.length === 1 ? "" : "s"}
                </p>
                <Link
                  href={c.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4 hover:text-[#0E5A42]"
                >
                  Explore →
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <Reveal className="mt-12">
        <AttractionsRail
          places={places.map((p) => ({
            id: p.id,
            name: p.name,
            district: p.district,
            category: p.category,
            tagline: p.tagline,
            photo: p.photos[0]?.storageKey ?? null,
            factsCount: p.claims.length,
          }))}
        />
      </Reveal>

      <section className="mt-12">
        <SectionTitle kicker="When to go" title="Seasons in Manipur" lede="Oct–Mar is the comfortable window. Sources: 2026 travel guides." />
        <div className="mt-5">
          <Reveal>
            <SeasonExplorer seasons={SEASONS} />
          </Reveal>
        </div>
      </section>

      <section id="festivals" className="mt-12">
        <SectionTitle kicker="Festivals" title="Annual patterns, verify editions" lede="Dates repeat yearly but editions shift — confirm with the tourism board before travel." />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {FESTIVALS.map((f) => (
            <Card key={f.name} className="premium-card-hover">
              <Badge tone="gold">{f.pattern}</Badge>
              <h3 className="font-display mt-3 text-lg font-semibold text-[#0B3D2E]">{f.name}</h3>
              <p className="mt-1 text-xs text-[#5D746B]">{f.venues}</p>
              <p className="mt-2 text-xs text-[#5D746B]">Source: <a href={f.sourceUrl} className="font-semibold text-[#0B3D2E] underline" target="_blank" rel="noreferrer">{f.sourceLabel}</a></p>
              <p className="mt-2 text-xs font-semibold text-[#7a5f22]">Verify current edition before travel.</p>
              <Link
                href={`/?assistant=open&ask=${encodeURIComponent(`Tell me about ${f.name}`)}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4 hover:text-[#0E5A42]"
              >
                Ask Mit →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle
          kicker="How it works"
          title="Three things this does properly"
          lede="Built for honesty in a place where rumour travels faster than fact."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Card key={p.title} className="premium-card-hover flex flex-col">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0B3D2E] text-sm font-semibold text-[#F3E8CF]">
                {["✉", "◐", "◎"][i]}
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold text-[#0B3D2E]">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#42584F]">{p.body}</p>
              <Link
                href={p.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0B3D2E] underline decoration-[#C19A4B] decoration-2 underline-offset-4 hover:text-[#0E5A42]"
              >
                {p.cta} →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <Reveal>
        <div className="flex items-end justify-between gap-4">
          <SectionTitle kicker="Start here" title="Start somewhere" lede="Hand-picked records to begin with." />
          <Link
            href="/places"
            className="shrink-0 rounded-full border border-[#0B3D2E]/15 bg-white px-4 py-2 text-sm font-semibold text-[#0B3D2E] transition hover:border-[#0B3D2E]/30"
          >
            See all {places.length} →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <PlaceCoverCard
              key={p.id}
              place={{
                id: p.id,
                name: p.name,
                district: p.district,
                category: p.category,
                tagline: p.tagline,
                photo: p.photos[0]?.storageKey ?? null,
                photoAlt: p.photos[0]?.caption,
                factsCount: p.claims.length,
              }}
            />
          ))}
        </div>
        </Reveal>
      </section>

      <section className="mt-10 rounded-2xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-6">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9A7A2E] uppercase">Honest limits</p>
        <h2 className="font-display mt-1 text-xl font-semibold text-[#0B3D2E]">
          What this deliberately does not do
        </h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#5a4a1e] sm:grid-cols-2">
          <li className="flex gap-2"><span>—</span>It does not book, hold, reserve or confirm anything.</li>
          <li className="flex gap-2"><span>—</span>It does not certify any place or operator as safe.</li>
          <li className="flex gap-2"><span>—</span>It does not present capacity as live availability.</li>
          <li className="flex gap-2"><span>—</span>It does not invent prices or permits to fill a gap.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/places" className={primaryButtonClass}>Browse places</Link>
          <Link href="/plan" className={secondaryButtonClass}>Draft a plan</Link>
        </div>
      </section>
    </main>
  );
}
