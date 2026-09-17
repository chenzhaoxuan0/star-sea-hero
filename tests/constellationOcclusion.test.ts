import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { CONSTELLATIONS } from "@/data/constellations";
import { BRIGHT_STARS } from "@/data/stars";

describe("Constellation below-horizon occlusion logic", () => {
  it("clips line segments so no vertices have y < 0 when stars set below sea level", () => {
    // Simulate setting stars: some above horizon (y > 0), some submerged (y < 0)
    const simulatedStarPos = new Map<string, THREE.Vector3>();

    // Take Ursa Major as test case
    const uma = CONSTELLATIONS.find((c) => c.id === "ursa-major")!;
    expect(uma).toBeDefined();

    // Assign half the stars with negative altitude (submerged below water line)
    uma.segments.forEach(([a, b], idx) => {
      if (!simulatedStarPos.has(a)) {
        simulatedStarPos.set(a, new THREE.Vector3(100, idx % 2 === 0 ? 50 : -60, 200).normalize().multiplyScalar(418));
      }
      if (!simulatedStarPos.has(b)) {
        simulatedStarPos.set(b, new THREE.Vector3(120, idx % 3 === 0 ? -40 : 30, 180).normalize().multiplyScalar(418));
      }
    });

    const clippedLines: number[] = [];

    uma.segments.forEach(([fromId, toId]) => {
      const pFrom = simulatedStarPos.get(fromId)?.clone();
      const pTo = simulatedStarPos.get(toId)?.clone();
      if (!pFrom || !pTo) return;

      // Occlusion rule: If both stars are below sea level, omit segment completely
      if (pFrom.y <= 0.0 && pTo.y <= 0.0) return;

      // If one star has set into the sea, mathematically clip line segment at sea surface
      if (pFrom.y <= 0.0) {
        const t = (0.05 - pFrom.y) / (pTo.y - pFrom.y);
        pFrom.lerp(pTo, t);
        pFrom.y = 0.05;
      } else if (pTo.y <= 0.0) {
        const t = (0.05 - pTo.y) / (pFrom.y - pTo.y);
        pTo.lerp(pFrom, t);
        pTo.y = 0.05;
      }

      clippedLines.push(pFrom.x, pFrom.y, pFrom.z, pTo.x, pTo.y, pTo.z);
    });

    // Check that every single generated vertex has y >= 0
    expect(clippedLines.length).toBeGreaterThan(0);
    for (let i = 1; i < clippedLines.length; i += 3) {
      const y = clippedLines[i];
      expect(y, `Vertex y at index ${i} should be >= 0 (above sea level)`).toBeGreaterThanOrEqual(0);
    }
  });

  it("completely omits all segments when an entire constellation has set below the horizon", () => {
    const cyg = CONSTELLATIONS.find((c) => c.id === "cygnus")!;
    expect(cyg).toBeDefined();

    // All stars are set below the horizon (negative altitude)
    const simulatedSubmergedStars = new Map<string, THREE.Vector3>();
    cyg.segments.forEach(([a, b]) => {
      simulatedSubmergedStars.set(a, new THREE.Vector3(50, -80, 300).normalize().multiplyScalar(418));
      simulatedSubmergedStars.set(b, new THREE.Vector3(80, -120, 250).normalize().multiplyScalar(418));
    });

    const lines: number[] = [];
    cyg.segments.forEach(([fromId, toId]) => {
      const pFrom = simulatedSubmergedStars.get(fromId)?.clone();
      const pTo = simulatedSubmergedStars.get(toId)?.clone();
      if (!pFrom || !pTo) return;

      if (pFrom.y <= 0.0 && pTo.y <= 0.0) return;

      if (pFrom.y <= 0.0) {
        const t = (0.05 - pFrom.y) / (pTo.y - pFrom.y);
        pFrom.lerp(pTo, t);
        pFrom.y = 0.05;
      } else if (pTo.y <= 0.0) {
        const t = (0.05 - pTo.y) / (pFrom.y - pTo.y);
        pTo.lerp(pFrom, t);
        pTo.y = 0.05;
      }

      lines.push(pFrom.x, pFrom.y, pFrom.z, pTo.x, pTo.y, pTo.z);
    });

    // Zero line vertices should be emitted for an entirely submerged constellation
    expect(lines.length).toBe(0);
  });
});
