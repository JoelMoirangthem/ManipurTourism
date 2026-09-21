# Task 4 Review: Trip widget + honest offers on Home

Verdict: **PASS** — all binding constraints satisfied, build clean.

## Binding checklist

- [x] **TABS exact**: `[{Stays/Stay},{Culture/Heritage},{Treks/Trek}]` — `TripWidget.tsx:7-11` matches brief verbatim.
- [x] **DISTRICTS exact**: `["", "Bishnupur", "Imphal West", "Ukhrul", "Senapati"]` — `TripWidget.tsx:12` matches; `""` renders as "Anywhere in Manipur" (`TripWidget.tsx:56-60`).
- [x] **Stepper clamp 1–50 with aria labels**: `Math.max(1, n-1)` / `Math.min(50, n+1)` with `disabled` at bounds (`TripWidget.tsx:87-106`); buttons labelled "Fewer travellers" / "More travellers"; count has `aria-live="polite"`.
- [x] **Labelled date inputs**: plain `type="date"` inside visible `<label>`s "Check-in" / "Check-out" (`TripWidget.tsx:63-81`), not placeholder-only. Bonus `min={checkIn}` on check-out is a safe improvement.
- [x] **writeTripContext + tripToPlacesParams + router.push flow**: `onSubmit` calls `writeTripContext({...interests: [TABS[tab].category]})` then `router.push(tripToPlacesParams(...))` (`TripWidget.tsx:24-28`) — exact shape from brief.
- [x] **Festivals anchor id**: `<section id="festivals">` present (`page.tsx:192`).
- [x] **Ask Mit links with encodeURIComponent**: `href={`/?assistant=open&ask=${encodeURIComponent(`Tell me about ${f.name}`)}`}` with "Ask Mit →" label (`page.tsx:202-207`).
- [x] **Collections/seasons untouched**: `COLLECTIONS` (`page.tsx:144`) and `SEASONS` (`page.tsx:181`) sections intact, still driven by discovery data.
- [x] **Hero form replaced**: no `<form action="/places">` remains; `<TripWidget />` mounted in hero (`page.tsx:92`) with honest caption "Dates and travellers are context only — never live availability." (`page.tsx:93-95`).
- [x] **No `href="/assistant"` left**: `Select-String` for `href="/assistant"` returns zero hits in `page.tsx` + `TripWidget.tsx`.
- [x] **Build clean**: `npm run build` in `apps/web` → "Compiled successfully", 22/22 static pages generated.

## Report accuracy

Report claims build success, `travellers` grep hit, zero legacy assistant links — all confirmed. Two disclosed deviations assessed:
1. Dropped `primaryButtonClass` import (brief sketch) — **justified**: submit is gold per spec; importing it would be an unused import / lint failure. Correct call.
2. `travellers` string lives in `page.tsx` caption rather than widget markup — **acceptable**: widget correctly lives in `TripWidget.tsx`; caption simultaneously satisfies the brief's grep check and adds the required honesty wording.

## Quality notes

- Accessibility is strong: `tablist` + `aria-selected`, labelled select/dates, stepper group with `aria-labelledby` + `aria-live`.
- No issues with offers honesty: festival cards keep source link + "Verify current edition before travel." alongside the Ask Mit link.
- No findings requiring rework. No follow-ups.
