### Task 4: Trip widget + honest offers on Home


**Files:**
- Modify: `apps/web/src/app/page.tsx` (hero search form → widget, offers strip with Ask Mit links, `id="festivals"` anchor on festivals section)
- Create: `apps/web/src/components/TripWidget.tsx` (client island: tabs, district select, dates, travellers stepper, writes trip context, navigates via `tripToPlacesParams`)

**Interfaces:**
- Consumes: `writeTripContext`, `tripToPlacesParams` (Task 1); `COLLECTIONS`, `FESTIVALS` (existing discovery data).
- Produces: widget navigating to `/places?district=…&checkIn=…&checkOut=…`; offer links `/?assistant=open&ask=…`.

- [ ] **Step 1: Write the failing check**

Run: `grep -q "travellers" src/app/page.tsx && echo "WIDGET" || echo "MISSING widget"`
Expected: `MISSING widget`

- [ ] **Step 2: Implement widget + offers**

`TripWidget.tsx` (client, exact behavior):

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tripToPlacesParams, writeTripContext } from "@/lib/tripContext";
import { inputClass, primaryButtonClass } from "@/components/ui";

const TABS = [
  { label: "Stays", category: "Stay" },
  { label: "Culture", category: "Heritage" },
  { label: "Treks", category: "Trek" },
];
const DISTRICTS = ["", "Bishnupur", "Imphal West", "Ukhrul", "Senapati"];

export function TripWidget() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travellers, setTravellers] = useState(2);
  return (
    <form
      className="rounded-[20px] border border-[#0B3D2E]/10 bg-white p-4 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        writeTripContext({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] });
        router.push(tripToPlacesParams({ destination, checkIn, checkOut, travellers, interests: [TABS[tab].category] }));
      }}
    >
      {/* tabs, destination select (DISTRICTS, "Anywhere in Manipur" for ""), date inputs, stepper (1–50, minus/plus buttons aria-labelled), gold Search submit */}
    </form>
  );
}
```

Stepper buttons clamp 1–50; date inputs are plain `type="date"` with visible labels (not placeholder-only). In `page.tsx`: replace the hero `<form action="/places">` with `<TripWidget />`; add `id="festivals"` to the festivals `<section>`; each festival card gets an "Ask Mit →" link to `/?assistant=open&ask=${encodeURIComponent(`Tell me about ${f.name}`)}`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: compiled successfully

Run: `grep -q "travellers" src/app/page.tsx && echo "WIDGET"`
Expected: `WIDGET`

