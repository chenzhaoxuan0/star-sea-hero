import { describe, expect, it } from "vitest";
import { DEFAULT_OBSERVER } from "@/data/defaultObserver";
import { CONSTELLATIONS } from "@/data/constellations";
import { BRIGHT_STARS } from "@/data/stars";
import { getOptimalObserverForConstellation } from "@/lib/astronomy/constellationFocus";
import { starToHorizon } from "@/lib/astronomy/coordinates";

describe("constellation optimal observation conditions", () => {
  it("places all 21 constellations above horizon in dark night sky", () => {
    for (const constellation of CONSTELLATIONS) {
      const optimal = getOptimalObserverForConstellation(constellation.id, DEFAULT_OBSERVER);
      expect(optimal, `Optimal config for ${constellation.id}`).not.toBeNull();
      if (!optimal) continue;

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
          const h = starToHorizon(s, optimal.observer);
          cx += h.vector.x;
          cy += h.vector.y;
          cz += h.vector.z;
          count++;
        }
      });

      expect(count, `Star count for ${constellation.id}`).toBeGreaterThan(0);
      const len = Math.hypot(cx, cy, cz) || 1;
      const ny = cy / len;
      const altitudeDeg = Math.asin(Math.max(-1, Math.min(1, ny))) * (180 / Math.PI);

      console.log(`${constellation.id} (${constellation.nameZh}): alt=${altitudeDeg.toFixed(1)}°`);
      // Constellation center MUST be above the horizon (at least 15°)
      expect(altitudeDeg, `${constellation.nameZh} should be above horizon`).toBeGreaterThan(15);
    }
  });
});
