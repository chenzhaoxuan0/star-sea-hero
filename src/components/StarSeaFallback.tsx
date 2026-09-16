"use client";

import { ArrowDown, Compass, Waves } from "lucide-react";

export default function StarSeaFallback() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/60">
        <span>Star Sea / Static View</span>
        <span className="flex items-center gap-2">
          <Waves size={13} aria-hidden="true" />
          <span>Fallback</span>
        </span>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/60">
          <Compass size={13} aria-hidden="true" />
          <span>Celestial atlas</span>
        </div>
        <h1 id="star-sea-title" className="font-display text-6xl italic leading-none text-white sm:text-8xl">
          星辰大海
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
          一片正在打开的天幕。当前设备将以静态星海画面继续呈现。
        </p>
        <a
          href="#explore"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm text-black transition-transform hover:scale-105"
        >
          <span>向下探索</span>
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
        <span>Sky above</span>
        <span>Ocean below</span>
      </div>
    </div>
  );
}
