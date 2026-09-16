"use client";

import { useEffect, useRef, useState } from "react";
import {
  chooseInitialQuality,
  getQualitySettings,
  type QualityLevel,
} from "@/lib/rendering/quality";
import { BRIGHT_STARS, createFaintStarField } from "@/data/stars";
import { starsToHorizon } from "@/lib/astronomy/coordinates";
import { CONSTELLATIONS } from "@/data/constellations";
import type { Observer } from "@/types/astronomy";
import type { SceneHandle } from "@/lib/rendering/scene";

export default function StarSeaCanvas({
  onReady,
  onError,
  observer,
  selectedId,
  waveMode = "calm",
}: {
  onReady: () => void;
  onError: (error: unknown) => void;
  observer: Observer;
  selectedId: string;
  waveMode?: "calm" | "rippled";
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

  // Update wave mode uniform dynamically
  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.setWaveMode(waveMode === "rippled" ? 1.0 : 0.0);
    }
  }, [waveMode]);

  // Update stars smoothly on existing GPU buffers when observer time/location changes
  useEffect(() => {
    if (!handleRef.current || catalogRef.current.length === 0) return;
    const visibleStars = starsToHorizon(catalogRef.current, observer);
    handleRef.current.updateStars(visibleStars, selectedIdRef.current);
  }, [observer]);

  // Update constellation lines dynamically without tearing down the WebGL scene
  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.updateConstellation(selectedId);
    }
  }, [selectedId]);

  // Smooth camera fly-to when a constellation is chosen
  useEffect(() => {
    if (!handleRef.current || !selectedId) return;
    const constellation = CONSTELLATIONS.find((item) => item.id === selectedId);
    if (!constellation) return;

    const starIds = new Set<string>();
    constellation.segments.forEach(([a, b]) => {
      starIds.add(a);
      starIds.add(b);
    });

    const vectors: { x: number; y: number; z: number }[] = [];
    starIds.forEach((id) => {
      const v = handleRef.current?.starPositions.get(id);
      if (v) vectors.push(v);
    });

    if (vectors.length === 0) return;

    // Centroid of the constellation stars
    let cx = 0;
    let cy = 0;
    let cz = 0;
    vectors.forEach((v) => {
      cx += v.x;
      cy += v.y;
      cz += v.z;
    });
    cx /= vectors.length;
    cy /= vectors.length;
    cz /= vectors.length;

    const radius = Math.hypot(cx, cy, cz) || 1;
    const rawPitch = Math.asin(Math.max(-1, Math.min(1, cy / radius)));
    // If the constellation is below the horizon, point towards its azimuth at an elegant observing altitude
    const targetPitch = rawPitch < 0.22 ? 0.32 : Math.min(1.20, rawPitch);
    const targetYaw = Math.atan2(cx, -cz);

    const startYaw = view.current.yaw;
    const startPitch = view.current.pitch;

    // Shortest angular route
    let deltaYaw = (targetYaw - startYaw) % (Math.PI * 2);
    if (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    if (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

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
      if (!disposed) fail(new Error("Star Sea initialization timed out."));
    }, 15_000);

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
        const handle = createScene(
          canvas,
          getQualitySettings(level),
          visibleStars,
          CONSTELLATIONS,
          selectedIdRef.current,
          waveModeRef.current === "rippled" ? 1.0 : 0.0,
        );
        handleRef.current = handle;

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
            elapsed += Math.min((now - previousTime) / 1000, 0.1);
            previousTime = now;
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
