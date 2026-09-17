"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, Globe2, Pause, Play, Rotate3d, RotateCcw, Sparkles, Star, Waves } from "lucide-react";
import type { CloudSettings, ConstellationDefinition, Observer } from "@/types/astronomy";
import {
  LATITUDE_PRESETS,
  TIMEZONE_PRESETS,
  observerDateValue,
} from "@/data/defaultObserver";
import { CONSTELLATION_OPTIMAL_MAP } from "@/lib/astronomy/constellationFocus";
import DarkDateTimePicker from "./DarkDateTimePicker";

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
  playSpeed = 1,
  onPlaySpeedChange,
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
  playSpeed?: number;
  onPlaySpeedChange?: (speed: number) => void;
  selectedTimezone: string;
  onTimezoneChange: (tzId: string) => void;
  selectedLatitude: string;
  onLatitudeChange: (latId: string) => void;
  cloudSettings: CloudSettings;
  onCloudSettingsChange: (settings: CloudSettings) => void;
}) {
  const [showCloudPopover, setShowCloudPopover] = useState(false);
  const descriptionScrollRef = useRef<HTMLDivElement>(null);
  const selected = constellations.find((item) => item.id === selectedId);
  const optimalInfo = selectedId ? CONSTELLATION_OPTIMAL_MAP[selectedId] : null;

  // Translate vertical mouse wheel scrolling into horizontal scroll on description row
  useEffect(() => {
    const el = descriptionScrollRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && e.deltaY !== 0) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative);
    };
  }, []);

  // When switching constellations, reset description scroll position to start
  useEffect(() => {
    if (descriptionScrollRef.current) {
      descriptionScrollRef.current.scrollLeft = 0;
    }
  }, [selectedId]);

  return (
    <div className="star-sea-panel pointer-events-auto absolute bottom-12 left-1/2 z-20 w-[min(94vw,840px)] -translate-x-1/2 rounded-2xl p-3 text-left text-white/85 shadow-2xl shadow-black/40 sm:bottom-10 sm:p-4 backdrop-blur-md">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/55">
          <Rotate3d size={13} aria-hidden="true" />
          <span>全天自由星野视角</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Full Sky View Button (placed to the left of Clouds & Sea) */}
          {selectedId && (
            <button
              type="button"
              onClick={() => onSelect("")}
              title="重置全天视角（退出当前星宿特写）"
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan/40 bg-black/40 px-3 py-1 text-xs font-medium text-cyan transition-all hover:border-cyan hover:bg-cyan/15 hover:text-white cursor-pointer shadow-sm shadow-cyan/10"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>重置全天视角</span>
            </button>
          )}

          {/* Cloud Settings Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCloudPopover((prev) => !prev)}
              title="调整天幕云雾薄厚与位置"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                showCloudPopover
                  ? "border-cyan bg-black/60 text-white shadow-lg shadow-cyan/20"
                  : "border-white/15 bg-black/40 text-white/90 hover:border-cyan hover:text-white"
              }`}
            >
              <Cloud size={13} aria-hidden="true" className={showCloudPopover ? "text-cyan" : "text-white/70"} />
              <span>
                云雾: {cloudSettings.density === 0 ? "晴空无云" : `${Math.round(cloudSettings.density * 50)}%`}
              </span>
            </button>

            {/* Cloud Settings Popover Panel */}
            {showCloudPopover && (
              <div className="absolute bottom-full left-1/2 z-30 mb-2.5 w-72 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-950/95 p-3.5 text-xs shadow-2xl backdrop-blur-xl sm:left-0 sm:translate-x-0">
                <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2 font-medium text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Cloud size={14} className="text-cyan" />
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
                    <span className="font-mono text-cyan">
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
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-cyan"
                  />
                </div>

                {/* Altitude / Elevation */}
                <div className="mb-2.5">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>仰角高度 / 位置</span>
                    <span className="font-mono text-cyan">
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
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-cyan"
                  />
                </div>

                {/* Coverage */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-[11px] text-white/70">
                    <span>覆盖范围</span>
                    <span className="font-mono text-cyan">
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
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-white/15 accent-cyan"
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
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-white/90 transition-all hover:border-cyan hover:text-white cursor-pointer"
          >
            {waveMode === "calm" ? (
              <>
                <Sparkles size={13} aria-hidden="true" className="text-white/70 animate-pulse" />
                <span>海面：平静倒影 (水天一色)</span>
              </>
            ) : (
              <>
                <Waves size={13} aria-hidden="true" className="text-white/70" />
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
      <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_0.95fr_1.05fr_auto] sm:items-end">
        {/* Constellation Selector */}
        <label className="grid gap-1 text-xs text-white/70 min-w-0">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-cyan shrink-0" />
            <span className="truncate">星宿天区 (选择跳转)</span>
          </span>
          <select
            aria-label="选择星宿天区"
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="min-h-10 w-full min-w-0 truncate rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
          >
            <option value="" className="bg-[#0b1324] text-white">探索全天星图 (未指定)</option>
            {constellations.map((constellation) => (
              <option key={constellation.id} value={constellation.id} className="bg-[#0b1324] text-white">
                {constellation.nameZh} / {constellation.nameEn}
              </option>
            ))}
          </select>
        </label>

        {/* Observation Timezone */}
        <label className="grid gap-1 text-xs text-white/70 min-w-0">
          <span className="truncate">观测经度 / 时区</span>
          <select
            aria-label="选择观测时区"
            value={selectedTimezone}
            onChange={(event) => onTimezoneChange(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="min-h-10 w-full min-w-0 truncate rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
          >
            {TIMEZONE_PRESETS.map((tz) => (
              <option key={tz.id} value={tz.id} className="bg-[#0b1324] text-white">
                {tz.name}
              </option>
            ))}
          </select>
        </label>

        {/* Observation Latitude */}
        <label className="grid gap-1 text-xs text-white/70 min-w-0">
          <span className="truncate">观测纬度带</span>
          <select
            aria-label="选择观测纬度"
            value={selectedLatitude}
            onChange={(event) => onLatitudeChange(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="min-h-10 w-full min-w-0 truncate rounded-xl border border-white/15 bg-black/40 px-2.5 text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
          >
            {LATITUDE_PRESETS.map((lat) => (
              <option key={lat.id} value={lat.id} className="bg-[#0b1324] text-white">
                {lat.nameZh}
              </option>
            ))}
          </select>
        </label>

        {/* Date & Time with Playback Streamer - Compact Style */}
        <div className="grid gap-1 text-xs text-white/70 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">观测时间 & 流转</span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] text-cyan animate-pulse shrink-0">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan"></span>
                恒星日流转 ({playSpeed}x)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <DarkDateTimePicker
              value={observerDateValue(observer)}
              onChange={onDateChange}
            />
            {/* Speed Multiplier Dropdown */}
            <select
              aria-label="选择播放倍速"
              value={playSpeed}
              onChange={(e) => onPlaySpeedChange?.(Number(e.target.value))}
              title={`流转倍速：${playSpeed}x（每秒流转 ${playSpeed} 分钟）`}
              style={{ colorScheme: "dark" }}
              className="min-h-10 shrink-0 rounded-xl border border-white/15 bg-black/40 px-2 text-xs font-medium text-cyan outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
            >
              <option value={1} className="bg-[#0b1324] text-white">1x (1分/秒)</option>
              <option value={2} className="bg-[#0b1324] text-white">2x (2分/秒)</option>
              <option value={5} className="bg-[#0b1324] text-white">5x (5分/秒)</option>
              <option value={10} className="bg-[#0b1324] text-white">10x (10分/秒)</option>
              <option value={30} className="bg-[#0b1324] text-white">30x (30分/秒)</option>
              <option value={60} className="bg-[#0b1324] text-white">60x (1小时/秒)</option>
            </select>
            <button
              type="button"
              onClick={onTogglePlay}
              title={isPlaying ? "暂停流转" : `开启时间流转 (${playSpeed}x，每秒流转 ${playSpeed} 分钟)`}
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

      {/* Bottom Contextual Description Row (Fixed-height, zero-jump, wheel-scrollable, hidden scrollbar) */}
      <div className="mt-2.5 min-w-0 border-t border-white/10 pt-2">
        <div
          ref={descriptionScrollRef}
          title={
            selected
              ? `${selected.nameZh} / ${selected.nameEn}：${selected.descriptionZh}（可使用鼠标滚轮横向滚动浏览）`
              : undefined
          }
          className="no-scrollbar flex h-6 min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-white/70 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {selected ? (
            <>
              <span className="shrink-0 font-semibold text-white">
                已对准【{selected.nameZh} / {selected.nameEn}】
              </span>
              {optimalInfo && (
                <span className="shrink-0 rounded-full border border-cyan/40 bg-cyan/15 px-2.5 py-0.5 text-[11px] font-medium leading-none text-cyan shadow-sm shadow-cyan/10">
                  已自动跳转至【{optimalInfo.optimalLatitudeNameZh} · {optimalInfo.seasonNameZh}】最佳视界
                </span>
              )}
              <span className="shrink-0 text-white/60">：{selected.descriptionZh}</span>
            </>
          ) : (
            <span className="shrink-0 text-[11px] text-white/45">
              拖拽星空自由漫游；选择星宿天区可自动跳转至最佳观测经纬度与时间并将镜头居中对准；点击“流转”可观测恒星周日视运动。
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
