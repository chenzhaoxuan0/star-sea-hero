"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  chooseInitialQuality,
  getQualitySettings,
  type QualityLevel,
} from "@/lib/rendering/quality";
import { BRIGHT_STARS, createFaintStarField } from "@/data/stars";
import { calculateMilkyWayBasis, starsToHorizon, starToHorizon } from "@/lib/astronomy/coordinates";
import { CONSTELLATIONS } from "@/data/constellations";
import type { CloudSettings, Observer } from "@/types/astronomy";
import type { SceneHandle } from "@/lib/rendering/scene";

export default function StarSeaCanvas({
  onReady,
  onError,
  observer,
  selectedId,
  waveMode = "calm",
  cloudSettings,
  isPlaying = false,
  playSpeed = 1,
  onObserverDateUpdate,
}: {
  onReady: () => void;
  onError: (error: unknown) => void;
  observer: Observer;
  selectedId: string;
  waveMode?: "calm" | "rippled";
  cloudSettings?: CloudSettings;
  isPlaying?: boolean;
  playSpeed?: number;
  onObserverDateUpdate?: (dateIso: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const handleRef = useRef<SceneHandle | null>(null);
  // Default camera pitch: 0.28 rad (~16 deg up) so sea sits low and celestial dome fills screen
  const view = useRef({ yaw: 0, pitch: 0.28 });
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const waveModeRef = useRef(waveMode);
  waveModeRef.current = waveMode;
  const catalogRef = useRef<ReturnType<typeof createFaintStarField>>([]);
  const observerRef = useRef(observer);
  observerRef.current = observer;
  const cloudSettingsRef = useRef(cloudSettings);
  cloudSettingsRef.current = cloudSettings;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playSpeedRef = useRef(playSpeed);
  playSpeedRef.current = playSpeed;
  const onObserverDateUpdateRef = useRef(onObserverDateUpdate);
  onObserverDateUpdateRef.current = onObserverDateUpdate;
  const simDateMs = useRef(new Date(observer.date).getTime());
  const lastUiSyncTime = useRef(0);

  // Sync simulation timestamp when pausing or selecting a new constellation
  useEffect(() => {
    if (!isPlaying) {
      onObserverDateUpdateRef.current?.(new Date(simDateMs.current).toISOString());
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      simDateMs.current = new Date(observer.date).getTime();
    }
  }, [selectedId, observer.date, isPlaying]);

  // Update wave mode uniform dynamically
  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.setWaveMode(waveMode === "rippled" ? 1.0 : 0.0);
    }
  }, [waveMode]);

  // Update clouds dynamically
  useEffect(() => {
    if (handleRef.current && cloudSettings) {
      handleRef.current.updateClouds(
        cloudSettings.density,
        cloudSettings.elevation,
        cloudSettings.coverage,
      );
    }
  }, [cloudSettings]);

  // Update stars & Milky Way matrix smoothly when observer time/location changes (e.g. from user controls)
  useEffect(() => {
    if (!handleRef.current) return;
    if (isPlayingRef.current) return; // Handled continuously at 60 FPS in render()

    simDateMs.current = new Date(observer.date).getTime();
    if (catalogRef.current.length > 0) {
      const visibleStars = starsToHorizon(catalogRef.current, observer);
      handleRef.current.updateStars(visibleStars, selectedIdRef.current);
    }
    const basis = calculateMilkyWayBasis(observer);
    const xVec = new THREE.Vector3(basis.xAxis.x, basis.xAxis.y, basis.xAxis.z);
    const yVec = new THREE.Vector3(basis.yAxis.x, basis.yAxis.y, basis.yAxis.z);
    const zVec = new THREE.Vector3(basis.zAxis.x, basis.zAxis.y, basis.zAxis.z);
    const mwMat = new THREE.Matrix4().makeBasis(xVec, yVec, zVec).invert();
    handleRef.current.updateMilkyWay(mwMat);
  }, [observer]);

  // Update constellation lines dynamically without tearing down the WebGL scene
  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.updateConstellation(selectedId);
    }
  }, [selectedId]);

  // Helper to get shortest angular distance
  const normalizeAngle = (rad: number): number => {
    let a = rad % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  };

  // Smooth camera fly-to when a constellation is chosen or reset
  useEffect(() => {
    let targetYaw = 0;
    let targetPitch = 0.28;

    if (selectedId) {
      const constellation = CONSTELLATIONS.find((item) => item.id === selectedId);
      if (constellation) {
        const starIds = new Set<string>();
        constellation.segments.forEach(([a, b]) => {
          starIds.add(a);
          starIds.add(b);
        });
        let cx = 0;
        let cy = 0;
        let cz = 0;
        let count = 0;
        starIds.forEach((id) => {
          const s = BRIGHT_STARS.find((star) => star.id === id);
          if (s) {
            const h = starToHorizon(s, observerRef.current);
            cx += h.vector.x;
            cy += h.vector.y;
            cz += h.vector.z;
            count++;
          }
        });
        if (count > 0) {
          const len = Math.hypot(cx, cy, cz) || 1;
          const nx = cx / len;
          const ny = cy / len;
          const nz = cz / len;
          targetYaw = Math.atan2(nx, -nz);
          const rawPitch = Math.asin(Math.max(-1, Math.min(1, ny)));
          // Limit pitch between 0.22 (~13°) and 1.15 (~66°) to center constellation in sky and avoid zenith gimbal singularity
          targetPitch = Math.max(0.22, Math.min(1.15, rawPitch));
        }
      }
    }

    if (!handleRef.current) {
      view.current.yaw = targetYaw;
      view.current.pitch = targetPitch;
      return;
    }

    const startYaw = view.current.yaw;
    const startPitch = view.current.pitch;
    const deltaYaw = normalizeAngle(targetYaw - startYaw);
    const deltaPitch = targetPitch - startPitch;
    const duration = 1200; // ms
    const startTime = performance.now();
    let animId = 0;

    const animateFlyTo = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      view.current.yaw = startYaw + deltaYaw * ease;
      view.current.pitch = startPitch + deltaPitch * ease;

      if (progress < 1) {
        animId = requestAnimationFrame(animateFlyTo);
      }
    };

    animId = requestAnimationFrame(animateFlyTo);
    return () => cancelAnimationFrame(animId);
  }, [selectedId]);

  useEffect(() => {
    let disposed = false;
    let frameId = 0;
    let cleanup: (() => void) | undefined;
    let timedOut = false;

    const fail = (error: unknown) => {
      cleanup?.();
      setReady(false);
      onError(error);
    };

    const timeout = window.setTimeout(() => {
      timedOut = true;
      fail(new Error("Star Sea WebGL initialization timed out."));
    }, 7000);

    const start = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Star Sea canvas is unavailable.");

        const { createScene } = await import("@/lib/rendering/scene");
        if (disposed || timedOut) return;

        const level: QualityLevel = chooseInitialQuality(
          window.innerWidth,
          navigator.hardwareConcurrency || 4,
        );
        const catalog = [
          ...BRIGHT_STARS,
          ...createFaintStarField(
            Math.min(
              180,
              Math.max(0, getQualitySettings(level).starLimit - BRIGHT_STARS.length),
            ),
          ),
        ];
        catalogRef.current = catalog;
        const visibleStars = starsToHorizon(catalog, observerRef.current);

        const basis = calculateMilkyWayBasis(observerRef.current);
        const xVec = new THREE.Vector3(basis.xAxis.x, basis.xAxis.y, basis.xAxis.z);
        const yVec = new THREE.Vector3(basis.yAxis.x, basis.yAxis.y, basis.yAxis.z);
        const zVec = new THREE.Vector3(basis.zAxis.x, basis.zAxis.y, basis.zAxis.z);
        const initialMwMat = new THREE.Matrix4().makeBasis(xVec, yVec, zVec).invert();

        const handle = createScene(
          canvas,
          getQualitySettings(level),
          visibleStars,
          CONSTELLATIONS,
          selectedIdRef.current,
          waveModeRef.current === "rippled" ? 1.0 : 0.0,
          initialMwMat,
        );
        handleRef.current = handle;
        if (typeof window !== "undefined") {
          (window as unknown as { __debug: unknown }).__debug = { handle, view };
        }

        if (cloudSettingsRef.current) {
          handle.updateClouds(
            cloudSettingsRef.current.density,
            cloudSettingsRef.current.elevation,
            cloudSettingsRef.current.coverage,
          );
        }

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        const onPointerDown = (event: PointerEvent) => {
          dragging = true;
          lastX = event.clientX;
          lastY = event.clientY;
          canvas.setPointerCapture(event.pointerId);
        };

        const onPointerMove = (event: PointerEvent) => {
          if (!dragging) return;
          const deltaX = event.clientX - lastX;
          const deltaY = event.clientY - lastY;
          view.current.yaw -= deltaX * 0.0028;
          view.current.pitch = Math.max(
            -0.08,
            Math.min(Math.PI / 2 - 0.05, view.current.pitch + deltaY * 0.0028),
          );
          lastX = event.clientX;
          lastY = event.clientY;
        };

        const onPointerUp = (event: PointerEvent) => {
          dragging = false;
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);

        const resizeObserver = new ResizeObserver(() => {
          const width = Math.max(canvas.clientWidth, 1);
          const height = Math.max(canvas.clientHeight, 1);
          handle.camera.aspect = width / height;
          handle.camera.updateProjectionMatrix();
          handle.renderer.setSize(width, height, false);
        });
        resizeObserver.observe(canvas);

        let isVisible = document.visibilityState === "visible";
        let elapsed = 0;
        let previousTime = performance.now();

        const onVisibilityChange = () => {
          isVisible = document.visibilityState === "visible";
          window.cancelAnimationFrame(frameId);
          previousTime = performance.now();
          if (isVisible) frameId = window.requestAnimationFrame(render);
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        const render = (now: number) => {
          if (!isVisible || disposed || timedOut) return;
          try {
            const dt = Math.min((now - previousTime) / 1000, 0.1);
            elapsed += dt;
            previousTime = now;

            if (isPlayingRef.current && handleRef.current) {
              // Real-time sidereal continuous progression at 60 FPS
              // 1x = 1 celestial minute per real second = 60,000 ms per second
              const advanceMs = dt * (playSpeedRef.current || 1) * 60 * 1000;
              simDateMs.current += advanceMs;

              const currentObs: Observer = {
                ...observerRef.current,
                date: new Date(simDateMs.current).toISOString(),
              };
              observerRef.current = currentObs;

              if (catalogRef.current.length > 0) {
                const visibleStars = starsToHorizon(catalogRef.current, currentObs);
                handle.updateStars(visibleStars, selectedIdRef.current);
              }
              const basis = calculateMilkyWayBasis(currentObs);
              const xVec = new THREE.Vector3(basis.xAxis.x, basis.xAxis.y, basis.xAxis.z);
              const yVec = new THREE.Vector3(basis.yAxis.x, basis.yAxis.y, basis.yAxis.z);
              const zVec = new THREE.Vector3(basis.zAxis.x, basis.zAxis.y, basis.zAxis.z);
              const mwMat = new THREE.Matrix4().makeBasis(xVec, yVec, zVec).invert();
              handle.updateMilkyWay(mwMat);

              // Throttle datetime picker UI update (every 400ms) to avoid React re-render thrashing
              if (now - lastUiSyncTime.current > 400) {
                lastUiSyncTime.current = now;
                onObserverDateUpdateRef.current?.(currentObs.date);
              }
            }

            const { yaw, pitch } = view.current;
            handle.camera.lookAt(
              Math.sin(yaw) * Math.cos(pitch),
              Math.sin(pitch),
              -Math.cos(yaw) * Math.cos(pitch),
            );
            handle.render(elapsed);
            frameId = window.requestAnimationFrame(render);
          } catch (error) {
            fail(error);
          }
        };

        const onContextLost = (event: Event) => {
          event.preventDefault();
          fail(new Error("Star Sea WebGL context lost."));
        };
        canvas.addEventListener("webglcontextlost", onContextLost);

        cleanup = () => {
          window.cancelAnimationFrame(frameId);
          resizeObserver.disconnect();
          document.removeEventListener("visibilitychange", onVisibilityChange);
          canvas.removeEventListener("pointerdown", onPointerDown);
          canvas.removeEventListener("pointermove", onPointerMove);
          canvas.removeEventListener("pointerup", onPointerUp);
          canvas.removeEventListener("pointercancel", onPointerUp);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          handleRef.current = null;
          handle.dispose();
        };

        // Render first frame to compile GPU shaders
        handle.render(0);
        window.clearTimeout(timeout);
        setReady(true);
        onReady();
        frameId = window.requestAnimationFrame(render);
      } catch (error) {
        window.clearTimeout(timeout);
        if (!disposed && !timedOut) fail(error);
      }
    };

    const schedule =
      "requestIdleCallback" in window
        ? (callback: () => void) =>
            window.requestIdleCallback(callback, { timeout: 300 })
        : (callback: () => void) => window.setTimeout(callback, 40);
    const scheduled = schedule(() => void start());

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(scheduled);
      window.clearTimeout(scheduled);
      cleanup?.();
    };
  }, [onError, onReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`star-sea-canvas ${ready ? "is-ready" : ""}`}
      data-testid="star-sea-canvas"
    />
  );
}
