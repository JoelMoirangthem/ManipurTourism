# Discovery Home — Curated Discovery on Seed Data

Date: 2026-09-21
Status: proposed — awaiting user review before implementation plan
Scope: Approach A only. No backend, no stores, no new routes.

## 1. Goal
Make Home feel like a fully-functional tourism site while keeping the honest-planner core and Jewel-Emerald light premium system. Visitor can search, browse collections, understand seasons/festivals, then flow into existing `/places`, `/plan`, `/inquire`, `/assistant`.

## 2. Architecture & scope
- Home stays a Next.js server component reading `seedRetriever.listAll()` (8 places).
- Collections derived in code via district/category filters, never hardcoded IDs that can drift.
- Hero search links to `/places?q=` (existing API). No new search logic.
- Seasons/festivals/how-it-works from new static `src/data/discovery.ts` with source labels.
- Reuses `ui.tsx` (`Card`, `Badge`, `SectionTitle`), existing tokens (`Ivory #FDFBF7`, `Pine #0B3D2E`, `Gold #C19A4B`), `Fraunces` display + `Inter` body, `max-w-6xl` left-aligned.
- Files: rewrite `src/app/page.tsx`, add `src/data/discovery.ts`. No API, no DB, no auth changes.

## 3. Layout
Order, all left-aligned:
1. Emerald hero — kicker, serif H1, search input → `/places?q`, quick chips (Loktak, Kangla, trek, market), stats (places, districts, claims).
2. Collections — 3 cards: Lakeside (Bishnupur), Heritage Imphal (Imphal West), Trek country (category Trek). Each shows 1 photo, count, link to filtered `/places`.
3. Seasons — 3 cols: Oct-Mar best 8-25C clear; Mar-Jun lush 16-35C; Jun-Sep monsoon ~1500mm caution.
4. Festivals — Sangai 21-30 Nov yearly; Shirui Lily May; Yaoshang Feb/Mar full moon. Each with venues + official link + verify-dates note.
5. How-it-works — Browse → Draft → Ask, linking `/places`, `/plan`, `/inquire`.
6. Trust strip — sources+age shown, no invented prices, reply ≠ booking, capacity ≠ availability.

One bold moment only: the emerald hero. Everything else quiet ivory/white cards with `premium-card` shadow.

## 4. Verified data & sources
Verified 2026-09-21 via web search. Used as annual patterns with sources shown, never as live guarantees.

Places:
- Loktak Lake — largest freshwater NE India, Ramsar, phumdis, 48km Imphal, best Oct-Mar.
- Keibul Lamjao — only floating national park, Sangai home, 50-55km Imphal.
- Kangla Fort — ~2000yr Meitei seat, 237 acres, returned 2004.
- Ima Keithel — largest all-women market, 5000+ vendors, central Imphal.
- Dzukou Valley — Manipur-Nagaland trek, best end Jun-Sep.
- Shirui Peak — 2835m, Shirui Lily endemic May-Jun.
- INA Memorial Moirang — first INA flag 1944.
- Sendra Island — panoramic lake views, 45km Imphal.
Sources: manipurtourism.gov.in/nature-and-wildlife, manipurtourism.gov.in festivals, indianholiday.com/places-to-visit-in-manipur 2026, wildhilladventure.com/manipur-travel-guide-2026, northeastindiaconnect.com/manipur-travel-guide.

Festivals:
- Sangai 21-30 Nov yearly, Hapta Kangjeibung/BOAT/polo ground/Loktak.
- Shirui Lily May (20-24 May 2025 5th edition), Ukhrul venues.
- Yaoshang 5-day Phalguna full moon Feb/Mar (3 Mar 2026 start), torch rally from Kangla.
- Also: Ningol Chakouba Oct/Nov, Lui-Ngai-Ni 15 Feb, Kut 1 Nov, Cheiraoba 14 Apr.
Sources: northeastindiafestivals.com/sangai-festival, manipurtourism.gov.in/shirui-lily-festival, ukhrul.nic.in, Assam Tribune 2026-03-04, factohr.com Manipur holidays 2026.

Seasons:
- Best Oct-Mar 8-25C clear, peak Oct-Feb. Summer Mar-Jun 16-35C lush. Monsoon Jun-Sep heavy, hill roads difficult.
Sources: tripcrafters.com, tourmyindia.com, globgyan.com 2026-05-04, crave2explore.com, traveltriangle.com, ontheeve.com.

## 5. Content model (`src/data/discovery.ts`)
- `collections: { slug, title, blurb, filter: { district? | category? }, href }[]` — resolved against live seed IDs at render, hidden if empty.
- `seasons: { name, months, temp, note, tone }[]`.
- `festivals: { name, pattern, venues, sourceUrl, sourceLabel, verifyNote }[]`.
- Every block renders its `sourceLabel`. No prices, no availability, no invented coordinates.

## 6. Honesty guards & errors
- Search empty → link `/places`, never invent.
- Festival dates = annual pattern + verify-current-edition note + official link.
- Monsoon shows road caution, no safety certification.
- Empty collection hides, never guesses.
- Existing disclaimers preserved onward flows.

## 7. Testing
- `npm run build` clean; Home remains server-rendered.
- Unit: all collection IDs exist in seed; festivals carry sourceUrl.
- Visual: 375/768/1024/1440px, keyboard, 4.5:1 contrast, reduced-motion respected.
- Existing lib tests (7) stay green. No new API surface.

## 8. Non-goals
No map, no lightbox, no CMS, no PostGIS, no bookings/payments, no new auth, no turn-by-turn routing.

## Spec self-review
- Placeholders: none — all content shapes concrete, IDs validated at render.
- Consistency: static content never claims live status; architecture matches components; no new backend assumed anywhere.
- Scope: single Home slice, no cross-page rewrites, fits one implementation plan.
- Ambiguity: festival dates explicitly patterns + verify note; seasons explicitly ranges; collections explicitly filter-derived.
