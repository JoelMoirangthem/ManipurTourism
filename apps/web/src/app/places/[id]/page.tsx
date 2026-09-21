import { notFound } from "next/navigation";
import Link from "next/link";
import { seedRetriever, fetchWeather, weatherDescription } from "@/lib/adapters";
import { buildNavigateUrl } from "@/lib/nearby";
import { capacityWording, projectFreshness, reviewLabel, trustBadge } from "@/lib/domain";
import { Badge, Card, Disclaimer, SectionTitle, freshnessTone, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { PhotoLightbox } from "@/components/PhotoLightbox";

// Next 16: page params are async.
export default async function PlaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const place = await seedRetriever.getPlace(id);
  if (!place) notFound();

  let weather: { tempC: number; windKph: number; code: number; validTime: string } | null = null;
  if (place.lat != null && place.lng != null) {
    try {
      weather = await fetchWeather(place.lat, place.lng);
    } catch {
      weather = null;
    }
  }

  const seedPhotos = place.photos.filter((p) => p.origin !== "approved-upload");
  const contributed = place.photos.filter((p) => p.origin === "approved-upload");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-[#5D746B]">
        <Link href="/places" className="rounded-full border border-[#0B3D2E]/15 bg-white px-3 py-1 transition hover:border-[#0B3D2E]/30">
          ← Places
        </Link>
        <span>{place.district} · {place.category}</span>
      </nav>

      <div className="mt-6 rounded-[24px] border border-[#0B3D2E]/10 bg-white p-6 sm:p-8 premium-card">
        <Badge tone="gold">{place.category}</Badge>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-[#0B3D2E] sm:text-5xl">{place.name}</h1>
        {place.aliases.length > 0 && (
          <p className="mt-2 text-sm text-[#5D746B]">Also known as {place.aliases.join(", ")}</p>
        )}

        {seedPhotos.length > 0 && (
          <div className="mt-6">
            <PhotoLightbox
              photos={seedPhotos.map((ph) => ({
                storageKey: ph.storageKey,
                caption: ph.caption,
                attribution: ph.attribution,
                license: ph.license,
                sourcePage: ph.sourcePage,
              }))}
            />
          </div>
        )}

        <p className="mt-6 text-[16px] leading-8 text-[#1A2E28]">{place.summary}</p>

        {/* Capacity vs availability — the split must stay visually obvious. */}
        <div className="mt-5 rounded-2xl border border-[#C19A4B]/40 bg-[#FBF6E9] p-5">
          <p className="text-sm font-semibold text-[#5a4a1e]">{capacityWording(place)}</p>
          <p className="mt-1 text-xs leading-5 text-[#6b5a26]">
            A listed room count is a property size from a published directory, not free rooms tonight. Only a host
            reply for your dates tells you anything about availability.
          </p>
        </div>

        {place.coordSource && (
          <p className="mt-3 text-xs text-[#5D746B]">
            Map location approximate — transfers unverified.
          </p>
        )}

        {weather && (
          <Card className="mt-4 border-[#0B3D2E]/15 bg-[#EEF5F1]">
            <p className="text-xs leading-5 text-[#0B3D2E]">
              <strong className="font-semibold">Now near here:</strong> {weather.tempC}°C, {weatherDescription(weather.code)}, wind{" "}
              {Math.round(weather.windKph)} km/h — forecast model, valid {new Date(weather.validTime).toLocaleString()}.
              Forecast only: it does not mean open, closed or safe.
            </p>
          </Card>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/inquire?placeId=${place.id}`} className={primaryButtonClass}>
            Ask about this place →
          </Link>
          <Link href="/plan" className={secondaryButtonClass}>
            Add to a draft plan
          </Link>
          <Link href="/upload" className={secondaryButtonClass}>
            Contribute a photo
          </Link>
          {place.lat != null && place.lng != null && (
            <a
              href={buildNavigateUrl(place.lat, place.lng)}
              target="_blank"
              rel="noopener noreferrer"
              title="Opens turn-by-turn driving directions in Google Maps"
              className={secondaryButtonClass}
            >
              Navigate →
            </a>
          )}
        </div>
        {place.lat != null && place.lng != null && (
          <p className="mt-3 text-xs text-[#5D746B]">
            Navigate opens driving directions in the Google Maps app — live traffic and rerouting come from Google, not this site.
          </p>
        )}
      </div>

      {contributed.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Community photos" lede="Contributed by visitors and approved by a moderator." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contributed.map((ph) => (
              <figure key={ph.storageKey} className="premium-card overflow-hidden rounded-2xl border border-[#0E5A42]/25 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.storageKey} alt={ph.caption} className="h-56 w-full object-cover" />
                <figcaption className="px-4 py-3 text-xs leading-5 text-[#5D746B]">
                  {ph.caption}
                  <br />
                  {ph.attribution} · {ph.license} · <Badge tone="ok">reviewed</Badge>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionTitle title="What is on record, and how old it is" lede="Reviewed and current are separate things. A fact can be checked and still be out of date." />
        <ul className="mt-4 space-y-3">
          {place.claims.map((c) => {
            const badge = trustBadge(c);
            const fresh = projectFreshness(c);
            return (
              <li key={c.id} className="premium-card rounded-2xl border border-[#0B3D2E]/10 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-[#0B3D2E]/5 px-2 py-1 text-xs font-medium text-[#0B3D2E]">{c.id}</code>
                  <span className="text-xs text-[#5D746B]">{c.fieldKey}</span>
                  <span className="ml-auto"><Badge tone={freshnessTone(fresh)}>{badge.text}</Badge></span>
                </div>
                <p className="mt-2.5 text-[15px] text-[#1A2E28]">{c.valueText ?? (c.valueInt != null ? String(c.valueInt) : "—")}</p>
                <p className="mt-1.5 text-xs leading-5 text-[#5D746B]">
                  {c.sourceTitle} · scope: {c.scope.replace("_", " ")} · {reviewLabel(c.reviewState)}
                  {c.observedAt ? ` · observed ${c.observedAt}` : " · no observation date"}
                  {c.sourceUrl && (
                    <>
                      {" · "}
                      <a className="font-medium text-[#0B3D2E] underline" href={c.sourceUrl} rel="noreferrer noopener" target="_blank">
                        {c.sourceUrl.replace(/^https?:\/\//, "")}
                      </a>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <Disclaimer className="mt-8" />
    </main>
  );
}
