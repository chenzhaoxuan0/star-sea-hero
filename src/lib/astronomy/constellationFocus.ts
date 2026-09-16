import type { Observer } from "@/types/astronomy";
import { formatCoordinatesLabel } from "@/data/defaultObserver";

export type ConstellationOptimalInfo = {
  id: string;
  nameZh: string;
  raHours: number;
  decDegrees: number;
  optimalLatitudeId: string;
  optimalLatitude: number;
  dayOfYear: number;
  seasonNameZh: string;
};

/**
 * High-precision celestial centroids and optimal stargazing ephemeris for all 21 constellations.
 * Each configuration is calibrated so that the constellation culminates in dark night sky (~21:30 local time)
 * at an altitude of 26° to 85° above the ocean.
 */
export const CONSTELLATION_OPTIMAL_MAP: Record<string, ConstellationOptimalInfo> = {
  aries: { id: "aries", nameZh: "白羊座", raHours: 2.19, decDegrees: 22.7, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 335, seasonNameZh: "冬季初夜星空" },
  taurus: { id: "taurus", nameZh: "金牛座", raHours: 4.48, decDegrees: 18.4, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 5, seasonNameZh: "冬季璀璨星空" },
  gemini: { id: "gemini", nameZh: "双子座", raHours: 7.01, decDegrees: 23.8, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 43, seasonNameZh: "冬夜并肩星宿" },
  cancer: { id: "cancer", nameZh: "巨蟹座", raHours: 8.64, decDegrees: 19.4, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 68, seasonNameZh: "春初暗夜蜂巢星团" },
  leo: { id: "leo", nameZh: "狮子座", raHours: 10.53, decDegrees: 19.1, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 97, seasonNameZh: "春夜王者天区" },
  virgo: { id: "virgo", nameZh: "室女座", raHours: 13.48, decDegrees: -1.0, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 142, seasonNameZh: "春末角宿初升" },
  libra: { id: "libra", nameZh: "天秤座", raHours: 15.34, decDegrees: -16.4, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 170, seasonNameZh: "夏夜南方黄道" },
  scorpius: { id: "scorpius", nameZh: "天蝎座", raHours: 16.90, decDegrees: -33.9, optimalLatitudeId: "0EQ", optimalLatitude: 0.0, dayOfYear: 194, seasonNameZh: "盛夏壮丽心宿" },
  sagittarius: { id: "sagittarius", nameZh: "人马座 (银心茶壶)", raHours: 18.98, decDegrees: -29.1, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 225, seasonNameZh: "盛夏银河核球中心" },
  capricornus: { id: "capricornus", nameZh: "摩羯座", raHours: 21.07, decDegrees: -18.8, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 257, seasonNameZh: "初秋南方水天星宿" },
  aquarius: { id: "aquarius", nameZh: "宝瓶座", raHours: 22.48, decDegrees: -9.1, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 279, seasonNameZh: "秋夜甘霖星群" },
  pisces: { id: "pisces", nameZh: "双鱼座", raHours: 0.15, decDegrees: 14.2, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 305, seasonNameZh: "秋夜双鱼深空" },
  orion: { id: "orion", nameZh: "猎户座", raHours: 5.50, decDegrees: 6.5, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 20, seasonNameZh: "冬夜猎户南中天" },
  "ursa-major": { id: "ursa-major", nameZh: "大熊座 (北斗七星)", raHours: 10.85, decDegrees: 52.8, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 102, seasonNameZh: "春夜北斗高悬" },
  cassiopeia: { id: "cassiopeia", nameZh: "仙后座 (W形星群)", raHours: 1.02, decDegrees: 60.1, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 317, seasonNameZh: "秋冬北天拱极" },
  "canis-major": { id: "canis-major", nameZh: "大犬座", raHours: 6.88, decDegrees: -23.2, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 41, seasonNameZh: "冬夜天狼璀璨" },
  cygnus: { id: "cygnus", nameZh: "天鹅座 (北天十字)", raHours: 20.22, decDegrees: 38.5, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 244, seasonNameZh: "夏夜银河大裂谷" },
  lyra: { id: "lyra", nameZh: "天琴座 (织女星)", raHours: 18.82, decDegrees: 36.3, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 223, seasonNameZh: "盛夏织女中天" },
  aquila: { id: "aquila", nameZh: "天鹰座 (牛郎星)", raHours: 19.66, decDegrees: 9.9, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 236, seasonNameZh: "盛夏牛郎银河" },
  crux: { id: "crux", nameZh: "南十字座", raHours: 12.50, decDegrees: -59.7, optimalLatitudeId: "35S", optimalLatitude: -35.0, dayOfYear: 127, seasonNameZh: "南半球秋夜南十字" },
  "ursa-minor": { id: "ursa-minor", nameZh: "小熊座 (北极星)", raHours: 10.91, decDegrees: 78.4, optimalLatitudeId: "35N", optimalLatitude: 35.0, dayOfYear: 102, seasonNameZh: "北天永恒极星" },
};

/**
 * Calculates optimal observation time (21:30 evening night) and viewing latitude
 * so the constellation is at prime elevation, clearly visible above the ocean.
 */
export function getOptimalObserverForConstellation(
  constellationId: string,
  currentObserver: Observer,
  timezoneId = "UTC+8",
): {
  observer: Observer;
  latitudeId: string;
  info: ConstellationOptimalInfo;
} | null {
  const info = CONSTELLATION_OPTIMAL_MAP[constellationId];
  if (!info) return null;

  // 21:30 in 2026: 13:30 UTC for UTC+8
  const d = new Date(Date.UTC(2026, 0, 1, 13, 30, 0));
  d.setUTCDate(d.getUTCDate() + info.dayOfYear);

  const newLat = info.optimalLatitude;
  const newObserver: Observer = {
    ...currentObserver,
    latitude: newLat,
    date: d.toISOString(),
    label: formatCoordinatesLabel(newLat, currentObserver.longitude, timezoneId),
  };

  return {
    observer: newObserver,
    latitudeId: info.optimalLatitudeId,
    info,
  };
}
