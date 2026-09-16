"use client";

import { useState } from "react";
import { Cloud, Globe2, Pause, Play, Rotate3d, Sparkles, Star, Waves } from "lucide-react";
import type { CloudSettings, ConstellationDefinition, Observer } from "@/types/astronomy";
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
  cloudSettings,
  onCloudSettingsChange,
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
  cloudSettings: CloudSettings;
  onCloudSettingsChange: (settings: CloudSettings) => void;
}) {
  const [showCloudPopover, setShowCloudPopover] = useState(false);
  const selected = constellations.find((item) => item.id === selectedId);

  return (
    <div className="star-sea-panel pointer-events-auto absolute bottom-12 left-1/2 z-20 w-[min(94vw,840px)] -translate-x-1/2 rounded-2xl p-3 text-left text-white/85 shadow-2xl shadow-black/40 sm:bottom-10 sm:p-4 backdrop-blur-md">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <Rotate3d size={13} aria-hidden="true" />
          <span>全天自由星野视角</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Settings Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCloudPopover((prev) => !prev)}
              title="调整天幕云雾薄厚与位置"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                showCloudPopover
                  ? "border-purple-400 bg-purple-500/30 text-purple-200 shadow-lg shadow-purple-900/40"
                  : "border-purple-400/30 bg-purple-500/10 text-purple-200 hover:border-purple-400/60 hover:bg-purple-500/20"
              }`}
            >
              <Cloud size={13} aria-hidden="true" />
              <span>
                云雾: {cloudSettings.density === 0 ? "晴空无云" : `${Math.round(cloudSettings.density * 50)}%`}
              </span>
            </button>

            {/* Cloud Settings Popover Panel */}
            {showCloudPopover && (
              <div className="absolute bottom-full left-1/2 z-30 mb-2.5 w-72 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-950/95 p-3.5 text-xs shadow-2xl backdrop-blur-xl sm:left-0 sm:translate-x-0">
                <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2 font-medium text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Cloud size={14} className="text-purple-400" />
                    <span>天穹夜雾与星云调节</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCloudPopover(false)}
                    className="px-1 text-xs text-white/40 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Density / Thickness */}
                <div className="mb-2.5">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>云雾薄厚 / 密度</span>
                    <span className="font-mono text-purple-300">
                      {cloudSettings.density === 0 ? "晴空无云" : `${Math.round(cloudSettings.density * 50)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={cloudSettings.density}
                    onChange={(e) =>
                      onCloudSettingsChange({
                        ...cloudSettings,
                        density: parseFloat(e.target.value),
                      })
                    }
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-purple-400"
                  />
                </div>

                {/* Altitude / Elevation */}
                <div className="mb-2.5">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>仰角高度 / 位置</span>
                    <span className="font-mono text-purple-300">
                      {cloudSettings.elevation < 0.2
                        ? "近海平线"
                        : cloudSettings.elevation < 0.45
                        ? "半空游云"
                        : "高穹卷云"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.75"
                    step="0.02"
                    value={cloudSettings.elevation}
                    onChange={(e) =>
                      onCloudSettingsChange({
                        ...cloudSettings,
                        elevation: parseFloat(e.target.value),
                      })
                    }
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-purple-400"
                  />
                </div>

                {/* Coverage */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>覆盖范围</span>
                    <span className="font-mono text-purple-300">
                      {Math.round(cloudSettings.coverage * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="1.0"
                    step="0.05"
                    value={cloudSettings.coverage}
                    onChange={(e) =>
                      onCloudSettingsChange({
                        ...cloudSettings,
                        coverage: parseFloat(e.target.value),
                      })
                    }
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-purple-400"
                  />
                </div>

                {/* Presets */}
                <div className="flex gap-1.5 border-t border-white/10 pt-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onCloudSettingsChange({ density: 0.0, elevation: 0.32, coverage: 0.4 })
                    }
                    className="flex-1 rounded bg-white/5 py-1 text-center text-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    晴朗明澈
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCloudSettingsChange({ density: 0.7, elevation: 0.32, coverage: 0.5 })
                    }
                    className="flex-1 rounded bg-white/5 py-1 text-center text-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    薄雾微云
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCloudSettingsChange({ density: 1.5, elevation: 0.38, coverage: 0.75 })
                    }
                    className="flex-1 rounded bg-white/5 py-1 text-center text-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    浓郁层云
                  </button>
                </div>
              </div>
            )}
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
        </div>

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

        {/* Observation Timezone */}
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

        {/* Observation Latitude */}
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

        {/* Date & Time with Playback Streamer */}
        <div className="grid gap-1 text-xs text-white/70">
          <div className="flex items-center justify-between">
            <span>观测时间 & 流转</span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] text-cyan animate-pulse">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan"></span>
                恒星日流转中
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              aria-label="调整观测时间"
              type="datetime-local"
              value={observerDateValue(observer)}
              onChange={(event) => onDateChange(event.target.value)}
              className="min-h-10 flex-1 rounded-xl border border-white/15 bg-black/40 px-2 text-xs text-white outline-none transition-colors focus:border-cyan"
            />
            <button
              type="button"
              onClick={onTogglePlay}
              title={isPlaying ? "暂停流转" : "开启时间流转"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                isPlaying
                  ? "border-cyan bg-cyan/20 text-cyan shadow-lg shadow-cyan/20"
                  : "border-white/15 bg-black/40 text-white/80 hover:border-cyan hover:text-cyan"
              }`}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="translate-x-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Constellation Contextual Description */}
      {selected ? (
        <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/60">
          <span>已对准【{selected.nameZh} / {selected.nameEn}】：{selected.descriptionZh}</span>
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-[11px] text-cyan hover:underline"
          >
            重置星空视线
          </button>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-white/45">
          拖拽星空自由漫游；点击星宿即可自动推拉平移镜头对准天穹；点击“流转”可观测恒星周日视运动。
        </div>
      )}
    </div>
  );
}
