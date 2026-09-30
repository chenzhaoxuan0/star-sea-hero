import { describe, expect, it } from "vitest";
import {
  chooseMilkyWayLadder,
  estimateTextureVRAM,
  shouldClimbToTier,
  MILKY_WAY_TIER_BYTES,
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

  // Regression: Chrome seeds navigator.connection.downlink with a pessimistic estimate
  // (1.44 Mbps is its classic default) and only ratchets it up as it measures. Gating
  // the cold ladder on that number stranded desktop visitors on 1k/2k, which reads as
  // a permanently blurry sky rather than as a loading state.
  it("ignores a cold downlink estimate instead of stranding desktop on 1k/2k", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "4g", downlink: 1.44, deviceMemory: 8 },
    });
    expect(ladder).toEqual(["1k", "2k", "4k", "8k"]);
  });

  it("still honours an explicit 3g classification", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "3g", downlink: 10, deviceMemory: 8 },
    });
    expect(has(ladder, "4k")).toBe(false);
  });

  it("models 8K as ~179MB of VRAM versus ~45MB for 4K", () => {
    expect(estimateTextureVRAM(8192)).toBeGreaterThan(170 * 1024 * 1024);
    expect(estimateTextureVRAM(4096)).toBeGreaterThan(40 * 1024 * 1024);
    expect(estimateTextureVRAM(4096)).toBeLessThan(estimateTextureVRAM(8192) / 3);
  });
});

describe("measured-throughput upgrade gate", () => {
  const MB = 1024 * 1024;

  // Regression: the gate used to divide cumulative bytes by cumulative elapsed time, so
  // the 31KB first rung dominated the sample with its own round-trip latency. That read
  // as a ~0.06 MB/s link, projected ~52s for the 4K, and stopped the ladder dead after
  // 1K. Latency-bound transfers must not be used as a bandwidth sample.
  it("ignores a latency-bound sample and keeps climbing", () => {
    expect(
      shouldClimbToTier({ nextTier: "2k", bytesSoFar: 31_808, msSoFar: 316 }),
    ).toBe(true);
    expect(
      shouldClimbToTier({ nextTier: "4k", bytesSoFar: 156_040, msSoFar: 250 }),
    ).toBe(true);
  });

  it("climbs when the observed rate would deliver the next tier in budget", () => {
    // The 4K landed in 1.5s => ~2.2 MB/s, enough for the ~7MB 8K inside 4s.
    expect(
      shouldClimbToTier({ nextTier: "8k", bytesSoFar: 3_301_376, msSoFar: 1500 }),
    ).toBe(true);
  });

  it("stops climbing when the link is too slow to make the upgrade worthwhile", () => {
    // The 4K took 10s => ~0.33 MB/s, which would need ~22s for the 8K.
    expect(
      shouldClimbToTier({ nextTier: "8k", bytesSoFar: 3_301_376, msSoFar: 10_000 }),
    ).toBe(false);
  });

  it("stays optimistic when there is not yet a sample to extrapolate from", () => {
    expect(shouldClimbToTier({ nextTier: "8k", bytesSoFar: 0, msSoFar: 0 })).toBe(true);
  });

  it("puts the 8K rung at roughly 1.9MB/s of measured throughput", () => {
    const eightK = MILKY_WAY_TIER_BYTES["8k"];
    const window = 4000;
    const fastEnough = 7.6 * MB;
    const tooSlow = 4 * MB;
    expect(fastEnough / window).toBeGreaterThan(eightK / window);
    expect(
      shouldClimbToTier({ nextTier: "8k", bytesSoFar: fastEnough, msSoFar: window }),
    ).toBe(true);
    expect(
      shouldClimbToTier({ nextTier: "8k", bytesSoFar: tooSlow, msSoFar: window }),
    ).toBe(false);
  });
});
