import { describe, expect, it } from "vitest";
import {
  chooseMilkyWayLadder,
  estimateTextureVRAM,
  type MilkyWayTier,
} from "@/lib/rendering/milkyWayTexture";

const DESKTOP = { viewportWidth: 1920, maxTextureSize: 16384 };
const PHONE = { viewportWidth: 390, maxTextureSize: 16384 };

function has(ladder: MilkyWayTier[], tier: MilkyWayTier) {
  return ladder.includes(tier);
}

describe("Milky Way progressive ladder", () => {
  it("always offers a small encode so the galaxy is never missing", () => {
    const ladder = chooseMilkyWayLadder({ ...PHONE, hints: { saveData: true } });
    expect(ladder[0]).toBe("1k");
    expect(has(ladder, "2k")).toBe(true);
  });

  it("keeps the ladder ordered smallest first", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "4g", downlink: 100, deviceMemory: 16 },
    });
    expect(ladder).toEqual(["1k", "2k", "4k", "8k"]);
  });

  it("drops 4K and 8K on a slow link", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "3g", downlink: 1.5 },
    });
    expect(has(ladder, "4k")).toBe(false);
    expect(has(ladder, "8k")).toBe(false);
  });

  it("honours an explicit data-saver preference but still shows the galaxy", () => {
    // A data-saver user asked to be frugal, so 4K (3.15MB) and 8K (7MB) are both
    // withheld. 1K + 2K is ~183KB and still renders the full galaxy, just softer.
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { saveData: true, effectiveType: "4g", downlink: 50 },
    });
    expect(ladder).toEqual(["1k", "2k"]);
  });

  it("never offers 8K on a small viewport even on a fast link", () => {
    const ladder = chooseMilkyWayLadder({
      ...PHONE,
      hints: { effectiveType: "4g", downlink: 100, deviceMemory: 16 },
    });
    expect(has(ladder, "4k")).toBe(false);
    expect(has(ladder, "8k")).toBe(false);
  });

  it("never offers 8K when the GPU cannot hold it", () => {
    const ladder = chooseMilkyWayLadder({
      viewportWidth: 1920,
      maxTextureSize: 4096,
      hints: { effectiveType: "4g", downlink: 100, deviceMemory: 16 },
    });
    expect(has(ladder, "4k")).toBe(true);
    expect(has(ladder, "8k")).toBe(false);
  });

  it("never offers 8K on a device with too little memory", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "4g", downlink: 100, deviceMemory: 4 },
    });
    expect(has(ladder, "8k")).toBe(false);
  });

  it("assumes an unknown link is not a slow link", () => {
    const ladder = chooseMilkyWayLadder(DESKTOP);
    expect(has(ladder, "4k")).toBe(true);
  });

  it("models 8K as ~179MB of VRAM versus ~45MB for 4K", () => {
    expect(estimateTextureVRAM(8192)).toBeGreaterThan(170 * 1024 * 1024);
    expect(estimateTextureVRAM(4096)).toBeGreaterThan(40 * 1024 * 1024);
    expect(estimateTextureVRAM(4096)).toBeLessThan(estimateTextureVRAM(8192) / 3);
  });
});
