import * as THREE from "three";

/**
 * Progressive Milky Way panorama delivery.
 *
 * The 8K all-sky panorama is ~7 MB as a single file. Requesting it directly means the
 * sky dome renders with no galaxy at all until the whole file lands, because the
 * uniform is bound to an empty texture meanwhile and there is no partial decode.
 * Instead we walk a ladder of progressively larger encodes, binding each one as soon
 * as it arrives: the 1K (~31 KB) is on screen almost immediately, and the 8K is only
 * ever requested for connections and GPUs that can absorb it.
 */
export type MilkyWayTier = "1k" | "2k" | "4k" | "8k";

/** Ordered smallest to largest; also the order the ladder always climbs. */
export const MILKY_WAY_TIER_ORDER: MilkyWayTier[] = ["1k", "2k", "4k", "8k"];

/** Everything up to and including `tier`. */
export function milkyWayTiersUpTo(tier: MilkyWayTier): MilkyWayTier[] {
  const index = MILKY_WAY_TIER_ORDER.indexOf(tier);
  return MILKY_WAY_TIER_ORDER.slice(0, index + 1);
}

export const MILKY_WAY_TEXTURES: Record<MilkyWayTier, string> = {
  "1k": "/textures/milkyway_1k_eq.webp",
  "2k": "/textures/milkyway_2k_eq.webp",
  "4k": "/textures/milkyway_4k_eq.webp",
  "8k": "/textures/milkyway_8k_eq.webp",
};

/** Encoded width of each tier, used for the GPU budget estimate. */
export const MILKY_WAY_TIER_WIDTH: Record<MilkyWayTier, number> = {
  "1k": 1024,
  "2k": 2048,
  "4k": 4096,
  "8k": 8192,
};

/**
 * Exact encoded size of each tier, used to decide whether climbing to the next one is
 * worth it before the request is issued. When the server reports a real Content-Length
 * the observed value is preferred over these.
 */
export const MILKY_WAY_TIER_BYTES: Record<MilkyWayTier, number> = {
  "1k": 31_808,
  "2k": 156_040,
  "4k": 3_301_376,
  "8k": 7_334_784,
};

/**
 * Longest we are willing to make a visitor wait for a background upgrade before the
 * last already-good-enough encode is kept instead. At 4s the 8K needs roughly 1.9 MB/s
 * to qualify, which is a reasonable bar for a ~7 MB asset.
 */
export const MILKY_WAY_UPGRADE_BUDGET_MS = 4000;

export type MilkyWayLoadPhase = "downloading" | "ready";

export type MilkyWayProgress = {
  tier: MilkyWayTier;
  phase: MilkyWayLoadPhase;
  /** Bytes received so far, or 0 when the server sent no Content-Length. */
  loaded: number;
  /** Total bytes expected, or 0 when unknown. */
  total: number;
};

type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
};

type NavigatorWithHints = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
};

/** Reads Network Information API hints. Every field is optional by spec. */
export function readNetworkHints(): {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
  deviceMemory?: number;
} {
  if (typeof navigator === "undefined") return {};
  const nav = navigator as NavigatorWithHints;
  const conn = nav.connection;
  return {
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    saveData: conn?.saveData,
    deviceMemory: nav.deviceMemory,
  };
}

/**
 * Approximate VRAM cost of a decoded equirect texture including its mipmap chain.
 * Browsers keep these as RGBA8 (4 bytes/texel) regardless of the source being an
 * RGB WebP, and the full chain adds roughly a third on top of the base level.
 */
export function estimateTextureVRAM(width: number): number {
  const bytesPerPixel = 4;
  const base = width * (width / 2) * bytesPerPixel;
  return Math.round(base * 1.3333);
}

/**
 * Decides the maximum ladder worth attempting, smallest first.
 *
 * This runs once, before anything has been downloaded, so it may only use signals that
 * are trustworthy at that moment. In particular it ignores `navigator.connection.downlink`:
 * Chrome seeds that with a pessimistic estimate (1.44 Mbps is its classic default) on a
 * cold load and only ratchets it upward as it measures, while also clamping it at 10. A
 * first-load gate built on it classifies fast connections as slow ones and strands the
 * visitor on the 1K encode. Real throughput is measured instead, by
 * `shouldClimbToTier`, once bytes have actually moved.
 *
 * `1k` and `2k` together are under 200 KB, so they are always offered: they are what
 * makes the galaxy visible at all on a cold load.
 */
export function chooseMilkyWayLadder(options: {
  viewportWidth: number;
  maxTextureSize: number;
  hints?: {
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
    deviceMemory?: number;
  };
}): MilkyWayTier[] {
  const { viewportWidth, maxTextureSize, hints = {} } = options;
  const ladder: MilkyWayTier[] = ["1k", "2k"];

  // Only 2G and slower are trusted as a hard stop. Chrome's effective-type
  // classification is coarse and reports plenty of ordinary broadband as "3g", so
  // capping there stranded visitors on a 1024-wide encode that reads as permanently
  // blurry. 3G still gets the 4K, and the measured-throughput gate then decides about
  // the 8K from how long that 4K actually took.
  const hopelessLink =
    hints.saveData === true ||
    hints.effectiveType === "slow-2g" ||
    hints.effectiveType === "2g";

  if (!hopelessLink && viewportWidth >= 640 && MILKY_WAY_TIER_WIDTH["4k"] <= maxTextureSize) {
    ladder.push("4k");
  }

  // 8K costs ~7 MB on the wire and ~179 MB of VRAM once decoded and mipmapped. Whether
  // the link can absorb that is decided later by measurement, not guessed now; here we
  // only rule out the cases that make it pointless regardless of speed.
  const memoryOk = typeof hints.deviceMemory !== "number" || hints.deviceMemory >= 8;

  if (
    ladder.includes("4k") &&
    memoryOk &&
    viewportWidth >= 1200 &&
    MILKY_WAY_TIER_WIDTH["8k"] <= maxTextureSize &&
    estimateTextureVRAM(MILKY_WAY_TIER_WIDTH["8k"]) <= 256 * 1024 * 1024
  ) {
    ladder.push("8k");
  }

  return ladder;
}

/**
 * Smallest transfer worth extrapolating a link speed from.
 *
 * A 31KB or 156KB file completes in roughly one round trip, so its bytes-per-millisecond
 * measures latency rather than bandwidth and would read as an extremely slow link no
 * matter how fast the connection actually is. Only rungs at or above this size are used
 * as a throughput sample; below it the gate declines to extrapolate and lets the request
 * run.
 */
export const MILKY_WAY_MIN_SAMPLE_BYTES = 1024 * 1024;

/**
 * Runtime gate between rungs, driven by throughput actually observed on this connection.
 *
 * `bytesSoFar` / `msSoFar` must describe a bandwidth-dominated transfer (see
 * `MILKY_WAY_MIN_SAMPLE_BYTES`). The next tier is only worth starting if the measured
 * rate would deliver it inside the budget.
 */
export function shouldClimbToTier(options: {
  nextTier: MilkyWayTier;
  bytesSoFar: number;
  msSoFar: number;
  budgetMs?: number;
}): boolean {
  const { nextTier, bytesSoFar, msSoFar, budgetMs = MILKY_WAY_UPGRADE_BUDGET_MS } = options;
  if (msSoFar <= 0 || bytesSoFar < MILKY_WAY_MIN_SAMPLE_BYTES) return true;

  const bytesPerMs = bytesSoFar / msSoFar;
  return MILKY_WAY_TIER_BYTES[nextTier] / bytesPerMs <= budgetMs;
}

/**
 * Loads one tier with byte-level progress and real error reporting.
 *
 * Uses THREE.TextureLoader on purpose: it decodes through an HTMLImageElement, which
 * is the exact path the project already shipped. Switching to createImageBitmap for an
 * off-main-thread decode would flip the vertical orientation of the equirect map
 * depending on browser, which silently mirrors the galactic centre into the wrong
 * hemisphere. Correct orientation is worth more than a decode hitch that only happens
 * on the fast-path 8K load.
 */
export function loadMilkyWayTexture(
  tier: MilkyWayTier,
  options: {
    maxAnisotropy: number;
    onProgress?: (progress: MilkyWayProgress) => void;
  },
): Promise<{ texture: THREE.Texture; bytes: number }> {
  const { maxAnisotropy, onProgress } = options;
  const loader = new THREE.TextureLoader();
  // Last observed progress, kept so the resolved byte count survives a server that
  // omits Content-Length and therefore reports event.total as 0.
  let observedBytes = 0;

  return new Promise<{ texture: THREE.Texture; bytes: number }>((resolve, reject) => {
    loader.load(
      MILKY_WAY_TEXTURES[tier],
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        // Never exceed what the device reports: mobile GPUs commonly cap at 1-4x and
        // an over-request just wastes filtering work without improving the result.
        texture.anisotropy = Math.min(16, Math.max(1, maxAnisotropy));
        onProgress?.({ tier, phase: "ready", loaded: 0, total: 0 });
        resolve({
          texture,
          bytes: observedBytes > 0 ? observedBytes : MILKY_WAY_TIER_BYTES[tier],
        });
      },
      (event) => {
        if (event.loaded > 0) observedBytes = event.loaded;
        onProgress?.({
          tier,
          phase: "downloading",
          loaded: event.loaded,
          total: event.total || 0,
        });
      },
      (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
