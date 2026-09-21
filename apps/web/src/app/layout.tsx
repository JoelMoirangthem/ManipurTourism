import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ActorSwitcher } from "@/components/ActorSwitcher";
import { AssistantPanel } from "@/components/AssistantPanel";
import { AssistantAutoOpen } from "@/components/AssistantAutoOpen";
import { WishlistCount } from "@/components/WishlistCount";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manipur Tourism Mit — plan from verified info",
  description:
    "Discover sourced places, draft tentative itineraries with an honest budget, and ask local providers — with sources, age, and unknowns shown.",
};

const NAV = [
  { href: "/places", label: "Destinations" },
  { href: "/nearby", label: "Near me" },
  { href: "/places?category=Stay", label: "Stays" },
  { href: "/places?category=Heritage", label: "Experiences" },
  { href: "/#festivals", label: "Festivals" },
  { href: "/messages", label: "Messages" },
  { href: "/upload", label: "Contribute" },
];
const MORE_NAV = [
  { href: "/inquire", label: "Inquire" },
  { href: "/dashboard/authority", label: "Authority Dashboard" },
  { href: "/dashboard/admin", label: "Admin Console" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#FDFBF7] text-[#1A2E28]">
        <div className="h-1 w-full bg-gradient-to-r from-[#0B3D2E] via-[#C19A4B] to-[#0B3D2E]" />
        <header className="sticky top-0 z-40 border-b border-[#0B3D2E]/10 bg-[#FDFBF7]/85 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl flex-nowrap items-center gap-x-2 gap-y-2 overflow-x-auto px-4 py-3 text-sm font-medium sm:flex-wrap sm:overflow-visible sm:px-6">
            <Link href="/" className="mr-2 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B3D2E] font-display text-lg text-[#F3E8CF]">
                M
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[17px] font-semibold tracking-tight text-[#0B3D2E]">
                  Manipur Tourism Mit
                </span>
                <span className="block text-[11px] font-medium tracking-[0.14em] text-[#9A7A2E] uppercase">
                  Verified · Honest · Local
                </span>
              </span>
            </Link>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-3 py-1.5 text-[13.5px] text-[#42584F] transition hover:bg-[#0B3D2E]/5 hover:text-[#0B3D2E]"
              >
                {n.label}
              </Link>
            ))}
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full px-3 py-1.5 text-[13.5px] text-[#42584F] transition hover:bg-[#0B3D2E]/5 hover:text-[#0B3D2E]">
                More
              </summary>
              <div className="absolute right-0 z-50 mt-1 flex min-w-36 flex-col rounded-xl border border-[#0B3D2E]/10 bg-white p-1 shadow-lg">
                {MORE_NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-lg px-3 py-1.5 text-[13.5px] text-[#42584F] transition hover:bg-[#0B3D2E]/5 hover:text-[#0B3D2E]"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </details>
            <span className="ml-auto flex items-center gap-2">
              <WishlistCount />
              <ActorSwitcher />
            </span>
          </nav>
        </header>

        <div className="flex-1">{children}</div>

        <AssistantPanel />
        <AssistantAutoOpen />

        <footer className="mt-16 border-t border-[#0B3D2E]/10 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0B3D2E] text-sm text-[#F3E8CF]">
                M
              </span>
              <p className="font-display text-lg font-semibold text-[#0B3D2E]">Travel on what is known.</p>
              <span className="ml-auto rounded-full border border-[#C19A4B]/40 bg-[#FBF6E9] px-3 py-1 text-xs font-medium text-[#7a5f22]">
                Tentative plans only — never a reservation
              </span>
            </div>
            <div className="mt-4 grid gap-4 text-xs leading-5 text-[#5D746B] sm:grid-cols-2">
              <p>
                <strong className="font-semibold text-[#0B3D2E]">Tentative plans only.</strong> Availability,
                prices, opening hours and safety are unconfirmed. Host replies are host-reported for the stated
                dates and expire; they are never reservations.
              </p>
              <p>
                Do not rely on this site for safety, permits, road conditions or medical decisions. Confirm with
                the provider and official government sources before travel.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
