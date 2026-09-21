### Task 3: Journey nav + header wishlist count


**Files:**
- Modify: `apps/web/src/app/layout.tsx:16-25` (NAV array), nav render `47-55` (More menu), header (wishlist count pill)

**Interfaces:**
- Consumes: `readWishlist` from Task 1.
- Produces: nav links Destinations `/places`, Stays `/places?category=Stay`, Experiences `/places?category=Heritage`, Festivals `/#festivals`, My threads `/threads`, Contribute `/upload`, More menu (Inquire `/inquire`, Inbox `/inbox`, Review `/review`).

- [ ] **Step 1: Write the failing check**

Run: `grep -q "Destinations" src/app/layout.tsx && echo "JOURNEY NAV" || echo "MISSING journey nav"`
Expected: `MISSING journey nav`

- [ ] **Step 2: Implement nav + wishlist count**

```tsx
const NAV = [
  { href: "/places", label: "Destinations" },
  { href: "/places?category=Stay", label: "Stays" },
  { href: "/places?category=Heritage", label: "Experiences" },
  { href: "/#festivals", label: "Festivals" },
  { href: "/threads", label: "My threads" },
  { href: "/upload", label: "Contribute" },
];
const MORE_NAV = [
  { href: "/inquire", label: "Inquire" },
  { href: "/inbox", label: "Inbox" },
  { href: "/review", label: "Review" },
];
```

Render MORE_NAV inside a `<details className="relative">` dropdown after NAV links. Wishlist count: new `"use client"` island `src/components/WishlistCount.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { readWishlist } from "@/lib/wishlist";
export function WishlistCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(readWishlist().length);
    const onStorage = () => setCount(readWishlist().length);
    window.addEventListener("storage", onStorage);
    const timer = setInterval(() => setCount(readWishlist().length), 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);
  if (count === 0) return null;
  return (
    <Link href="/places" aria-label={`${count} saved places`} className="rounded-full border border-[#C19A4B]/50 bg-[#FBF6E9] px-3 py-1.5 text-xs font-semibold text-[#7a5f22]" title="Saved places (this browser only)">
      ♥ {count} saved
    </Link>
  );
}
```

Mount `<WishlistCount />` in the header before `<ActorSwitcher />`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "Destinations" src/app/layout.tsx && echo "JOURNEY NAV"`
Expected: `JOURNEY NAV`

