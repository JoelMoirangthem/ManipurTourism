"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, SectionTitle, Notice, primaryButtonClass, secondaryButtonClass, inputClass } from "@/components/ui";
import { readActorCookieClient } from "@/components/ActorSwitcher";

const MANAGED_LISTINGS = [
  {
    id: "sendra-resort",
    name: "Sendra Resort",
    district: "Bishnupur",
    category: "Stay",
    status: "Verified",
    lastReported: "Today",
  },
  {
    id: "loktak-lake",
    name: "Loktak Lake (Keibul Lamjao Basin)",
    district: "Bishnupur",
    category: "Nature",
    status: "Verified",
    lastReported: "Yesterday",
  },
  {
    id: "kangla-fort",
    name: "Kangla Fort & Museum",
    district: "Imphal West",
    category: "Heritage",
    status: "Verified",
    lastReported: "3 days ago",
  },
];

export default function AuthorityDashboard() {
  const [role] = useState(readActorCookieClient);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("Seasonal advisory");
  const [noticeBody, setNoticeBody] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isAuthority = role === "authority-demo" || role === "authority" || role === "provider-demo" || role === "provider";

  function handleNoticeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    setSubmitted(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionTitle
        kicker="Local Authority Operations"
        title="Destination & Advisory Dashboard"
        lede="Oversee your accredited destinations, reply to traveler inquiries with honest availability, and submit verified local notices."
      />

      {!isAuthority && (
        <div className="mt-4">
          <Notice tone="warn">
            You are currently viewing as <code className="font-semibold">{role}</code>. To exercise authority operations, switch your role to <strong>Local Authority</strong> in the top bar.
          </Notice>
        </div>
      )}

      {/* Overview stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5D746B]">Managed Destinations</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#0B3D2E]">3</p>
          <p className="mt-1 text-xs text-[#5D746B]">Accredited under your jurisdiction</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5D746B]">Open Inquiries</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-[#C19A4B]">Active</span>
            <Link href="/messages" className="text-xs font-medium text-[#0B3D2E] underline">
              View inbox →
            </Link>
          </div>
          <p className="mt-1 text-xs text-[#5D746B]">Awaiting host availability quote</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5D746B]">Advisory Pipeline</p>
          <p className="mt-2 font-display text-3xl font-semibold text-[#0B3D2E]">1</p>
          <p className="mt-1 text-xs text-[#5D746B]">Published state notice active</p>
        </Card>
      </div>

      {/* Managed Listings */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-[#0B3D2E]">Overseen Listings</h3>
          <span className="text-xs text-[#5D746B]">All claims subject to staff verification</span>
        </div>
        <div className="mt-4 space-y-3">
          {MANAGED_LISTINGS.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0B3D2E]/10 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[#0B3D2E]">{l.name}</h4>
                  <Badge tone="ok">{l.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-[#5D746B]">
                  {l.district} · {l.category} · Last reported status: {l.lastReported}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/places/${l.id}`} className={secondaryButtonClass}>
                  View place page ↗
                </Link>
                <Link href="/messages" className={primaryButtonClass}>
                  Reply inquiries →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit Advisory / Notice */}
      <section className="mt-12">
        <Card>
          <h3 className="font-display text-xl font-semibold text-[#0B3D2E]">Submit Local Advisory / Seasonal Notice</h3>
          <p className="mt-1 text-xs text-[#5D746B]">
            Notices enter the claims pipeline as <code className="rounded bg-[#0B3D2E]/5 px-1 font-semibold">pending_review</code>. Once reviewed by admin staff, they appear as official banners on affected destination pages.
          </p>

          {submitted ? (
            <div className="mt-6">
              <Notice tone="success">
                <strong>Advisory submitted!</strong> Your notice <em>&ldquo;{noticeTitle}&rdquo;</em> has been queued for Admin verification. It will appear on visitor surfaces once validated.
              </Notice>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setNoticeTitle("");
                  setNoticeBody("");
                  setValidUntil("");
                }}
                className={`mt-4 ${secondaryButtonClass}`}
              >
                Submit another advisory
              </button>
            </div>
          ) : (
            <form onSubmit={handleNoticeSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0B3D2E] uppercase tracking-wider">
                    Notice Title
                  </label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g., Loktak phumdi clearance operations"
                    className={`mt-1.5 w-full ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B3D2E] uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className={`mt-1.5 w-full ${inputClass}`}
                  >
                    <option value="Seasonal advisory">Seasonal advisory</option>
                    <option value="Road or access condition">Road or access condition</option>
                    <option value="Festival timings">Festival timings</option>
                    <option value="Permit & conservation rule">Permit & conservation rule</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B3D2E] uppercase tracking-wider">
                  Advisory Details & Guidance for Travelers
                </label>
                <textarea
                  rows={3}
                  required
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Provide precise details, affected routes, and contact numbers for local officers."
                  className={`mt-1.5 w-full ${inputClass}`}
                />
              </div>

              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-[#0B3D2E] uppercase tracking-wider">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={`mt-1.5 w-full ${inputClass}`}
                />
              </div>

              <div className="pt-2">
                <button type="submit" className={primaryButtonClass}>
                  Submit advisory for review →
                </button>
              </div>
            </form>
          )}
        </Card>
      </section>
    </main>
  );
}
