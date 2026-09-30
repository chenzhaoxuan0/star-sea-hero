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
 * Decides which encodes to fetch, smallest first.
 *
 * `1k` and `2k` together are under 200 KB, so they are always offered: they are what
 * makes the galaxy visible on a cold load. `4k` and `8k` are gated on the network and
 * on the GPU, because both cost far more in download time and VRAM than they add in
 * visible detail on a ~62 degree FOV sky dome.
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

  const effectiveType = hints.effectiveType;
  const downlink = hints.downlink;
  const slowLink =
    hints.saveData === true ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g" ||
    (typeof downlink === "number" && downlink > 0 && downlink < 3);

  // 4K is the practical ceiling for detail; it stays on for ordinary connections and
  // is dropped for data-saver users, slow links and small screens.
  if (!slowLink && viewportWidth >= 640 && MILKY_WAY_TIER_WIDTH["4k"] <= maxTextureSize) {
    ladder.push("4k");
  }

  // 8K costs ~7 MB on the wire and ~179 MB of VRAM once decoded and mipmapped.
  // Only request it when the link, the viewport, the GPU limit and device memory all
  // agree that it is affordable.
  const fastLink =
    !hints.saveData &&
    (effectiveType === "4g" || (typeof downlink === "number" && downlink >= 10)) &&
    !(typeof downlink === "number" && downlink < 10);
  const memoryOk = typeof hints.deviceMemory !== "number" || hints.deviceMemory >= 8;

  if (
    ladder.includes("4k") &&
    fastLink &&
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
): Promise<THREE.Texture> {
  const { maxAnisotropy, onProgress } = options;
  const loader = new THREE.TextureLoader();

  return new Promise<THREE.Texture>((resolve, reject) => {
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
        resolve(texture);
      },
      (event) => {
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
