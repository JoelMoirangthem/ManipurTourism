// Actor switcher — makes the identity boundary visible instead of hidden.
//
// Because roles are self-asserted in the demo, the UI must say so. A visitor
// always knows whether they are browsing, replying as a host, or moderating,
// and that this is not authentication.

"use client";

import { useEffect, useState } from "react";

const ROLES = [
  { id: "visitor-demo", label: "Visitor" },
  { id: "provider-demo", label: "Provider" },
  { id: "reviewer-demo", label: "Reviewer" },
];

export const ACTOR_COOKIE = "mt_actor";

export function readActorCookieClient(): string {
  if (typeof document === "undefined") return "visitor-demo";
  const m = document.cookie.match(/(?:^|;\s*)mt_actor=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "visitor-demo";
}

export function ActorSwitcher() {
  const [role, setRole] = useState("visitor-demo");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRole(readActorCookieClient());
    setReady(true);
  }, []);

  function choose(id: string) {
    setRole(id);
    document.cookie = `${ACTOR_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=86400; samesite=lax`;
    // Surfaces read the cookie server-side, so a reload is the honest way to
    // apply the change rather than pretending state propagated.
    window.location.reload();
  }

  if (!ready) return <div className="h-7 w-[190px]" />;

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#0B3D2E]/15 bg-white py-1 pr-1 pl-3 shadow-sm">
      <span className="text-[11px] font-medium tracking-wide text-[#5D746B] uppercase">Acting as</span>
      <select
        value={role}
        onChange={(e) => choose(e.target.value)}
        aria-label="Acting role (demo, self-asserted — not authentication)"
        className="cursor-pointer rounded-full bg-[#0B3D2E] px-3 py-1.5 text-xs font-semibold text-white outline-none"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id} className="bg-white text-[#1A2E28]">
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
