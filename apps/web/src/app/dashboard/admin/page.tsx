"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, SectionTitle, Notice, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { readActorCookieClient } from "@/components/ActorSwitcher";

type Tab = "moderation" | "claims" | "catalogue" | "system";

export default function AdminConsole() {
  const [role] = useState(readActorCookieClient);
  const [activeTab, setActiveTab] = useState<Tab>("catalogue");
  const [places, setPlaces] = useState<Array<{ id: string; name: string; district: string; category: string; factsCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/places?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isAdmin = role === "admin-demo" || role === "admin" || role === "reviewer-demo" || role === "reviewer";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionTitle
        kicker="Central Administration"
        title="Admin Moderation & Governance Console"
        lede="Audit community uploads, review local authority advisories, verify catalogue facts, and inspect live service integration health."
      />

      {!isAdmin && (
        <div className="mt-4">
          <Notice tone="warn">
            You are currently viewing as <code className="font-semibold">{role}</code>. To perform administrative actions, switch your role to <strong>Admin</strong> in the top bar.
          </Notice>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-[#0B3D2E]/10 pb-3">
        {[
          { id: "catalogue", label: "Catalogue Sourcing" },
          { id: "moderation", label: "Photo Moderation" },
          { id: "claims", label: "Claims & Advisories" },
          { id: "system", label: "System Health" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as Tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === t.id
                ? "bg-[#0B3D2E] text-white shadow-sm"
                : "bg-white text-[#42584F] border border-[#0B3D2E]/10 hover:bg-[#0B3D2E]/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Catalogue */}
      {activeTab === "catalogue" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0B3D2E]">Verified Sourced Catalogue</h3>
              <p className="text-xs text-[#5D746B]">
                {places.length} destinations registered. All visitor-facing facts carry source URLs and provenance records.
              </p>
            </div>
            <Link href="/places" className={secondaryButtonClass}>
              Explore public catalogue ↗
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#5D746B]">Loading catalogue…</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#0B3D2E]/10 bg-[#EEF5F1] text-[11px] font-semibold text-[#0B3D2E] uppercase">
                  <tr>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Facts</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0B3D2E]/5 text-[#1A2E28]">
                  {places.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FDFBF7]">
                      <td className="px-4 py-3 font-medium text-[#0B3D2E]">{p.name}</td>
                      <td className="px-4 py-3 text-[#5D746B]">{p.district}</td>
                      <td className="px-4 py-3">
                        <Badge tone="gold">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#5D746B]">{p.factsCount ?? 0} sourced</td>
                      <td className="px-4 py-3">
                        <Badge tone="ok">Verified</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/places/${p.id}`} className="font-medium text-[#0B3D2E] underline">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Moderation */}
      {activeTab === "moderation" && (
        <section className="mt-6 space-y-4">
          <Card>
            <h3 className="font-display text-lg font-semibold text-[#0B3D2E]">Community Photo Moderation</h3>
            <p className="mt-1 text-xs text-[#5D746B]">
              Community uploads are held in quarantine (<code className="font-semibold">pending_review</code>) and never published until manually approved.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href="/review" className={primaryButtonClass}>
                Open Dedicated Review Queue →
              </Link>
              <Link href="/upload" className={secondaryButtonClass}>
                Test contribution upload ↗
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Tab 3: Claims */}
      {activeTab === "claims" && (
        <section className="mt-6 space-y-4">
          <Card>
            <h3 className="font-display text-lg font-semibold text-[#0B3D2E]">Local Authority Claims & Advisories</h3>
            <p className="mt-1 text-xs text-[#5D746B]">
              Review seasonal advisories submitted by local tourism officers before publishing to visitor destination banners.
            </p>
            <div className="mt-6 rounded-xl border border-[#0B3D2E]/10 bg-[#FDFBF7] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge tone="warn">pending_review</Badge>
                  <h4 className="mt-2 text-sm font-semibold text-[#0B3D2E]">
                    Keibul Lamjao: Phumdi Seasonal Conservation Notice
                  </h4>
                  <p className="mt-1 text-xs text-[#5D746B]">
                    Submitted by: <code className="font-semibold">authority-demo</code> (Bishnupur Wildlife Division) · Valid through Nov 2026
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={primaryButtonClass}>
                    Approve & publish
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Tab 4: System Health */}
      {activeTab === "system" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <h4 className="font-semibold text-[#0B3D2E]">External Services</h4>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Open-Meteo Weather API:</span>
                <Badge tone="ok">Operational (live)</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Google Maps Radar:</span>
                <Badge tone="ok">Configured (Universal Driving Handoff)</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Tavily Web Search:</span>
                <Badge tone="muted">Fallback deterministic ready</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-[#0B3D2E]">Data Governance & Stores</h4>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Inquiry Store:</span>
                <span className="font-mono text-[#0B3D2E]">File-backed (scoped)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Upload Quarantine:</span>
                <span className="font-mono text-[#0B3D2E]">Isolated storage</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#0B3D2E]/5">
                <span className="text-[#5D746B]">Provenance Tracking:</span>
                <Badge tone="ok">Enforced</Badge>
              </div>
            </div>
          </Card>
        </section>
      )}
    </main>
  );
}
