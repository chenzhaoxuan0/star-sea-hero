import { describe, expect, it } from "vitest";
import {
  chooseMilkyWayLadder,
  estimateTextureVRAM,
  milkyWayTiersUpTo,
  shouldClimbToTier,
  MILKY_WAY_MIN_SAMPLE_BYTES,
  MILKY_WAY_TIER_BYTES,
  MILKY_WAY_TIER_ORDER,
  type MilkyWayTier,
} from "@/lib/rendering/milkyWayTexture";

const DESKTOP = { viewportWidth: 1920, maxTextureSize: 16384 };
const PHONE = { viewportWidth: 390, maxTextureSize: 16384 };
const MB = 1024 * 1024;

function has(ladder: MilkyWayTier[], tier: MilkyWayTier) {
  return ladder.includes(tier);
}

describe("adaptive ladder", () => {
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

  // Chrome's effective-type buckets are very wide: "3g" spans roughly 0.7-10 Mbps. Capping
  // at 2K for the whole bucket stranded plenty of normal connections on a 1024-wide
  // encode, which reads as a permanently blurry sky. The ladder is meant to degrade
  // gracefully, so 3G is allowed the 4K and the measured gate then rules on the 8K.
  it("lets a coarse 3g classification still reach 4K", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "3g", downlink: 1.5 },
    });
    expect(has(ladder, "4k")).toBe(true);
  });

  it("hard-stops at 2K on 2g, where 3.3MB would be a real burden", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "2g", downlink: 0.4 },
    });
    expect(ladder).toEqual(["1k", "2k"]);
  });

  it("hard-stops at 2K for a data-saver user even on a fast link", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { saveData: true, effectiveType: "4g", downlink: 100, deviceMemory: 16 },
    });
    expect(ladder).toEqual(["1k", "2k"]);
  });

  // chooseMilkyWayLadder answers "what is possible on this hardware and budget"; the
  // measured-throughput gate answers "what should actually be requested right now". So a
  // 3G-classified link can still list the 8K statically and rely on the gate to stop it
  // once the slow 4K timing comes back.
  it("leaves the 8K decision to the measured gate rather than to effectiveType", () => {
    const ladder = chooseMilkyWayLadder({
      ...DESKTOP,
      hints: { effectiveType: "3g", downlink: 10, deviceMemory: 8 },
    });
    expect(has(ladder, "4k")).toBe(true);
    // A 4K that took 10s is ~0.33MB/s, which projects to ~22s for the 8K.
    expect(
      shouldClimbToTier({ nextTier: "8k", bytesSoFar: 3_301_376, msSoFar: 10_000 }),
    ).toBe(false);
  });

  it("models 8K as ~179MB of VRAM versus ~45MB for 4K", () => {
    expect(estimateTextureVRAM(8192)).toBeGreaterThan(170 * MB);
    expect(estimateTextureVRAM(4096)).toBeGreaterThan(40 * MB);
    expect(estimateTextureVRAM(4096)).toBeLessThan(estimateTextureVRAM(8192) / 3);
  });

  it("orders tiers smallest first and slices them up to a ceiling", () => {
    expect(MILKY_WAY_TIER_ORDER).toEqual(["1k", "2k", "4k", "8k"]);
    expect(milkyWayTiersUpTo("4k")).toEqual(["1k", "2k", "4k"]);
    expect(milkyWayTiersUpTo("8k")).toEqual(["1k", "2k", "4k", "8k"]);
    expect(milkyWayTiersUpTo("1k")).toEqual(["1k"]);
  });
});

describe("explicit tier request", () => {
  // A click on the control *is* the decision, so preferences like data saver, link class
  // and viewport size are set aside. Hardware capability is not: a GPU that cannot hold
  // an 8192-wide texture fails the upload rather than serving a sharper sky.
  it("overrides preferences, including a narrow viewport", () => {
    const ladder = chooseMilkyWayLadder({
      viewportWidth: 420,
      maxTextureSize: 16384,
      hints: { effectiveType: "2g", saveData: true, deviceMemory: 2 },
      forcedTier: "8k",
    });
    expect(ladder).toEqual(["1k", "2k", "4k", "8k"]);
  });

  it("still refuses a tier the GPU cannot host", () => {
    const ladder = chooseMilkyWayLadder({
      viewportWidth: 1920,
      maxTextureSize: 4096,
      hints: {},
      forcedTier: "8k",
    });
    expect(ladder).toEqual(["1k", "2k", "4k"]);
  });

  it("stops at the requested tier rather than going further", () => {
    const ladder = chooseMilkyWayLadder({
      viewportWidth: 1920,
      maxTextureSize: 16384,
      hints: {},
      forcedTier: "4k",
    });
    expect(ladder).toEqual(["1k", "2k", "4k"]);
  });
});

describe("measured-throughput upgrade gate", () => {
  // Regression: the gate used to divide cumulative bytes by cumulative elapsed time, so
  // the 31KB first rung dominated the sample with its own round-trip latency. That read
  // as a ~0.06 MB/s link, projected ~52s for the 4K, and stopped the ladder dead after
  // 1K. Latency-bound transfers must not be used as a bandwidth sample.
  it("ignores a latency-bound sample and keeps climbing", () => {
    expect(shouldClimbToTier({ nextTier: "2k", bytesSoFar: 31_808, msSoFar: 316 })).toBe(true);
    expect(shouldClimbToTier({ nextTier: "4k", bytesSoFar: 156_040, msSoFar: 250 })).toBe(true);
  });

  it("only treats transfers at or above the minimum sample size as bandwidth samples", () => {
    expect(MILKY_WAY_MIN_SAMPLE_BYTES).toBe(MB);
    expect(MILKY_WAY_TIER_BYTES["4k"]).toBeGreaterThan(MILKY_WAY_MIN_SAMPLE_BYTES);
    expect(MILKY_WAY_TIER_BYTES["2k"]).toBeLessThan(MILKY_WAY_MIN_SAMPLE_BYTES);
  });

  it("climbs when the observed rate would deliver the next tier in budget", () => {
    // The 4K landed in 1.5s => ~2.2 MB/s, enough for the ~7MB 8K inside 4s.
    expect(shouldClimbToTier({ nextTier: "8k", bytesSoFar: 3_301_376, msSoFar: 1500 })).toBe(true);
  });

  it("stops climbing when the link is too slow to make the upgrade worthwhile", () => {
    // The 4K took 10s => ~0.33 MB/s, which would need ~22s for the 8K.
    expect(shouldClimbToTier({ nextTier: "8k", bytesSoFar: 3_301_376, msSoFar: 10_000 })).toBe(false);
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
    expect(shouldClimbToTier({ nextTier: "8k", bytesSoFar: fastEnough, msSoFar: window })).toBe(true);
    // The same window at ~1MB/s would need over 7s for the 8K, so we keep the 4K.
    expect(shouldClimbToTier({ nextTier: "8k", bytesSoFar: tooSlow, msSoFar: window })).toBe(false);
  });
});
