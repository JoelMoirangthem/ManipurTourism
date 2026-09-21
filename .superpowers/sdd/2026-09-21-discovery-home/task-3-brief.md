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

