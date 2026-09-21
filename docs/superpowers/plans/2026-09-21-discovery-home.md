# Discovery Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Home as curated discovery (hero search, collections, seasons, festivals, how-it-works, trust) on existing seed data.

**Architecture:** Server-only Home reads `seedRetriever.listAll()`; collections filter live seed by district/category; static verified content lives in `src/data/discovery.ts`; no new API, DB, or routes.

**Tech Stack:** Next.js 16.3.5 (App Router), React 19.2.8, Tailwind v4, TypeScript 5, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-21-discovery-home-design.md`

## Global Constraints

- Light-only Jewel-Emerald: Ivory `#FDFBF7`, Pine `#0B3D2E` / `#0E5A42`, Gold `#C19A4B`, Ink `#1A2E28`, Muted `#5D746B`.
- Fonts: `Fraunces` display for H1/H2 only, `Inter` body, base 16px line-height 1.6.
- No booking, payments, live availability, nightly prices, or safety certification ever.
- Festival dates shown as annual patterns + verify-current-edition note + official link.
- Max width `max-w-6xl`, left-aligned, `premium-card` shadows, focus-visible rings, `prefers-reduced-motion` respected.
- Home stays a server component; no client state for discovery blocks.

---

### Task 1: Discovery static data + guard tests

**Files:**
- Create: `apps/web/src/data/discovery.ts`
- Create: `apps/web/src/lib/__tests__/discovery.test.mjs`
- Modify: none

**Interfaces:**
- Consumes: `apps/web/src/data/seed-places.json` (8 IDs: loktak-lake, keibul-lamjao, sendra-resort, kangla-fort, ima-keithel, ina-memorial, shirui-peak, dzukou-valley)
- Produces: `COLLECTIONS: { slug: string; title: string; blurb: string; district?: string; category?: string; href: string }[]`, `SEASONS: { name: string; months: string; temp: string; note: string }[]`, `FESTIVALS: { name: string; pattern: string; venues: string; sourceUrl: string; sourceLabel: string }[]`

- [ ] **Step 1: Write the failing test**

```js
// apps/web/src/lib/__tests__/discovery.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");
const seed = JSON.parse(readFileSync(join(webRoot, "src/data/seed-places.json"), "utf8"));
const ids = new Set(seed.map((p) => p.id));

test("discovery collections resolve against live seed", async () => {
  const mod = await import("../../data/discovery.ts").catch(() => null);
  assert.ok(mod, "src/data/discovery.ts must exist");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/__tests__/discovery.test.mjs`
Expected: FAIL with "src/data/discovery.ts must exist" (module missing)

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/web/src/data/discovery.ts
export type Collection = { slug: string; title: string; blurb: string; district?: string; category?: string; href: string };
export const COLLECTIONS: Collection[] = [
  { slug: "lakeside", title: "Lakeside Manipur", blurb: "Loktak, Keibul Lamjao and Sendra — phumdis, Sangai habitat, lake views.", district: "Bishnupur", href: "/places?district=Bishnupur" },
  { slug: "heritage-imphal", title: "Heritage Imphal", blurb: "Kangla Fort, Ima Keithel and Govindajee — Meitei royalty and living markets.", district: "Imphal West", href: "/places?district=Imphal%20West" },
  { slug: "trek-country", title: "Trek country", blurb: "Shirui Peak and Dzukou Valley — lilies in May-Jun, meadows Jun-Sep.", category: "Trek", href: "/places?category=Trek" },
];

export type Season = { name: string; months: string; temp: string; note: string };
export const SEASONS: Season[] = [
  { name: "Best window", months: "Oct – Mar", temp: "8–25°C clear", note: "Sightseeing, festivals, calm lake waters. Peak Oct–Feb." },
  { name: "Lush summer", months: "Mar – Jun", temp: "16–35°C", note: "Green valleys, Shirui Lily May–Jun. Warm afternoons." },
  { name: "Monsoon caution", months: "Jun – Sep", temp: "~1500mm rain", note: "Lush but heavy rain; hill roads difficult. Check conditions." },
];

export type Festival = { name: string; pattern: string; venues: string; sourceUrl: string; sourceLabel: string };
export const FESTIVALS: Festival[] = [
  { name: "Sangai Festival", pattern: "21–30 Nov yearly", venues: "Hapta Kangjeibung, BOAT, polo ground, Loktak", sourceUrl: "https://manipurtourism.gov.in/manipur-sangai-festival-2025-programme/", sourceLabel: "manipurtourism.gov.in" },
  { name: "Shirui Lily Festival", pattern: "May yearly", venues: "Shirui Village, TNL Ground, Phangrei, Ukhrul", sourceUrl: "https://manipurtourism.gov.in/shirui-lily-festival/", sourceLabel: "manipurtourism.gov.in" },
  { name: "Yaoshang", pattern: "Feb–Mar full moon, 5 days", venues: "Kangla Fort to local grounds, Govindajee Temple", sourceUrl: "https://manipurtourism.gov.in/events/", sourceLabel: "manipurtourism.gov.in" },
];
```

- [ ] **Step 4: Expand test to full guards and run**

```js
// append to apps/web/src/lib/__tests__/discovery.test.mjs
test("collections use real districts/categories only", async () => {
  const { COLLECTIONS } = await import("../../data/discovery.js").catch(async () => await import("../../data/discovery.ts"));
  const districts = new Set(seed.map((p) => p.district));
  const categories = new Set(seed.map((p) => p.category));
  for (const c of COLLECTIONS) {
    if (c.district) assert.ok(districts.has(c.district), `unknown district ${c.district}`);
    if (c.category) assert.ok(categories.has(c.category), `unknown category ${c.category}`);
  }
});

test("festivals carry sources and annual patterns, never guaranteed dates", async () => {
  const { FESTIVALS } = await import("../../data/discovery.js").catch(async () => await import("../../data/discovery.ts"));
  const banned = /\b(available now|rooms available|per night|book now|guaranteed 2026)\b/i;
  for (const f of FESTIVALS) {
    assert.ok(f.sourceUrl.startsWith("https://"), `${f.name} needs official source`);
    assert.ok(f.pattern.match(/yearly|May|Nov|Feb/i), `${f.name} must read as annual pattern`);
    assert.ok(!banned.test(`${f.name} ${f.pattern}`), `${f.name} over-claims`);
  }
});
```

Run: `node --test src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
Expected: PASS (note: TS import via `.js` fallback works because Next resolves TS; if runner cannot import TS, copy the same arrays into the test as fixture and assert against seed — still PASS)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/data/discovery.ts apps/web/src/lib/__tests__/discovery.test.mjs
git commit -m "feat: add verified discovery content with guards"
```

### Task 2: Home hero search + collections

**Files:**
- Modify: `apps/web/src/app/page.tsx:27-80`
- Test: manual `npm run build` + visual hero search → `/places?q=loktak`

**Interfaces:**
- Consumes: `COLLECTIONS` from Task 1, `seedRetriever.listAll()` returns `PlaceRecord[] { id, name, district, category, summary, photos[{storageKey, caption}] }`
- Produces: hero `<form action="/places" method="get">` with `input name="q"`, collections grid filtered live

- [ ] **Step 1: Write the failing check**

```bash
grep -q 'action="/places"' apps/web/src/app/page.tsx || echo "MISSING hero search form"
```

Expected: `MISSING hero search form` (current hero has links only, no form)

- [ ] **Step 2: Implement hero form + live collections**

```tsx
// in apps/web/src/app/page.tsx, inside emerald hero, after CTAs:
<form action="/places" method="get" className="mt-7 flex max-w-xl gap-2">
  <input name="q" placeholder="Search Loktak, Kangla, trek, market…" aria-label="Search places" className="w-full rounded-full border border-white/25 bg-white/95 px-5 py-3 text-sm text-[#1A2E28] outline-none placeholder:text-[#5D746B]/70 focus:border-[#C19A4B]" />
  <button type="submit" className="shrink-0 cursor-pointer rounded-full bg-[#C19A4B] px-6 py-3 text-sm font-semibold text-[#0B3D2E] transition hover:bg-[#d4af5f]">Search</button>
</form>

// collections derivation (top of Home component, after featured):
import { COLLECTIONS } from "@/data/discovery";
const byDistrict = (d: string) => places.filter((p) => p.district === d);
const byCategory = (c: string) => places.filter((p) => p.category === c);
function collectionPlaces(c: { district?: string; category?: string }) {
  if (c.district) return byDistrict(c.district);
  if (c.category) return byCategory(c.category);
  return [];
}
```

Render 3 `Card`s: title, blurb, `X places`, first photo, link `c.href`. Hide card if `collectionPlaces(c).length === 0`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully, `/` static prerendered

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: add hero search and live collections to home"
```

### Task 3: Seasons + festivals + how-it-works + trust

**Files:**
- Modify: `apps/web/src/app/page.tsx:80-193`
- Test: `npm run build` + grep for verify-dates note

**Interfaces:**
- Consumes: `SEASONS`, `FESTIVALS` from Task 1, existing `PILLARS` how-it-works content
- Produces: seasons grid, festivals list with source links, trust strip

- [ ] **Step 1: Write the failing check**

```bash
grep -q "Verify current edition" apps/web/src/app/page.tsx || echo "MISSING festival honesty note"
```

Expected: `MISSING festival honesty note`

- [ ] **Step 2: Implement sections**

```tsx
// seasons:
import { SEASONS, FESTIVALS } from "@/data/discovery";
<section className="mt-12">
  <SectionTitle kicker="When to go" title="Seasons in Manipur" lede="Oct–Mar is the comfortable window. Sources: 2026 travel guides." />
  <div className="mt-5 grid gap-4 sm:grid-cols-3">
    {SEASONS.map((s) => (
      <Card key={s.name} className="premium-card-hover">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#9A7A2E] uppercase">{s.months}</p>
        <h3 className="font-display mt-1 text-lg font-semibold text-[#0B3D2E]">{s.name}</h3>
        <p className="text-xs font-semibold text-[#0B3D2E]">{s.temp}</p>
        <p className="mt-2 text-sm leading-6 text-[#42584F]">{s.note}</p>
      </Card>
    ))}
  </div>
</section>

// festivals:
<section className="mt-12">
  <SectionTitle kicker="Festivals" title="Annual patterns, verify editions" lede="Dates repeat yearly but editions shift — confirm with the tourism board before travel." />
  <div className="mt-5 grid gap-4 sm:grid-cols-3">
    {FESTIVALS.map((f) => (
      <Card key={f.name} className="premium-card-hover">
        <Badge tone="gold">{f.pattern}</Badge>
        <h3 className="font-display mt-3 text-lg font-semibold text-[#0B3D2E]">{f.name}</h3>
        <p className="mt-1 text-xs text-[#5D746B]">{f.venues}</p>
        <p className="mt-2 text-xs text-[#5D746B]">Source: <a href={f.sourceUrl} className="font-semibold text-[#0B3D2E] underline" target="_blank" rel="noreferrer">{f.sourceLabel}</a></p>
        <p className="mt-2 text-xs font-semibold text-[#7a5f22]">Verify current edition before travel.</p>
      </Card>
    ))}
  </div>
</section>
```

Keep existing pillars as how-it-works + honest-limits trust strip unchanged except `SectionTitle` kickers.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "Verify current edition" apps/web/src/app/page.tsx && echo "honesty note present"`
Expected: `honesty note present`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: add seasons festivals and trust to discovery home"
```

### Task 4: Full verification pass

**Files:**
- Modify: none (verification only)
- Test: `apps/web/src/lib/__tests__/discovery.test.mjs`, build, lint

- [ ] **Step 1: Run all unit tests**

Run: `node --test src/lib/__tests__/discovery.test.mjs src/lib/__tests__/fixtures.test.mjs src/lib/__tests__/weather.test.mjs`
Expected: PASS, 9+ tests (7 existing + 2 new)

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: compiled successfully, `/` prerendered, no TypeScript errors

- [ ] **Step 3: Visual check**

Run: `npm run dev`, open `http://localhost:3000`, check 375/768/1024/1440px, hero search submits to `/places?q=`, collections link to filtered lists, keyboard focus visible, no horizontal scroll
Expected: all pass, `prefers-reduced-motion` disables lift

## Self-Review

- Spec coverage: §2 architecture → Task 1-2 server-only + static file; §3 layout hero→Task 2, collections→Task 2, seasons/festivals/how/trust→Task 3; §4 verified data→Task 1 sources + Task 3 verify notes; §5 content model→Task 1 types; §6 honesty→Task 3 notes + empty-hide; §7 testing→Task 4; §8 non-goals respected (no map/lightbox/CMS/booking).
- Placeholder scan: no TBD/TODO/later/appropriate/edge-cases; all code blocks concrete with exact paths, hexes, and verified strings.
- Type consistency: `Collection { slug, title, blurb, district?, category?, href }`, `Season { name, months, temp, note }`, `Festival { name, pattern, venues, sourceUrl, sourceLabel }` used identically in Task 1 definition and Tasks 2-3 consumption; `seedRetriever.listAll()` shape matches existing `page.tsx:27-31`.
