"use client";
import { useCallback, useEffect, useState } from "react";

type Photo = {
  storageKey: string;
  caption: string;
  attribution: string;
  license: string;
  sourcePage?: string | null;
};

export function PhotoLightbox({ photos, startIndex = 0 }: { photos: Photo[]; startIndex?: number }) {
  const [index, setIndex] = useState(startIndex);
  const [open, setOpen] = useState(false);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + photos.length) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  if (photos.length === 0) return null;
  const current = photos[index] ?? photos[0];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {photos.map((ph, i) => (
          <button
            key={ph.storageKey}
            type="button"
            onClick={() => openAt(i)}
            aria-label={`Open photo: ${ph.caption}`}
            className="group cursor-zoom-in overflow-hidden rounded-2xl border border-[#0B3D2E]/10 bg-[#FDFBF7] text-left transition hover:border-[#C19A4B]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C19A4B]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ph.storageKey}
              alt={ph.caption}
              className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <span className="block truncate px-4 py-2.5 text-xs text-[#5D746B]">
              {ph.caption} · tap to enlarge
            </span>
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          className="fixed inset-0 z-50 flex flex-col bg-black/92 p-4 sm:p-8"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-white/70">
              {index + 1} / {photos.length}
            </p>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label="Close lightbox"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-lg text-white transition hover:bg-white/20"
            >
              ✕
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center gap-2 sm:gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-lg text-white transition hover:bg-white/20"
            >
              ←
            </button>
            <figure className="max-h-full min-w-0 max-w-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.storageKey}
                alt={current.caption}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain"
              />
              <figcaption className="mt-3 text-center text-xs leading-5 text-white/80">
                {current.caption}
                <br />
                {current.attribution} · {current.license}
                {current.sourcePage && (
                  <>
                    {" · "}
                    <a
                      className="font-semibold text-white underline"
                      href={current.sourcePage}
                      rel="noreferrer noopener"
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      source
                    </a>
                  </>
                )}
              </figcaption>
            </figure>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-lg text-white transition hover:bg-white/20"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
