# Manipur Tourism Mit — Production Architecture (v2)
Date: 2026-09-21 · Status: proposed (awaiting review)
Approvals: merge to 8 pages · rename provider→authority, reviewer→admin · expand catalogue 8→~28

## 1. Product thesis (what must never break)
Trust-first trip planning, never a booking site. Every visitor-facing fact carries
(sourceTitle, sourceUrl, observedAt, reviewState); freshness ⊥ review; capacity ≠
availability; planner is deterministic; assistant degrades to templates. Two content
tiers, never mixed: Tier 1 verified catalogue (our voice, sourced) / Tier 2 labelled
live-external (Google Places layer, weather, model output).

## 2. Roles
| Role | Identity | Surfaces | Cannot |
|---|---|---|---|
| visitor | anonymous or logged-in | landing, places, nearby, place detail (+Navigate), inquire, own messages, wishlist, draft plan | reply as host, moderate, publish |
| authority (ex-provider) | logged-in, assigned listings | visitor surfaces + Authority dashboard: reply with expiry-scoped availability, post notices (enter claims pipeline as pending_review, never direct-publish) | moderate others, publish catalogue |
| admin (ex-reviewer) | logged-in, staff | all + Admin console tabs: Moderation, Catalogue publishing, Users & roles, Content pages | — (all destructive actions need confirm/undo + audit trail) |

Implementation: rename Role union + KNOWN actors + ActorSwitcher labels (`visitor-demo`,
`authority-demo`, `admin-demo`); `requireRole`/`resolveActor` seams unchanged.
GATE: real session auth (Phase C1) replaces the self-asserted cookie BEFORE authority/
admin powers activate in production. Until then dashboards run on demo actors with the
existing "not authentication" labelling.

## 3. Information architecture (8 pages + dashboards)
Keep: `/` `/places` `/places/[id]` `/nearby` `/inquire` `/upload`.
Merge: `/threads` + `/inbox` + `/inquiries/[id]` → `/messages` (role-aware list) +
  `/messages/[id]` (detail). Old paths 308-redirect. API unchanged (scope-enforced).
Fold: `/plan` redirect → draft-plan flow reachable from `/places` + place pages
  ("Add to draft"); keep `/api/plan` + deterministic builder untouched.
Demote: `/review` → Admin console → Moderation tab (same component, new shell).
New: `/dashboard/authority` (replies, notices, listings), `/dashboard/admin` (tabs).
Nav (visitor): Destinations · Near me · Stays · Experiences · Festivals · My threads→Messages · Contribute.
Nav additions by role: authority sees Dashboard; admin sees Admin console.

## 4. Landing hero as router
One memorable moment + 3 intent cards: Explore places → `/places`; What's near me →
`/nearby`; Draft a plan → plan flow. Live strip: next festival (from FESTIVALS data),
season note (from SEASONS). Forward-link rule: every page ends in an action —
place → inquire/navigate/plan; nearby → place; message → place; reply → expiry shown.

## 5. Catalogue expansion 8 → ~28
Source pattern: manipurtourism.gov.in pages (official board), new claims ship
`reviewState: pending_review`, coords `seed-approx-WGS84-unverified` with lat/lng
estimated from district knowledge until cross-checked.
New: Govindajee Temple, Shaheed Minar, Mutua Museum, Bijoy Govindaji (Heritage Imphal);
Red Hill + India Peace Memorial, Khongjom War Memorial, Imphal War Cemetery (NEW
collection: War memory trail); Andro/Panam Ningthou, Kaina Temple, Gopinath Temple
(NEW: Faith & craft); Khangkhui Lime Caves, Tharon Cave, Sadu Chiru Waterfall, Barak
Waterfalls, Zeilad Lake (NEW: Caves & waterfalls); Khonghampat Orchidarium, Kakching
Garden, Marjing Polo Complex, Santhei Park, Takmu Water Sports (NEW: Gardens & family).
Discovery collections grow 3 → 6; photos reuse CC Wikimedia pattern with attribution
records (no hotlinking without license row).

## 6. UX discipline (from strict audit)
Stretched-link cover cards (button never inside link); pluralized counts; friendly
provenance copy (no raw coord tokens); map loading state via tilesloaded + timeout;
mobile nav horizontal scroll; skeleton/empty states on all async surfaces; URL-synced
`/places` filters; aria-live status regions; focus-visible everywhere; reduced-motion
respected. Google Places remains a labelled layer on `/nearby` only.

## 7. Security notes
Key handling: NEXT_PUBLIC map key stays referrer-restricted; Routes/Places server
calls (if added) go through a proxy, never the browser. Role rename keeps
server-side enforcement (`requireRole`); cookie shim stays dev-labelled. Uploads keep
quarantine + moderation gate. No PII in logs.

## 8. Build slices (each independently shippable + verified)
S1 Messaging merge (`/messages`, redirects, nav relabel).
S2 Role rename (actor model, switcher, copy) + dashboard shells behind demo actors.
S3 Catalogue +28 (seed JSON, collections, photos/attribution) + nearby radius sanity.
S4 Hero router + forward-link pass + audit fixes.
S5 Real auth (C1) — gates production activation of S2 powers.

## 9. Open risks
- ~20 new coords start unverified: nearby ordering near Imphal stays approximate until cross-check pass.
- Photo licensing for 20 new places: each needs a verified CC row or a "no photo on record" state.
- Real auth is the critical path for anything authority/admin; S1–S4 deliver visitor value without it.
