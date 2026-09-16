"use client";

export type StarSeaLoadingState = "poster" | "initializing" | "interactive";

export default function StarSeaLoading({
  state,
}: {
  state: StarSeaLoadingState;
}) {
  if (state === "interactive") return null;

  return (
    <div
      aria-live="polite"
      aria-label={state === "poster" ? "正在准备星空" : "正在加载交互星空"}
      className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center"
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] uppercase tracking-[0.26em] text-white/65 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
        <span>{state === "poster" ? "Preparing the sky" : "Opening the sky"}</span>
      </div>
    </div>
  );
}
