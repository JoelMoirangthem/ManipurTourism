"""Full-page captures for UI audit (dev server must be running)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = Path("outputs/audit")
OUT.mkdir(parents=True, exist_ok=True)
PAGES = [("/", "home"), ("/places", "places"), ("/nearby", "nearby"),
         ("/places/kangla-fort", "detail"), ("/plan", "plan")]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        geolocation={"latitude": 24.8107, "longitude": 93.9386},
        permissions=["geolocation"],
        viewport={"width": 1280, "height": 800},
    )
    for slug, name in PAGES:
        page = ctx.new_page()
        page.goto(f"{BASE}{slug}", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        page.screenshot(path=str(OUT / f"{name}-desktop.png"), full_page=True)
        print(f"saved {name}", flush=True)
        page.close()
    # mobile pass for the two map/list pages
    mctx = browser.new_context(
        geolocation={"latitude": 24.8107, "longitude": 93.9386},
        permissions=["geolocation"],
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
    )
    for slug, name in [("/nearby", "nearby"), ("/places", "places")]:
        page = mctx.new_page()
        page.goto(f"{BASE}{slug}", wait_until="domcontentloaded")
        page.wait_for_timeout(3500)
        page.screenshot(path=str(OUT / f"{name}-mobile.png"), full_page=True)
        print(f"saved {name}-mobile", flush=True)
        page.close()
    browser.close()
    print("OK", flush=True)
