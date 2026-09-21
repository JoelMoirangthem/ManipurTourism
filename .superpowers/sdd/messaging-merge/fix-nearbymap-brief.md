# NearbyMap repair brief — fix JSX syntax error breaking dev compile
(Context: my own earlier edit left `src/components/NearbyMap.tsx` unparseable;
dev server 500s every route. Minimal repair, no behavior changes.)

## Files
- Modify ONLY: `D:\ManipuriTourism\apps\web\src\components\NearbyMap.tsx`
- Workdir: `D:\ManipuriTourism\apps\web`

## Steps
- [ ] Step 1: Run `npx tsc --noEmit 2>&1 | Select-String -Pattern "NearbyMap"` and read
  the file around the reported lines (stray `)}` near old line 343, mismatched divs
  in the map-container/map-loading overlay region from the "map loader" edit).
- [ ] Step 2: Fix ONLY the JSX balance errors: the intended structure is

```tsx
<div className="mt-3 grid gap-4 lg:grid-cols-5">
  <div className="lg:col-span-3">
    <div ref={mapRef} role="application" aria-label="..." className="relative h-[300px] ...">
      {mapError ? ( ...fallback... ) : (mapLoading && ( ...overlay... ))}
    </div>
    <p ...>Map locations approximate ...</p>
  </div>
  <div className="lg:col-span-2">
    {error && (...)}
    <div>status…</div>
    {!loading && ...empty...}
    <ul>...</ul>
    {selected && (...)}
  </div>
</div>
```

  Do not change behavior, copy, styling, or logic — only restore valid JSX.
- [ ] Step 3: Verify: `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/"` → no
  output; `npx eslint src/components/NearbyMap.tsx` → 0 errors; then confirm the
  dev server (already on :3000, never start another) serves
  `GET /api/places?near=24.8107,93.9386&radius_km=30` HTTP 200 (curl/Invoke-WebRequest,
  short timeout, retry up to 3 times for cold compile).
- [ ] Step 4: SKIP commits (no git repo).
