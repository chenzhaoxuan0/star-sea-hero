import type { Observer } from "@/types/astronomy";

export type TimezonePreset = {
  id: string;
  name: string;
  offsetHours: number;
  longitude: number;
};

export type LatitudePreset = {
  id: string;
  nameZh: string;
  nameEn: string;
  latitude: number;
};

export const TIMEZONE_PRESETS: TimezonePreset[] = [
  { id: "UTC-8", name: "UTC-8 · 120°W", offsetHours: -8, longitude: -120.0 },
  { id: "UTC-5", name: "UTC-5 · 75°W", offsetHours: -5, longitude: -75.0 },
  { id: "UTC+0", name: "UTC+0 · 0°", offsetHours: 0, longitude: 0.0 },
  { id: "UTC+3", name: "UTC+3 · 45°E", offsetHours: 3, longitude: 45.0 },
  { id: "UTC+8", name: "UTC+8 · 120°E", offsetHours: 8, longitude: 120.0 },
  { id: "UTC+9", name: "UTC+9 · 135°E", offsetHours: 9, longitude: 135.0 },
  { id: "UTC+10", name: "UTC+10 · 150°E", offsetHours: 10, longitude: 150.0 },
  { id: "UTC+12", name: "UTC+12 · 180°E", offsetHours: 12, longitude: 180.0 },
];

export const LATITUDE_PRESETS: LatitudePreset[] = [
  { id: "60N", nameZh: "北纬 60° · 高纬拱极", nameEn: "60°N · High North", latitude: 60.0 },
  { id: "35N", nameZh: "北纬 35° · 温带星空", nameEn: "35°N · Mid North", latitude: 35.0 },
  { id: "0EQ", nameZh: "赤道 0° · 水天一色", nameEn: "0° · Equator", latitude: 0.0 },
  { id: "35S", nameZh: "南纬 35° · 南天银河", nameEn: "35°S · Mid South", latitude: -35.0 },
];

export function formatCoordinatesLabel(lat: number, lon: number, tzId = "UTC+8"): string {
  const latStr = lat >= 0 ? `${lat.toFixed(0)}°N` : `${Math.abs(lat).toFixed(0)}°S`;
  const lonStr = lon >= 0 ? `${lon.toFixed(0)}°E` : `${Math.abs(lon).toFixed(0)}°W`;
  return `${tzId} · ${lonStr}, ${latStr}`;
}

function getDefaultNightDate(): string {
  const d = new Date();
  d.setHours(21, 30, 0, 0);
  return d.toISOString();
}

export const DEFAULT_OBSERVER: Observer = {
  latitude: 35.0,
  longitude: 120.0,
  elevation: 20,
  date: getDefaultNightDate(),
  label: "UTC+8 · 120°E, 35°N",
};

export function observerDateValue(observer: Observer): string {
  const date = new Date(observer.date);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function observerFromDateInput(
  observer: Observer,
  dateInput: string,
): Observer {
  return {
    ...observer,
    date: new Date(dateInput).toISOString(),
  };
}

