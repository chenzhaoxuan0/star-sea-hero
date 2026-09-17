"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { CONSTELLATIONS } from "@/data/constellations";
import {
  DEFAULT_OBSERVER,
  LATITUDE_PRESETS,
  TIMEZONE_PRESETS,
  formatCoordinatesLabel,
  observerFromDateInput,
} from "@/data/defaultObserver";
import type { CloudSettings, Observer } from "@/types/astronomy";
import { getOptimalObserverForConstellation } from "@/lib/astronomy/constellationFocus";
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
  const [waveMode, setWaveMode] = useState<"calm" | "rippled">("rippled");

  // Timezone & Latitude preset selection
  const [selectedTimezone, setSelectedTimezone] = useState("UTC+8");
  const [selectedLatitude, setSelectedLatitude] = useState("35N");

  // Auto-lapse playback state & speed (1x = 1 min/sec, 2x = 2 min/sec, etc.) - default on
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(1);

  // Nocturnal clouds & mist settings (default to 0.0 clear sky so Milky Way is completely unobstructed)
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({
    density: 0.0,
    elevation: 0.20,
    coverage: 0.40,
  });

  // Center Title visibility state
  const [showCenterTitle, setShowCenterTitle] = useState(true);

  // Fully immersive mode (hides all UI: corners, center title, bottom controls bar)
  const [isImmersive, setIsImmersive] = useState(false);
  const [immersiveNotice, setImmersiveNotice] = useState<string | null>(null);

  const handleReady = useCallback(() => {
    setLoadingState("interactive");
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.warn("Star Sea switched to the poster:", error);
    setFallback(true);
    setLoadingState("interactive");
  }, []);

  // When user selects a constellation, automatically jump to its optimal observation season and latitude
  const handleSelectConstellation = (constellationId: string) => {
    setSelectedId(constellationId);
    if (!constellationId) return;

    const optimal = getOptimalObserverForConstellation(constellationId, observer, selectedTimezone);
    if (optimal) {
      setSelectedLatitude(optimal.latitudeId);
      setObserver(optimal.observer);
    }
  };

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

  // Continuous sidereal time update callback from StarSeaCanvas 60fps loop
  const handleObserverDateUpdate = useCallback((dateIso: string) => {
    setObserver((current) => ({
      ...current,
      date: dateIso,
    }));
  }, []);

  // Handle entering immersive mode: show brief guidance notice
  const handleEnterImmersive = useCallback(() => {
    setIsImmersive(true);
    setImmersiveNotice("已进入纯净沉浸模式 · 连续点击画面 3 次重现界面");
  }, []);

  // Triple-click / tap detector on screen to exit immersive mode
  useEffect(() => {
    if (!isImmersive) {
      setImmersiveNotice(null);
      return;
    }

    // Auto-dismiss the entry guidance after 3.2 seconds
    const timer = setTimeout(() => {
      setImmersiveNotice(null);
    }, 3200);

    let pointerDownInfo: { x: number; y: number; time: number } | null = null;
    let clickHistory: number[] = [];

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownInfo = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownInfo) return;
      const dx = e.clientX - pointerDownInfo.x;
      const dy = e.clientY - pointerDownInfo.y;
      const dt = Date.now() - pointerDownInfo.time;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only count as an intentional click/tap if mouse/finger didn't drag the 3D sky (dist < 15px, dt < 500ms)
      if (dist < 15 && dt < 500) {
        const now = Date.now();
        // Keep clicks occurring within the last 1200ms
        clickHistory = clickHistory.filter((t) => now - t < 1200);
        clickHistory.push(now);

        if (clickHistory.length >= 3) {
          clickHistory = [];
          setIsImmersive(false);
          setImmersiveNotice(null);
        } else {
          const count = clickHistory.length;
          setImmersiveNotice(`已连击 ${count}/3 次 · 再点击 ${3 - count} 次重现界面`);
        }
      }
      pointerDownInfo = null;
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pointerup", handlePointerUp, { capture: true });
    };
  }, [isImmersive]);

  // Fallback timer only when WebGL 3D canvas is inactive
  useEffect(() => {
    if (!fallback || !isPlaying) return;

    const interval = setInterval(() => {
      setObserver((current) => {
        const d = new Date(current.date);
        d.setMinutes(d.getMinutes() + playSpeed);
        return {
          ...current,
          date: d.toISOString(),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fallback, isPlaying, playSpeed]);

  return (
    <section
      aria-label="星辰大海交互三维星空"
      className="star-sea-hero relative h-screen w-full overflow-hidden bg-space text-white"
    >
      {!fallback && (
        <StarSeaCanvas
          observer={observer}
          selectedId={selectedId}
          selectedTimezone={selectedTimezone}
          waveMode={waveMode}
          cloudSettings={cloudSettings}
          isPlaying={isPlaying}
          playSpeed={playSpeed}
          onObserverDateUpdate={handleObserverDateUpdate}
          onReady={handleReady}
          onError={handleError}
        />
      )}
      <div className="star-sea-vignette" />
      <div className="star-sea-grain" />
      {fallback && <StarSeaFallback />}
      <StarSeaLoading state={loadingState} />

      {/* Immersive Guidance Toast */}
      {isImmersive && immersiveNotice && (
        <aside
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed top-7 left-1/2 z-30 -translate-x-1/2 transition-all duration-300"
        >
          <div className="flex items-center gap-2 rounded-full border border-cyan/40 bg-slate-950/85 px-4 py-2 text-xs font-medium text-cyan shadow-2xl backdrop-blur-md">
            <Sparkles size={14} className="text-cyan animate-pulse" />
            <span>{immersiveNotice}</span>
          </div>
        </aside>
      )}

      {/* Bottom Controls Dock Panel */}
      <StarSeaControls
        observer={observer}
        constellations={CONSTELLATIONS}
        selectedId={selectedId}
        onSelect={handleSelectConstellation}
        onDateChange={handleDateChange}
        waveMode={waveMode}
        onToggleWaveMode={handleToggleWaveMode}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        playSpeed={playSpeed}
        onPlaySpeedChange={setPlaySpeed}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
        selectedLatitude={selectedLatitude}
        onLatitudeChange={handleLatitudeChange}
        cloudSettings={cloudSettings}
        onCloudSettingsChange={setCloudSettings}
        showCenterTitle={showCenterTitle}
        onToggleCenterTitle={() => setShowCenterTitle((prev) => !prev)}
        isImmersive={isImmersive}
        onEnterImmersive={handleEnterImmersive}
      />

      {!fallback && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 transition-opacity duration-500 ${
            isImmersive ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Top Corner Labels */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/60">
            <span>Star Sea / WebGL 3D</span>
            <span>Celestial Horizon</span>
          </div>

          {/* Center Title Block */}
          <div
            className={`mx-auto flex max-w-3xl flex-col items-center text-center transition-all duration-500 ${
              showCenterTitle
                ? "opacity-100 translate-y-0"
                : "pointer-events-none opacity-0 -translate-y-2 scale-95"
            }`}
          >
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

          {/* Bottom Corner Labels */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
            <span>Drag sky to explore</span>
            <span>Water & Sky in Harmony</span>
          </div>
        </div>
      )}
    </section>
  );
}
