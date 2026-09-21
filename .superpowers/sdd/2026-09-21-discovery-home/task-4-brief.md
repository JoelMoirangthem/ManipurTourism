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
