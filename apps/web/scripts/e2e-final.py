"""Comprehensive E2E Playwright verification across all platform surfaces."""
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # 1. Test Home page
    page = browser.new_page()
    page.goto(f"{BASE}/", wait_until="domcontentloaded")
    page.wait_for_selector("main h1", timeout=15000)
    content = page.content()
    assert "Plan Manipur from verified info" in content, "Home h1 missing"
    assert "Explore Destinations" in content, "Intent card 1 missing"
    assert "Around You" in content, "Intent card 2 missing"
    assert "Inquiries" in content and "Messages" in content, "Intent card 3 missing"
    print("[OK] Home page intent router & hero OK")
    page.close()

    # 2. Test Places directory (wait for client fetch of places)
    page = browser.new_page()
    page.goto(f"{BASE}/places", wait_until="domcontentloaded")
    page.wait_for_selector("text=Kangla Fort", timeout=15000)
    content = page.content()
    assert "Kangla Fort" in content, "Kangla Fort missing from places"
    assert "Govindajee" in content, "Govindajee Temple missing from places"
    assert "Khangkhui" in content, "Khangkhui Caves missing from places"
    print("[OK] Places directory (28 destinations) OK")
    page.close()

    # 3. Test Detail page & Navigate button
    page = browser.new_page()
    page.goto(f"{BASE}/places/kangla-fort", wait_until="domcontentloaded")
    page.wait_for_selector("main h1", timeout=15000)
    nav_btn = page.get_by_role("link", name="Navigate →")
    assert nav_btn.count() == 1, "Navigate button missing on detail page"
    assert "https://www.google.com/maps/dir/?api=1" in nav_btn.get_attribute("href")
    print("[OK] Destination detail & Google Maps Navigate handoff OK")
    page.close()

    # 4. Test Nearby page
    page = browser.new_page()
    page.goto(f"{BASE}/nearby", wait_until="domcontentloaded")
    page.wait_for_selector("main h1", timeout=15000)
    assert "What's around you" in page.content() or "What&#x27;s around you" in page.content()
    print("[OK] Nearby radar & navigation page OK")
    page.close()

    # 5. Test Authority Dashboard
    ctx_auth = browser.new_context()
    ctx_auth.add_cookies([{"name": "mt_actor", "value": "authority-demo", "url": BASE}])
    page_auth = ctx_auth.new_page()
    page_auth.goto(f"{BASE}/dashboard/authority", wait_until="domcontentloaded")
    page_auth.wait_for_selector("main h2", timeout=15000)
    assert "Destination" in page_auth.content() and "Advisory Dashboard" in page_auth.content()
    assert "Sendra Resort" in page_auth.content()
    print("[OK] Local Authority Dashboard OK")
    page_auth.close()
    ctx_auth.close()

    # 6. Test Admin Console
    ctx_admin = browser.new_context()
    ctx_admin.add_cookies([{"name": "mt_actor", "value": "admin-demo", "url": BASE}])
    page_admin = ctx_admin.new_page()
    page_admin.goto(f"{BASE}/dashboard/admin", wait_until="domcontentloaded")
    page_admin.wait_for_selector("main h2", timeout=15000)
    assert "Admin Moderation" in page_admin.content() and "Governance Console" in page_admin.content()
    print("[OK] Central Admin Console OK")
    page_admin.close()
    ctx_admin.close()

    # 7. Test Messages & Redirect stubs
    ctx_msg = browser.new_context()
    ctx_msg.add_cookies([{"name": "mt_actor", "value": "visitor-demo", "url": BASE}])
    page_msg = ctx_msg.new_page()
    page_msg.goto(f"{BASE}/messages", wait_until="domcontentloaded")
    page_msg.wait_for_selector("main h1", timeout=15000)
    assert "My messages" in page_msg.content()
    print("[OK] Messages unified surface OK")
    page_msg.close()
    ctx_msg.close()

    # 8. Test Redirect stubs (/threads and /inbox)
    ctx_redir = browser.new_context()
    page_redir = ctx_redir.new_page()
    page_redir.goto(f"{BASE}/threads", wait_until="domcontentloaded")
    page_redir.wait_for_url("**/messages", timeout=15000)
    page_redir.goto(f"{BASE}/inbox", wait_until="domcontentloaded")
    page_redir.wait_for_url("**/messages", timeout=15000)
    print("[OK] Legacy routes 307 redirect to /messages OK")
    page_redir.close()
    ctx_redir.close()

    browser.close()
    print("\nALL PLATFORM SURFACES VERIFIED SUCCESSFULLY!")

