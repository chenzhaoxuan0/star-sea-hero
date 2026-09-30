"use client";

import { useEffect, useRef, useState } from "react";
import { Aperture, ChevronDown, Cloud, Eye, EyeOff, Globe2, Maximize2, Pause, Play, Rotate3d, RotateCcw, Sparkles, Star, Waves } from "lucide-react";
import type { CloudSettings, ConstellationDefinition, Observer } from "@/types/astronomy";
import type { MilkyWayTier } from "@/lib/rendering/milkyWayTexture";
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
  showCenterTitle = true,
  onToggleCenterTitle,
  isImmersive = false,
  onEnterImmersive,
  milkyWayTier = "auto",
  onCycleMilkyWayTier,
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
  showCenterTitle?: boolean;
  onToggleCenterTitle?: () => void;
  isImmersive?: boolean;
  onEnterImmersive?: () => void;
  milkyWayTier?: MilkyWayTier | "auto";
  onCycleMilkyWayTier?: () => void;
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
    <div
      className={`star-sea-panel absolute bottom-2 sm:bottom-10 left-1/2 z-20 w-[min(96vw,940px)] -translate-x-1/2 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left text-white/85 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-500 ${
        isImmersive
          ? "pointer-events-none opacity-0 translate-y-6 scale-95"
          : "pointer-events-auto opacity-100 translate-y-0 scale-100"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 border-b border-white/10 pb-1 sm:pb-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white/55 shrink-0">
          <span className="hidden xs:flex items-center gap-1">
            <Rotate3d size={12} aria-hidden="true" />
            <span className="hidden sm:inline">全天视角</span>
          </span>
          <span className="hidden sm:inline text-white/25">·</span>
          <span className="flex items-center gap-1 text-white/60">
            <Globe2 size={11} aria-hidden="true" />
            <span>{observer.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Reset Full Sky View Button */}
          {selectedId && (
            <button
              type="button"
              onClick={() => onSelect("")}
              title="重置全天视角（退出当前星宿特写）"
              className="inline-flex items-center gap-1 rounded-full border border-cyan/40 bg-black/40 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-cyan transition-all hover:border-cyan hover:bg-cyan/15 hover:text-white cursor-pointer shadow-sm shadow-cyan/10"
            >
              <RotateCcw size={11} aria-hidden="true" />
              <span>重置全天视角</span>
            </button>
          )}

          {/* Cloud Settings Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCloudPopover((prev) => !prev)}
              title="调整天幕云雾薄厚与位置"
              className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-all cursor-pointer ${
                showCloudPopover
                  ? "border-cyan bg-black/60 text-white shadow-lg shadow-cyan/20"
                  : "border-white/15 bg-black/40 text-white/90 hover:border-cyan hover:text-white"
              }`}
            >
              <Cloud size={11} aria-hidden="true" className={showCloudPopover ? "text-cyan" : "text-white/70"} />
              <span>
                云雾{cloudSettings.density === 0 ? ":晴" : `:${Math.round(cloudSettings.density * 50)}%`}
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
            title="切换海面状态：镜面平静 (水天一色) 或微波起伏 (柔波轻抚)"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-white/90 transition-all hover:border-cyan hover:text-white cursor-pointer"
          >
            {waveMode === "calm" ? (
              <>
                <Sparkles size={11} aria-hidden="true" className="text-white/70 animate-pulse" />
                <span>镜面</span>
              </>
            ) : (
              <>
                <Waves size={11} aria-hidden="true" className="text-white/70" />
                <span>微波</span>
              </>
            )}
          </button>

          {/* Center Title Toggle Button */}
          <button
            type="button"
            onClick={onToggleCenterTitle}
            title={showCenterTitle ? "隐藏画面中间的【星辰大海】标题文字" : "显示画面中间的【星辰大海】标题文字"}
            className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-all cursor-pointer ${
              !showCenterTitle
                ? "border-cyan/40 bg-cyan/15 text-cyan hover:border-cyan hover:text-white"
                : "border-white/15 bg-black/40 text-white/90 hover:border-cyan hover:text-white"
            }`}
          >
            {!showCenterTitle ? (
              <>
                <Eye size={11} aria-hidden="true" className="text-cyan" />
                <span>显示标题</span>
              </>
            ) : (
              <>
                <EyeOff size={11} aria-hidden="true" className="text-white/70" />
                <span>隐藏标题</span>
              </>
            )}
          </button>

          {/* Milky Way Resolution Cycle Button */}
          <button
            type="button"
            onClick={onCycleMilkyWayTier}
            title={
              milkyWayTier === "auto"
                ? "银河清晰度：自动（按实测网速渐进升级到 8K）"
                : `银河清晰度：已锁定 ${milkyWayTier.toUpperCase()}，点击恢复自动`
            }
            className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-all cursor-pointer ${
              milkyWayTier !== "auto"
                ? "border-cyan/40 bg-cyan/15 text-cyan hover:border-cyan hover:text-white"
                : "border-white/15 bg-black/40 text-white/90 hover:border-cyan hover:text-white"
            }`}
          >
            <Aperture size={11} aria-hidden="true" className={milkyWayTier !== "auto" ? "text-cyan" : "text-white/70"} />
            <span>银河 {milkyWayTier === "auto" ? "自动" : milkyWayTier.toUpperCase()}</span>
          </button>

          {/* Immersive Mode Button */}
          <button
            type="button"
            onClick={onEnterImmersive}
            title="完全隐藏全部UI界面，沉浸式观看星辰大海"
            className="inline-flex items-center gap-1 rounded-full border border-cyan/30 bg-black/40 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-cyan/90 transition-all hover:border-cyan hover:bg-cyan/15 hover:text-white cursor-pointer shadow-sm shadow-cyan/10"
          >
            <Maximize2 size={11} aria-hidden="true" className="text-cyan" />
            <span>沉浸模式</span>
          </button>
        </div>
      </div>

      {/* Main Interaction Controls Grid (Compressed 2-col on mobile, 4-col on desktop) */}
      <div className="mt-1 sm:mt-3 grid grid-cols-2 gap-1 sm:gap-2.5 sm:grid-cols-[1fr_0.95fr_1.05fr_auto] sm:items-end">
        {/* Constellation Selector: col-span-2 on mobile, 1 col on desktop */}
        <label className="col-span-2 sm:col-span-1 grid gap-0.5 sm:gap-1 min-w-0">
          <span className="hidden sm:flex items-center gap-1 text-xs text-white/70">
            <Star size={11} className="text-cyan shrink-0" />
            <span className="truncate">星宿天区 (选择跳转)</span>
          </span>
          <div className="relative flex items-center min-w-0">
            <select
              aria-label="选择星宿天区"
              value={selectedId}
              onChange={(event) => onSelect(event.target.value)}
              style={{ colorScheme: "dark" }}
              className="h-[30px] sm:min-h-10 w-full min-w-0 appearance-none truncate rounded-lg sm:rounded-xl border border-white/15 bg-black/40 pl-3 pr-8 text-[10.5px] sm:text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
            >
              <option value="" className="bg-[#0b1324] text-white">探索全天星图 (未指定)</option>
              {constellations.map((constellation) => (
                <option key={constellation.id} value={constellation.id} className="bg-[#0b1324] text-white">
                  {constellation.nameZh} / {constellation.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 text-white/60 shrink-0" />
          </div>
        </label>

        {/* Observation Timezone: 1 col on mobile (half width), 1 col on desktop */}
        <label className="col-span-1 grid gap-0.5 sm:gap-1 min-w-0">
          <span className="hidden sm:block text-xs text-white/70 truncate">观测经度 / 时区</span>
          <div className="relative flex items-center min-w-0">
            <select
              aria-label="选择观测时区"
              value={selectedTimezone}
              onChange={(event) => onTimezoneChange(event.target.value)}
              style={{ colorScheme: "dark" }}
              className="h-[30px] sm:min-h-10 w-full min-w-0 appearance-none truncate rounded-lg sm:rounded-xl border border-white/15 bg-black/40 pl-3 pr-8 text-[10.5px] sm:text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
            >
              {TIMEZONE_PRESETS.map((tz) => (
                <option key={tz.id} value={tz.id} className="bg-[#0b1324] text-white">
                  {tz.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 text-white/60 shrink-0" />
          </div>
        </label>

        {/* Observation Latitude: 1 col on mobile (half width), 1 col on desktop */}
        <label className="col-span-1 grid gap-0.5 sm:gap-1 min-w-0">
          <span className="hidden sm:block text-xs text-white/70 truncate">观测纬度带</span>
          <div className="relative flex items-center min-w-0">
            <select
              aria-label="选择观测纬度"
              value={selectedLatitude}
              onChange={(event) => onLatitudeChange(event.target.value)}
              style={{ colorScheme: "dark" }}
              className="h-[30px] sm:min-h-10 w-full min-w-0 appearance-none truncate rounded-lg sm:rounded-xl border border-white/15 bg-black/40 pl-3 pr-8 text-[10.5px] sm:text-xs text-white outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
            >
              {LATITUDE_PRESETS.map((lat) => (
                <option key={lat.id} value={lat.id} className="bg-[#0b1324] text-white">
                  {lat.nameZh}
                </option>
              ))}
            </select>
            <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 text-white/60 shrink-0" />
          </div>
        </label>

        {/* Date & Time with Playback Streamer: col-span-2 on mobile, 1 col on desktop */}
        <div className="col-span-2 sm:col-span-1 grid gap-0.5 sm:gap-1 min-w-0">
          <div className="flex items-center justify-between gap-1 text-xs text-white/70">
            <span className="truncate hidden sm:inline">观测时间 & 流转</span>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-cyan animate-pulse shrink-0">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan"></span>
                恒星日流转 ({playSpeed}x)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex-1 min-w-0 sm:flex-initial">
              <DarkDateTimePicker
                value={observerDateValue(observer)}
                onChange={onDateChange}
              />
            </div>
            {/* Speed Multiplier Dropdown */}
            <div className="relative flex items-center shrink-0">
              <select
                aria-label="选择播放倍速"
                value={playSpeed}
                onChange={(e) => onPlaySpeedChange?.(Number(e.target.value))}
                title={`流转倍速：${playSpeed}x（每秒流转 ${playSpeed} 分钟）`}
                style={{ colorScheme: "dark" }}
                className="h-[30px] sm:min-h-10 w-[72px] sm:w-auto shrink-0 appearance-none rounded-lg sm:rounded-xl border border-white/15 bg-black/40 pl-3 pr-8 text-[10.5px] sm:text-xs font-medium text-cyan outline-none transition-colors hover:border-cyan focus:border-cyan cursor-pointer [color-scheme:dark]"
              >
                <option value={1} className="bg-[#0b1324] text-white">1x</option>
                <option value={2} className="bg-[#0b1324] text-white">2x</option>
                <option value={5} className="bg-[#0b1324] text-white">5x</option>
                <option value={10} className="bg-[#0b1324] text-white">10x</option>
                <option value={30} className="bg-[#0b1324] text-white">30x</option>
                <option value={60} className="bg-[#0b1324] text-white">60x</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" className="pointer-events-none absolute right-3 text-cyan/70 shrink-0" />
            </div>
            <button
              type="button"
              onClick={onTogglePlay}
              title={isPlaying ? "暂停流转" : `开启时间流转 (${playSpeed}x，每秒流转 ${playSpeed} 分钟)`}
              className={`flex h-[30px] w-[30px] sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                isPlaying
                  ? "border-cyan bg-cyan/20 text-cyan shadow-lg shadow-cyan/20"
                  : "border-white/15 bg-black/40 text-white/80 hover:border-cyan hover:text-cyan"
              }`}
            >
              {isPlaying ? <Pause size={12} className="sm:w-[15px] sm:h-[15px]" /> : <Play size={12} className="translate-x-0.5 sm:w-[15px] sm:h-[15px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Contextual Description Row (Fixed-height, zero-jump, wheel-scrollable, hidden scrollbar) */}
      <div className="mt-1 sm:mt-2.5 min-w-0 border-t border-white/10 pt-1 sm:pt-2">
        <div
          ref={descriptionScrollRef}
          title={
            selected
              ? `${selected.nameZh} / ${selected.nameEn}：${selected.descriptionZh}（可使用鼠标滚轮横向滚动浏览）`
              : undefined
          }
          className="no-scrollbar flex h-4 sm:h-6 min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[9.5px] sm:text-xs text-white/70 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => onSelect(selected.id)}
                title="重新将镜头居中对准该星座"
                className="shrink-0 font-semibold text-white hover:text-cyan flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Star size={11} className="text-cyan animate-pulse" />
                <span>已对准【{selected.nameZh} / {selected.nameEn}】</span>
                <span className="text-[10px] text-cyan underline decoration-cyan/40 hover:decoration-cyan">(点击重聚)</span>
              </button>
              {optimalInfo && (
                <span className="shrink-0 rounded-full border border-cyan/40 bg-cyan/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium leading-none text-cyan shadow-sm shadow-cyan/10">
                  已自动跳转至【{optimalInfo.optimalLatitudeNameZh} · {optimalInfo.seasonNameZh}】最佳视界
                </span>
              )}
              <span className="shrink-0 text-white/60">：{selected.descriptionZh}</span>
            </>
          ) : (
            <span className="shrink-0 text-[10px] sm:text-[11px] text-white/45">
              轻击天幕进入沉浸模式；拖拽星空自由漫游；选择星宿天区可自动居中对准最佳视界。
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
