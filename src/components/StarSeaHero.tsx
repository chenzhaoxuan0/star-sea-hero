"use client";

import { useCallback, useEffect, useState } from "react";
import { CONSTELLATIONS } from "@/data/constellations";
import {
  DEFAULT_OBSERVER,
  LATITUDE_PRESETS,
  TIMEZONE_PRESETS,
  formatCoordinatesLabel,
  observerFromDateInput,
} from "@/data/defaultObserver";
import type { CloudSettings, Observer } from "@/types/astronomy";
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

  // Sea State: "calm" (mirror-like with star reflection) vs "rippled" (silky harmonics)
  const [waveMode, setWaveMode] = useState<"calm" | "rippled">("calm");

  // Timezone & Latitude preset selection
  const [selectedTimezone, setSelectedTimezone] = useState("UTC+8");
  const [selectedLatitude, setSelectedLatitude] = useState("35N");

  // Auto-lapse playback state
  const [isPlaying, setIsPlaying] = useState(false);

  // Nocturnal clouds & mist settings
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({
    density: 1.0,
    elevation: 0.32,
    coverage: 0.55,
  });

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

  const handleToggleWaveMode = () => {
    setWaveMode((prev) => (prev === "calm" ? "rippled" : "calm"));
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleTimezoneChange = (tzId: string) => {
    setSelectedTimezone(tzId);
    const tz = TIMEZONE_PRESETS.find((t) => t.id === tzId);
    if (!tz) return;

    setObserver((current) => ({
      ...current,
      longitude: tz.longitude,
      label: formatCoordinatesLabel(current.latitude, tz.longitude, tz.id),
    }));
  };

  const handleLatitudeChange = (latId: string) => {
    setSelectedLatitude(latId);
    const lat = LATITUDE_PRESETS.find((l) => l.id === latId);
    if (!lat) return;

    setObserver((current) => ({
      ...current,
      latitude: lat.latitude,
      label: formatCoordinatesLabel(lat.latitude, current.longitude, selectedTimezone),
    }));
  };

  // Real-time sidereal time advance during Play
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setObserver((current) => {
        const d = new Date(current.date);
        // Advance 30 minutes every second (fast-forward diurnal sky motion)
        d.setMinutes(d.getMinutes() + 30);
        return {
          ...current,
          date: d.toISOString(),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section
      aria-label="星辰大海交互三维星空"
      className="star-sea-hero relative h-screen w-full overflow-hidden bg-space text-white"
    >
      {!fallback && (
        <StarSeaCanvas
          observer={observer}
          selectedId={selectedId}
          waveMode={waveMode}
          cloudSettings={cloudSettings}
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
        waveMode={waveMode}
        onToggleWaveMode={handleToggleWaveMode}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
        selectedLatitude={selectedLatitude}
        onLatitudeChange={handleLatitudeChange}
        cloudSettings={cloudSettings}
        onCloudSettingsChange={setCloudSettings}
      />

      {!fallback && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/60">
            <span>Star Sea / WebGL 3D</span>
            <span>Celestial Horizon</span>
          </div>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="mb-4 text-[10px] uppercase tracking-[0.34em] text-white/65">
              Celestial Atlas & Ocean Mirror
            </p>
            <h1
              id="star-sea-title"
              className="font-display text-6xl italic leading-none text-white sm:text-8xl"
            >
              星辰大海
            </h1>
            <p className="mt-4 max-w-xl text-xs sm:text-sm leading-6 text-white/70">
              仰望浩瀚星穹，俯瞰平静如镜的海面倒影。
            </p>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
            <span>Drag sky to explore</span>
            <span>Water & Sky in Harmony</span>
          </div>
        </div>
      )}
    </section>
  );
}
