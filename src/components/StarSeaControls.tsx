"use client";

import { Globe2, Pause, Play, Rotate3d, Sparkles, Star, Waves } from "lucide-react";
import type { ConstellationDefinition, Observer } from "@/types/astronomy";
import {
  LATITUDE_PRESETS,
  TIMEZONE_PRESETS,
  observerDateValue,
} from "@/data/defaultObserver";

export default function StarSeaControls({
  observer,
  constellations,
  selectedId,
  onSelect,
  onDateChange,
  waveMode,
  onToggleWaveMode,
  isPlaying,
  onTogglePlay,
  selectedTimezone,
  onTimezoneChange,
  selectedLatitude,
  onLatitudeChange,
}: {
  observer: Observer;
  constellations: ConstellationDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDateChange: (value: string) => void;
  waveMode: "calm" | "rippled";
  onToggleWaveMode: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedTimezone: string;
  onTimezoneChange: (tzId: string) => void;
  selectedLatitude: string;
  onLatitudeChange: (latId: string) => void;
}) {
  const selected = constellations.find((item) => item.id === selectedId);

  return (
    <div className="star-sea-panel pointer-events-auto absolute bottom-12 left-1/2 z-20 w-[min(94vw,840px)] -translate-x-1/2 rounded-2xl p-3 text-left text-white/85 shadow-2xl shadow-black/40 sm:bottom-10 sm:p-4 backdrop-blur-md">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <Rotate3d size={13} aria-hidden="true" />
          <span>全天自由星野视角</span>
        </div>

        {/* Sea State Toggle Button */}
        <button
          type="button"
          onClick={onToggleWaveMode}
          title="切换海面状态：镜面平静或微波起伏"
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan transition-all hover:border-cyan/60 hover:bg-cyan/20"
        >
          {waveMode === "calm" ? (
            <>
              <Sparkles size={13} aria-hidden="true" className="animate-pulse" />
              <span>海面：平静倒影 (水天一色)</span>
            </>
          ) : (
            <>
              <Waves size={13} aria-hidden="true" />
              <span>海面：微波起伏 (柔波轻抚)</span>
            </>
          )}
        </button>

        {/* Coordinate indicator */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/60">
          <Globe2 size={13} aria-hidden="true" />
          <span>{observer.label}</span>
        </div>
      </div>

      {/* Main Interaction Controls Grid */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr_1.5fr] sm:items-end">
        {/* Constellation Selector */}
        <label className="grid gap-1 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-cyan" />
            <span>星宿天区 (选择跳转)</span>
          </span>
          <select
            aria-label="选择星宿天区"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className="min-h-10 rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors focus:border-cyan"
          >
            <option value="">探索全天星图 (未指定)</option>
            {constellations.map((constellation) => (
              <option key={constellation.id} value={constellation.id}>
                {constellation.nameZh} / {constellation.nameEn}
              </option>
            ))}
          </select>
        </label>

        {/* Timezone Selector */}
        <label className="grid gap-1 text-xs text-white/70">
          <span>观测经度 / 时区</span>
          <select
            aria-label="选择观测时区"
            value={selectedTimezone}
            onChange={(event) => onTimezoneChange(event.target.value)}
            className="min-h-10 rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors focus:border-cyan"
          >
            {TIMEZONE_PRESETS.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.name}
              </option>
            ))}
          </select>
        </label>

        {/* Latitude Selector */}
        <label className="grid gap-1 text-xs text-white/70">
          <span>观测纬度带</span>
          <select
            aria-label="选择观测纬度"
            value={selectedLatitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            className="min-h-10 rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors focus:border-cyan"
          >
            {LATITUDE_PRESETS.map((lat) => (
              <option key={lat.id} value={lat.id}>
                {lat.nameZh}
              </option>
            ))}
          </select>
        </label>

        {/* Time & Playback Controls */}
        <div className="grid gap-1 text-xs text-white/70">
          <span>观测时间 & 流转</span>
          <div className="flex items-center gap-1.5">
            <input
              aria-label="观测时间"
              type="datetime-local"
              value={observerDateValue(observer)}
              onChange={(event) => onDateChange(event.target.value)}
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-2 text-xs text-white outline-none transition-colors focus:border-cyan"
            />
            <button
              type="button"
              onClick={onTogglePlay}
              title={isPlaying ? "暂停星穹流转" : "启动星穹自动流转"}
              aria-label={isPlaying ? "暂停星穹流转" : "启动星穹自动流转"}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all ${
                isPlaying
                  ? "border-cyan bg-cyan/25 text-white shadow-md shadow-cyan/20"
                  : "border-white/15 bg-white/5 text-white/80 hover:border-white/35 hover:text-white"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause size={13} />
                  <span className="hidden xs:inline">暂停</span>
                </>
              ) : (
                <>
                  <Play size={13} />
                  <span className="hidden xs:inline">流转</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Feedback info */}
      <div aria-live="polite" className="mt-2.5 min-h-5 text-xs text-cyan/90">
        {selected ? (
          <span className="inline-flex items-center gap-2 font-medium">
            <Star size={13} aria-hidden="true" className="text-cyan" />
            <span>
              已对准【{selected.nameZh} / {selected.nameEn}】· {selected.descriptionZh || selected.descriptionEn}
            </span>
          </span>
        ) : (
          <span className="text-white/60">
            拖拽星空自由漫游；点击星宿即可自动推拉平移镜头对准该天穹；点击“流转”可观测恒星周日视运动。
          </span>
        )}
      </div>
    </div>
  );
}
