"""Capture home, /places, /nearby for placement review (dev server must be running)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
Path("outputs").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        geolocation={"latitude": 24.8107, "longitude": 93.9386},
        permissions=["geolocation"],
    )
    for slug, name in [("/", "home"), ("/places", "places"), ("/nearby", "nearby")]:
        page = ctx.new_page()
        page.goto(f"{BASE}{slug}", wait_until="domcontentloaded")
        page.wait_for_timeout(3500)
        page.screenshot(path=f"outputs/review-{name}.png")
        has_map = page.locator('section[aria-label="Nearby tourist places map"]').count()
        print(f"{slug}: map_section={has_map}", flush=True)
        page.close()
    browser.close()
    print("OK", flush=True)
