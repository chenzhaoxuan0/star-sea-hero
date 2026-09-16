"use client";

import { LocateFixed, Rotate3d, Star, Waves } from "lucide-react";
import type { ConstellationDefinition, Observer } from "@/types/astronomy";
import { observerDateValue } from "@/data/defaultObserver";

export default function StarSeaControls({
  observer,
  constellations,
  selectedId,
  onSelect,
  onDateChange,
  onLocate,
}: {
  observer: Observer;
  constellations: ConstellationDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDateChange: (value: string) => void;
  onLocate: () => void;
}) {
  const selected = constellations.find((item) => item.id === selectedId);

  return (
    <div className="star-sea-panel pointer-events-auto absolute bottom-20 left-1/2 z-20 w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl p-3 text-left text-white/80 shadow-2xl shadow-black/30 sm:bottom-16 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <Rotate3d size={14} aria-hidden="true" />
          <span>Free sky exploration</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
          <Waves size={14} aria-hidden="true" />
          <span>{observer.label}</span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1.5 text-xs text-white/65">
          <span>Constellation</span>
          <select
            aria-label="选择星宿"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="min-h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-cyan"
          >
            <option value="">Select a constellation</option>
            {constellations.map((constellation) => (
              <option key={constellation.id} value={constellation.id}>
                {constellation.nameZh} / {constellation.nameEn}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs text-white/65">
          <span>Observation time</span>
          <input
            aria-label="观测时间"
            type="datetime-local"
            value={observerDateValue(observer)}
            onChange={(event) => onDateChange(event.target.value)}
            className="min-h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-cyan"
          />
        </label>

        <button
          type="button"
          onClick={onLocate}
          title="使用当前位置"
          aria-label="使用当前位置"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/75 transition-colors hover:border-white/30 hover:text-white"
        >
          <LocateFixed size={15} aria-hidden="true" />
          <span>Use location</span>
        </button>
      </div>

      <div aria-live="polite" className="mt-3 min-h-5 text-xs text-cyan/85">
        {selected ? (
          <span className="inline-flex items-center gap-2">
            <Star size={13} aria-hidden="true" />
            {selected.nameZh} / {selected.nameEn} · {selected.descriptionEn}
          </span>
        ) : (
          "Drag the sky to look around. Choose a constellation to highlight it."
        )}
      </div>
    </div>
  );
}
