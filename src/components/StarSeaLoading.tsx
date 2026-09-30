"use client";

export type StarSeaLoadingState = "initializing" | "interactive";

export type StarSeaUpgradeProgress = {
  /** Human-readable size of the encode being fetched, e.g. "8K". */
  label: string;
  /** 0-100, or null when the server sent no Content-Length. */
  percent: number | null;
};

const TIER_LABELS: Record<string, string> = {
  "1k": "1K",
  "2k": "2K",
  "4k": "4K",
  "8k": "8K",
};

export function describeMilkyWayProgress(
  tier: string,
  phase: "downloading" | "ready",
  loaded: number,
  total: number,
): StarSeaUpgradeProgress | null {
  if (phase === "ready") return null;
  return {
    label: TIER_LABELS[tier] ?? tier.toUpperCase(),
    percent: total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null,
  };
}

export default function StarSeaLoading({
  state,
  upgrade,
}: {
  state: StarSeaLoadingState;
  upgrade?: StarSeaUpgradeProgress | null;
}) {
  // Once the scene is interactive the blocking pill is gone, but a larger Milky Way
  // encode may still be streaming. Report it without covering the sky.
  if (state === "interactive") {
    if (!upgrade) return null;
    return (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center"
      >
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/55 backdrop-blur-md">
          <span className="h-1 w-1 animate-pulse rounded-full bg-cyan/80" />
          <span>Milky Way {upgrade.label}</span>
          {upgrade.percent !== null && <span>{upgrade.percent}%</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-label="正在加载交互星空"
      className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center"
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-white/65 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
        <span>Opening the sky</span>
      </div>
    </div>
  );
}
