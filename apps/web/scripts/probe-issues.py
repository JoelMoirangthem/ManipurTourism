"""Probe console errors + identify the '1 Issue' badge (dev server must be running)."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    msgs = []
    page.on("console", lambda m: msgs.append(f"{m.type}: {m.text[:200]}"))
    page.on("pageerror", lambda e: msgs.append(f"PAGEERROR: {str(e)[:200]}"))
    page.goto(f"{BASE}/places", wait_until="domcontentloaded")
    page.wait_for_timeout(5000)
    # find the badge element
    els = page.locator("text=1 Issue")
    print("badge count:", els.count(), flush=True)
    if els.count():
        el = els.first
        print("tag:", el.evaluate("e => e.tagName + ' / ' + e.className"), flush=True)
        print("outer:", el.evaluate("e => e.parentElement.outerHTML.slice(0,600)"), flush=True)
    print("--- console ---", flush=True)
    for m in msgs[:30]:
        print(m, flush=True)
    browser.close()
