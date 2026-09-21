"""Verify NearbyMap on the dedicated /nearby page (already-running dev server).

Run:  python scripts/verify-nearby-map.py  (with `npm run dev` already up on :3000)
"""
import json
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("outputs")
OUT.mkdir(exist_ok=True)

# 1. API: 30 km around Imphal must put the fixed city coords first
data = None
last_err = None
for attempt in range(6):
    try:
        with urllib.request.urlopen(
            f"{BASE}/api/places?near=24.8107,93.9386&radius_km=30", timeout=20
        ) as r:
            data = json.loads(r.read().decode("utf-8"))
        break
    except Exception as e:  # noqa: BLE001 — dev may still be compiling once
        last_err = e
        print(f"API attempt {attempt + 1}/6: {type(e).__name__}, retrying…", flush=True)
        time.sleep(5)
assert data is not None, f"API never responded: {last_err}"
results = data.get("results", [])
print(f"API nearby count (30km of Imphal): {len(results)}", flush=True)
assert len(results) == 2, f"expected Kangla + Ima Keithel within 30 km, got {len(results)}"
assert "Kangla" in results[0]["name"], f"closest must be Kangla Fort, got {results[0]['name']}"
assert results[0]["distanceKm"] < 5, "Kangla must be within 5 km of Imphal centre"
for res in results:
    assert res.get("lat") is not None and res.get("lng") is not None, "pins need lat/lng"
    assert res.get("id") and res.get("name"), "each result needs id+name for deep links"
print(f"Closest: {results[0]['name']} {results[0]['distanceKm']}km", flush=True)

# 2. /nearby page: map + auto nearby list with deep links.
# domcontentloaded + selector waits: Google Maps polling may never reach networkidle.
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        geolocation={"latitude": 24.8107, "longitude": 93.9386},
        permissions=["geolocation"],
    )
    page = ctx.new_page()
    page.goto(f"{BASE}/nearby", wait_until="domcontentloaded")
    page.wait_for_selector('section[aria-label="Nearby tourist places map"]', timeout=30000)
    print("NearbyMap section rendered on /nearby", flush=True)
    assert page.locator('div[aria-label="Map showing your location and nearby tourist places"]').count() == 1
    page.wait_for_selector(
        'section[aria-label="Nearby tourist places map"] a[href^="/places/"]', timeout=30000
    )
    links = page.locator('section[aria-label="Nearby tourist places map"] a[href^="/places/"]')
    n = links.count()
    print(f"Nearby deep links: {n}", flush=True)
    assert n >= 2, "expected clickable nearby cards linking to /places/[id]"
    pills = page.locator('div[role="group"][aria-label="Search radius"] button')
    labels = [pills.nth(i).inner_text() for i in range(pills.count())]
    print(f"Radius pills: {labels}", flush=True)
    assert labels == ["5 km", "10 km", "15 km", "25 km", "30 km"], f"unexpected pills: {labels}"
    href = links.first.get_attribute("href")
    print(f"First nearby link: {href}", flush=True)

    # 3. Radius actually refetches: shrink to 5 km, list must stay correct
    page.get_by_role("button", name="5 km", exact=True).click()
    page.wait_for_timeout(2500)
    status = page.locator('section[aria-label="Nearby tourist places map"]').inner_text()
    assert "within 5 km" in status, f"radius change did not refetch: {status[:200]}"
    print("Radius 5 km refetch OK", flush=True)

    # 4. Click through to the special page
    links.first.click()
    page.wait_for_url("**/places/*", timeout=15000)
    page.wait_for_selector("main h1", timeout=30000)
    print(f"After click URL: {page.url}", flush=True)
    assert "/places/" in page.url, "click must open our place page"
    page.screenshot(path=str(OUT / "nearby-map-verify.png"))
    print(f"Screenshot: {OUT / 'nearby-map-verify.png'}", flush=True)
    browser.close()
    print("VERIFY OK", flush=True)
