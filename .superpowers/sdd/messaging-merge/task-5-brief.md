# Task 5 brief — End-to-end verification (all roles)
(Source: plan Task 5. Read this first — it is your requirements.)

## Files
- Create: `D:\ManipuriTourism\apps\web\scripts\verify-messages.py`
- Workdir: `D:\ManipuriTourism\apps\web`
- Dev server already on :3000 — reuse it, never start another. If it is down,
  report BLOCKED (do not start servers yourself).

## Steps
- [ ] Step 1: Write `scripts/verify-messages.py` exactly as below (Python Playwright,
  sync API; chromium headless — browsers already installed):

```python
"""S1 verification: old URLs redirect, /messages works per role."""
from playwright.sync_api import sync_playwright
BASE = "http://localhost:3000"
CHECKS = [
    ("visitor-demo", "/messages", "My messages"),
    ("provider-demo", "/messages", "Messages for your listings"),
]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for actor, slug, heading in CHECKS:
        ctx = browser.new_context()
        ctx.add_cookies([{"name": "mt_actor", "value": actor, "url": BASE}])
        page = ctx.new_page()
        page.goto(f"{BASE}{slug}", wait_until="domcontentloaded")
        page.wait_for_selector("main h1", timeout=30000)
        assert heading in page.content(), f"{actor}: missing heading"
        print(f"{actor} {slug}: OK", flush=True)
        page.close(); ctx.close()
    ctx = browser.new_context()
    for old, new in [("/threads", "/messages"), ("/inbox", "/messages")]:
        page = ctx.new_page()
        page.goto(f"{BASE}{old}", wait_until="domcontentloaded")
        page.wait_for_url(f"**{new}", timeout=15000)
        print(f"{old} -> {new}: OK", flush=True)
        page.close()
    browser.close()
    print("VERIFY OK", flush=True)
```

- [ ] Step 2: Run the full verification battery (workdir `D:\ManipuriTourism\apps\web`):
  1. `node --test scripts/messages.test.mjs` → PASS.
  2. `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/"` → no output (ignore
     `.next/dev/types/routes.d.ts` generated-file lines if present — pre-existing).
  3. `npx eslint src/lib/messages.ts src/components/ReplyForm.tsx src/app/messages/page.tsx "src/app/messages/[id]/page.tsx" src/app/threads/page.tsx src/app/inbox/page.tsx "src/app/inquiries/[id]/page.tsx" src/app/layout.tsx src/app/inquire/page.tsx` → 0 errors on touched lines (pre-existing errors on untouched lines report as concerns with file:line, do not fix).
  4. `python scripts/verify-messages.py` → 4 OK + VERIFY OK.
- [ ] Step 3: SKIP commits (no git repo).

## Interfaces
- Produces: green verification record for S1.
