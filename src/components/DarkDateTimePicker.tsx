"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DarkDateTimePickerProps {
  value: string; // ISO or YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DarkDateTimePicker({
  value,
  onChange,
  disabled = false,
}: DarkDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedDate = new Date(value);
  const isValidDate = !Number.isNaN(parsedDate.getTime());

  const year = isValidDate ? parsedDate.getFullYear() : new Date().getFullYear();
  const month = isValidDate ? parsedDate.getMonth() : new Date().getMonth();
  const dateNum = isValidDate ? parsedDate.getDate() : new Date().getDate();
  const hours = isValidDate ? parsedDate.getHours() : 21;
  const minutes = isValidDate ? parsedDate.getMinutes() : 30;

  // View state for calendar browsing
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  // Synchronize view state when value changes externally
  useEffect(() => {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto scroll to current hours/minutes when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourListRef.current) {
          const selectedHourEl = hourListRef.current.querySelector('[data-selected="true"]');
          if (selectedHourEl) {
            selectedHourEl.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
        if (minuteListRef.current) {
          const selectedMinuteEl = minuteListRef.current.querySelector('[data-selected="true"]');
          if (selectedMinuteEl) {
            selectedMinuteEl.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
      }, 50);
    }
  }, [isOpen]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const startOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Mon = 0, Sun = 6
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const emitDateTime = (newY: number, newM: number, newD: number, newH: number, newMin: number) => {
    const yStr = String(newY).padStart(4, "0");
    const mStr = String(newM + 1).padStart(2, "0");
    const dStr = String(newD).padStart(2, "0");
    const hStr = String(newH).padStart(2, "0");
    const minStr = String(newMin).padStart(2, "0");
    onChange(`${yStr}-${mStr}-${dStr}T${hStr}:${minStr}`);
  };

  const handleSelectDay = (day: number) => {
    emitDateTime(viewYear, viewMonth, day, hours, minutes);
  };

  const handleSelectHour = (h: number) => {
    emitDateTime(year, month, dateNum, h, minutes);
  };

  const handleSelectMinute = (m: number) => {
    emitDateTime(year, month, dateNum, hours, m);
  };

  const handleJumpToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    emitDateTime(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  };

  // Formatted display in trigger input
  const displayString = `${String(year).padStart(4, "0")}/${String(month + 1).padStart(2, "0")}/${String(dateNum).padStart(2, "0")} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button that looks like the sleek dark input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="点开观测时间日历选择器"
        title="点开暗色星空日历与时间调节面板"
        className={`flex h-[30px] sm:min-h-10 w-[130px] sm:w-[154px] shrink-0 items-center justify-between rounded-lg sm:rounded-xl border px-2 sm:px-3 text-[10.5px] sm:text-xs text-white outline-none transition-all cursor-pointer ${
          isOpen
            ? "border-cyan bg-cyan/15 text-white shadow-lg shadow-cyan/20"
            : "border-white/15 bg-black/40 text-white/90 hover:border-cyan hover:bg-black/50"
        }`}
      >
        <span className="font-mono text-[10.5px] sm:text-[11px] tracking-tight">{displayString}</span>
        <CalendarIcon
          size={13}
          className={`shrink-0 transition-colors ${isOpen ? "text-cyan" : "text-white/60"}`}
        />
      </button>

      {/* Dark Themed Celestial Popover Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 z-50 mb-2 w-[min(92vw,332px)] rounded-2xl border border-white/20 bg-[#080d18]/95 p-3 text-xs text-white shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-medium text-white/90">
              <CalendarIcon size={14} className="text-cyan" />
              <span>观测时间调节</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Side-by-Side: Calendar (Left) & Time (Right) */}
          <div className="flex gap-2.5">
            {/* Calendar Section (Left) */}
            <div className="w-[214px] shrink-0">
              {/* Month Selector Navigation */}
              <div className="mb-2 flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="上一月"
                  className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="font-semibold text-white/90 text-xs">
                  {viewYear}年{String(viewMonth + 1).padStart(2, "0")}月
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="下一月"
                  className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Weekdays Header */}
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-white/45">
                <span>一</span>
                <span>二</span>
                <span>三</span>
                <span>四</span>
                <span>五</span>
                <span>六</span>
                <span>日</span>
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
                {/* Trailing days of previous month */}
                {Array.from({ length: startOffset }).map((_, idx) => {
                  const dayVal = prevMonthDays - startOffset + idx + 1;
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="py-1 text-white/20 select-none text-[10px]"
                    >
                      {dayVal}
                    </div>
                  );
                })}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayVal = idx + 1;
                  const isSelected =
                    viewYear === year && viewMonth === month && dayVal === dateNum;
                  const isToday =
                    viewYear === new Date().getFullYear() &&
                    viewMonth === new Date().getMonth() &&
                    dayVal === new Date().getDate();

                  return (
                    <button
                      key={`curr-${dayVal}`}
                      type="button"
                      data-day={dayVal}
                      onClick={() => handleSelectDay(dayVal)}
                      className={`h-6 w-6 mx-auto flex items-center justify-center rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan text-slate-950 font-bold shadow-md shadow-cyan/40 scale-105"
                          : isToday
                          ? "border border-cyan/50 text-cyan hover:bg-cyan/20"
                          : "text-white/85 hover:bg-white/15"
                      }`}
                    >
                      {dayVal}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2 px-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="text-cyan transition-colors hover:text-cyan/80 hover:underline cursor-pointer"
                >
                  设为今天
                </button>
                <span className="text-[10px] text-white/40">恒星时同步</span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-[1px] bg-white/10 self-stretch" />

            {/* Time Columns Section (Right) */}
            <div className="flex-1 flex flex-col">
              <div className="text-[11px] font-medium text-white/60 mb-1.5 text-center">
                时 : 分
              </div>
              <div className="flex gap-1 flex-1 h-[178px]">
                {/* Hours list */}
                <div
                  ref={hourListRef}
                  className="flex-1 overflow-y-auto space-y-0.5 rounded no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ maxHeight: "178px", scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const isSelected = h === hours;
                    return (
                      <button
                        key={`h-${h}`}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectHour(h)}
                        className={`w-full py-1 text-center font-mono text-[11px] rounded transition-all cursor-pointer ${
                          isSelected
                            ? "bg-cyan text-slate-950 font-bold shadow-sm shadow-cyan/30"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>

                {/* Minutes list */}
                <div
                  ref={minuteListRef}
                  className="flex-1 overflow-y-auto space-y-0.5 rounded no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ maxHeight: "178px", scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {Array.from({ length: 60 }).map((_, m) => {
                    const isSelected = m === minutes;
                    return (
                      <button
                        key={`m-${m}`}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelectMinute(m)}
                        className={`w-full py-1 text-center font-mono text-[11px] rounded transition-all cursor-pointer ${
                          isSelected
                            ? "bg-cyan text-slate-950 font-bold shadow-sm shadow-cyan/30"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-2.5 border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-lg bg-cyan/20 border border-cyan/40 py-1 text-[11px] font-medium text-cyan transition-all hover:bg-cyan hover:text-slate-950 cursor-pointer"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
