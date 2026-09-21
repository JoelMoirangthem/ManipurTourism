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

