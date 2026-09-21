"""Check the Navigate handoff on a place page (dev server must be running)."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"{BASE}/places/kangla-fort", wait_until="domcontentloaded")
    page.wait_for_selector("main h1", timeout=30000)
    nav = page.get_by_role("link", name="Navigate →")
    assert nav.count() == 1, "Navigate button missing"
    href = nav.get_attribute("href")
    target = nav.get_attribute("target")
    print(f"Navigate href: {href} target={target}", flush=True)
    assert href == "https://www.google.com/maps/dir/?api=1&destination=24.807,93.938&travelmode=driving"
    assert target == "_blank"
    browser.close()
    print("NAVIGATE OK", flush=True)
