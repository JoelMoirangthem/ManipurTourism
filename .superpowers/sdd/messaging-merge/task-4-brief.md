# Task 4 brief — Redirects + nav + inquire links
(Source: plan Task 4. Read this first — it is your requirements.)

## Files (modify only these 5)
1. `D:\ManipuriTourism\apps\web\src\app\threads\page.tsx` → replace ENTIRE contents with:

```tsx
import { redirect } from "next/navigation";
// S1 merge: threads live at /messages now. Stub kept so old links 307.
export default function ThreadsRedirect() {
  redirect("/messages");
}
```

2. `D:\ManipuriTourism\apps\web\src\app\inbox\page.tsx` → replace ENTIRE contents with:

```tsx
import { redirect } from "next/navigation";
// S1 merge: the inbox live at /messages now. Stub kept so old links 307.
export default function InboxRedirect() {
  redirect("/messages");
}
```

3. `D:\ManipuriTourism\apps\web\src\app\inquiries\[id]\page.tsx` → replace ENTIRE contents with:

```tsx
import { redirect } from "next/navigation";
// S1 merge: thread view lives at /messages/[id] now.
export default async function InquiryRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/messages/${id}`);
}
```

4. `D:\ManipuriTourism\apps\web\src\app\layout.tsx` → nav entry
   `{ href: "/threads", label: "My threads" }` becomes
   `{ href: "/messages", label: "Messages" }`. Nothing else.
5. `D:\ManipuriTourism\apps\web\src\app\inquire\page.tsx` → find the sent-success
   block rendering a link to `` `/inquiries/${sentId}` `` and change it to
   `` `/messages/${sentId}` ``. Keep all surrounding copy. If the success block
   links elsewhere too, change only the thread link.
- Workdir: `D:\ManipuriTourism\apps\web`

## Context
Tasks 1–3 done and reviewed: `/messages` list and `/messages/[id]` detail exist.
This task retires the old routes. Backend untouched.

## Steps
- [ ] Steps 1–3: Apply the three stub replacements exactly as above.
- [ ] Step 4: Nav entry edit in layout.tsx.
- [ ] Step 5: inquire success-link edit.
- [ ] Step 6: `npx tsc --noEmit 2>&1 | Select-String -Pattern "^src/"` → no output;
  `npx eslint src/app/threads/page.tsx src/app/inbox/page.tsx "src/app/inquiries/[id]/page.tsx" src/app/layout.tsx src/app/inquire/page.tsx` → 0 errors
  (if `inquire/page.tsx` shows pre-existing errors on lines you did not touch, report
  them as concerns with file:line instead of fixing — do NOT refactor beyond the link).
- [ ] Step 7: SKIP commits (no git repo).

## Interfaces
- Produces: old URLs 307 to new routes; nav + inquire point at `/messages*`.
