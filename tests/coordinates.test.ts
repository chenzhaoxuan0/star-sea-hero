import { describe, expect, it } from "vitest";
import { DEFAULT_OBSERVER } from "@/data/defaultObserver";
import { starToHorizon, horizonToVector } from "@/lib/astronomy/coordinates";
import { validateObserver } from "@/lib/astronomy/observer";

describe("astronomy coordinate conversion", () => {
  it("returns a stable position for a fixed star and observer", () => {
    const star = { raHours: 2.5303, decDegrees: 89.264 };
    const first = starToHorizon(star, DEFAULT_OBSERVER);
    const second = starToHorizon(star, DEFAULT_OBSERVER);

    expect(first.azimuth).toBe(second.azimuth);
    expect(first.altitude).toBe(second.altitude);
  });

  it("maps north horizon to negative Z and zenith to positive Y", () => {
    expect(horizonToVector(0, 0).z).toBeCloseTo(-42, 8);
    expect(horizonToVector(0, 90).y).toBeCloseTo(42, 8);
    expect(horizonToVector(0, 90).z).toBeCloseTo(0, 8);
  });

  it("rejects invalid geographic coordinates", () => {
    expect(() =>
      validateObserver({ ...DEFAULT_OBSERVER, latitude: 91 }),
    ).toThrow(RangeError);
    expect(() =>
      validateObserver({ ...DEFAULT_OBSERVER, longitude: 181 }),
    ).toThrow(RangeError);
  });
});
