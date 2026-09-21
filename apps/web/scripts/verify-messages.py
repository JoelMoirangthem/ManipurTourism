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
        page.wait_for_selector(f"main h1:has-text('{heading}')", timeout=15000)
        print(f"{actor} {slug}: OK", flush=True)
        page.close()
        ctx.close()

    # redirects check
    ctx = browser.new_context()
    for old, new in [("/threads", "/messages"), ("/inbox", "/messages")]:
        page = ctx.new_page()
        page.goto(f"{BASE}{old}", wait_until="domcontentloaded")
        page.wait_for_url(f"**{new}", timeout=15000)
        print(f"{old} -> {new}: OK", flush=True)
        page.close()

    browser.close()
    print("VERIFY OK", flush=True)
