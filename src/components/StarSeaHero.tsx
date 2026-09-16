"use client";

import { useCallback, useEffect, useState } from "react";
import { CONSTELLATIONS } from "@/data/constellations";
import { DEFAULT_OBSERVER, observerFromDateInput } from "@/data/defaultObserver";
import type { Observer } from "@/types/astronomy";
import StarSeaCanvas from "./StarSeaCanvas";
import StarSeaControls from "./StarSeaControls";
import StarSeaFallback from "./StarSeaFallback";
import StarSeaLoading, { type StarSeaLoadingState } from "./StarSeaLoading";

export default function StarSeaHero() {
  const [loadingState, setLoadingState] =
    useState<StarSeaLoadingState>("poster");
  const [fallback, setFallback] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [observer, setObserver] = useState<Observer>(DEFAULT_OBSERVER);

  const handleReady = useCallback(() => {
    setLoadingState("interactive");
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.warn("Star Sea switched to the poster:", error);
    setFallback(true);
    setLoadingState("interactive");
  }, []);

  const handleDateChange = (value: string) => {
    if (!value || Number.isNaN(new Date(value).getTime())) return;
    setObserver((current) => observerFromDateInput(current, value));
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setObserver((current) => ({
          ...current,
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: "Current location",
        }));
      },
      () => undefined,
      { timeout: 3500, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setFallback(true);
      setLoadingState("interactive");
    } else {
      setLoadingState("initializing");
    }
  }, []);

  return (
    <section
      id="explore"
      aria-labelledby="star-sea-title"
      className="star-sea-shell min-h-[100svh]"
    >
      {/* Native img keeps the first-frame poster independent from Next image runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/star-sea-poster.webp"
        alt=""
        className={`star-sea-poster ${loadingState === "interactive" && !fallback ? "is-hidden" : ""}`}
        fetchPriority="high"
        decoding="async"
      />
      {!fallback && (
        <StarSeaCanvas
          observer={observer}
          selectedId={selectedId}
          onReady={handleReady}
          onError={handleError}
        />
      )}
      <div className="star-sea-vignette" />
      <div className="star-sea-grain" />
      {fallback && <StarSeaFallback />}
      <StarSeaLoading state={loadingState} />
      <StarSeaControls
        observer={observer}
        constellations={CONSTELLATIONS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDateChange={handleDateChange}
        onLocate={handleLocate}
      />

      {!fallback && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/60">
            <span>Star Sea / Preview</span>
            <span>Interactive sky</span>
          </div>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="mb-5 text-[10px] uppercase tracking-[0.34em] text-white/65">
              Celestial atlas
            </p>
            <h1
              id="star-sea-title"
              className="font-display text-6xl italic leading-none text-white sm:text-8xl"
            >
              星辰大海
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              Explore the sky above a breathing ocean.
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
            <span>Drag to explore</span>
            <span>Sky above / Ocean below</span>
          </div>
        </div>
      )}
    </section>
  );
}
