"""One-shot screenshot of /nearby map view (dev server must be running)."""
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
    page = ctx.new_page()
    page.goto(f"{BASE}/nearby", wait_until="domcontentloaded")
    page.wait_for_selector('section[aria-label="Nearby tourist places map"]', timeout=30000)
    page.wait_for_selector(
        'section[aria-label="Nearby tourist places map"] a[href^="/places/"]', timeout=30000
    )
    page.wait_for_timeout(4000)  # let map tiles + markers settle
    page.screenshot(path="outputs/nearby-page.png")
    print("saved outputs/nearby-page.png")
    browser.close()
