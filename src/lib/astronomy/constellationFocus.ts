import type { Observer } from "@/types/astronomy";
import { formatCoordinatesLabel, TIMEZONE_PRESETS } from "@/data/defaultObserver";

export type ConstellationOptimalInfo = {
  id: string;
  nameZh: string;
  raHours: number;
  decDegrees: number;
  optimalLatitudeId: string;
  optimalLatitudeNameZh: string;
  optimalLatitude: number;
  dayOfYear: number;
  seasonNameZh: string;
};

/**
 * Calibrated celestial parameters and best observation conditions for all 21 key constellations.
 * Latitudes and seasons are distributed so constellations are observed at prime viewing angles (25° - 65°)
 * in dark nocturnal skies (~21:30 local time).
 */
export const CONSTELLATION_OPTIMAL_MAP: Record<string, ConstellationOptimalInfo> = {
  aries: {
    id: "aries",
    nameZh: "白羊座",
    raHours: 2.19,
    decDegrees: 22.7,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 335,
    seasonNameZh: "初冬白羊初升",
  },
  taurus: {
    id: "taurus",
    nameZh: "金牛座",
    raHours: 4.48,
    decDegrees: 18.4,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 5,
    seasonNameZh: "冬夜毕宿金牛",
  },
  gemini: {
    id: "gemini",
    nameZh: "双子座",
    raHours: 7.01,
    decDegrees: 23.8,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 43,
    seasonNameZh: "冬夜双子并肩",
  },
  cancer: {
    id: "cancer",
    nameZh: "巨蟹座",
    raHours: 8.64,
    decDegrees: 19.4,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 68,
    seasonNameZh: "春初暗夜蜂巢星团",
  },
  leo: {
    id: "leo",
    nameZh: "狮子座",
    raHours: 10.53,
    decDegrees: 19.1,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 97,
    seasonNameZh: "春夜王者雄狮",
  },
  virgo: {
    id: "virgo",
    nameZh: "室女座",
    raHours: 13.48,
    decDegrees: -1.0,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 142,
    seasonNameZh: "赤道水天春夜室女",
  },
  libra: {
    id: "libra",
    nameZh: "天秤座",
    raHours: 15.34,
    decDegrees: -16.4,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 170,
    seasonNameZh: "赤道初夏金秤横空",
  },
  scorpius: {
    id: "scorpius",
    nameZh: "天蝎座",
    raHours: 16.90,
    decDegrees: -33.9,
    optimalLatitudeId: "35S",
    optimalLatitudeNameZh: "南纬 35° · 南天银河",
    optimalLatitude: -35.0,
    dayOfYear: 194,
    seasonNameZh: "南天盛夏壮丽心宿",
  },
  sagittarius: {
    id: "sagittarius",
    nameZh: "人马座 (银心茶壶)",
    raHours: 18.98,
    decDegrees: -29.1,
    optimalLatitudeId: "35S",
    optimalLatitudeNameZh: "南纬 35° · 南天银河",
    optimalLatitude: -35.0,
    dayOfYear: 225,
    seasonNameZh: "南天盛夏银河核心",
  },
  capricornus: {
    id: "capricornus",
    nameZh: "摩羯座",
    raHours: 21.07,
    decDegrees: -18.8,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 257,
    seasonNameZh: "赤道初秋摩羯水天",
  },
  aquarius: {
    id: "aquarius",
    nameZh: "宝瓶座",
    raHours: 22.48,
    decDegrees: -9.1,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 279,
    seasonNameZh: "赤道深秋甘霖宝瓶",
  },
  pisces: {
    id: "pisces",
    nameZh: "双鱼座",
    raHours: 0.15,
    decDegrees: 14.2,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 305,
    seasonNameZh: "温带秋夜双鱼深空",
  },
  orion: {
    id: "orion",
    nameZh: "猎户座",
    raHours: 5.50,
    decDegrees: 6.5,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 20,
    seasonNameZh: "冬夜猎户南中天",
  },
  "ursa-major": {
    id: "ursa-major",
    nameZh: "大熊座 (北斗七星)",
    raHours: 11.0,
    decDegrees: 55.0,
    optimalLatitudeId: "60N",
    optimalLatitudeNameZh: "北纬 60° · 高纬拱极",
    optimalLatitude: 60.0,
    dayOfYear: 102,
    seasonNameZh: "春夜北斗高悬北天",
  },
  cassiopeia: {
    id: "cassiopeia",
    nameZh: "仙后座 (W形星群)",
    raHours: 1.02,
    decDegrees: 60.1,
    optimalLatitudeId: "60N",
    optimalLatitudeNameZh: "北纬 60° · 高纬拱极",
    optimalLatitude: 60.0,
    dayOfYear: 317,
    seasonNameZh: "高纬北天秋冬仙后",
  },
  "canis-major": {
    id: "canis-major",
    nameZh: "大犬座",
    raHours: 6.88,
    decDegrees: -23.2,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 41,
    seasonNameZh: "赤道冬夜天狼璀璨",
  },
  cygnus: {
    id: "cygnus",
    nameZh: "天鹅座 (北天十字)",
    raHours: 20.22,
    decDegrees: 38.5,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 244,
    seasonNameZh: "盛夏银河天鹅十字",
  },
  lyra: {
    id: "lyra",
    nameZh: "天琴座 (织女星)",
    raHours: 18.82,
    decDegrees: 36.3,
    optimalLatitudeId: "35N",
    optimalLatitudeNameZh: "北纬 35° · 温带星空",
    optimalLatitude: 35.0,
    dayOfYear: 223,
    seasonNameZh: "盛夏织女中天凌空",
  },
  aquila: {
    id: "aquila",
    nameZh: "天鹰座 (牛郎星)",
    raHours: 19.66,
    decDegrees: 9.9,
    optimalLatitudeId: "0EQ",
    optimalLatitudeNameZh: "赤道 0° · 水天一色",
    optimalLatitude: 0.0,
    dayOfYear: 236,
    seasonNameZh: "赤道盛夏牛郎银河",
  },
  crux: {
    id: "crux",
    nameZh: "南十字座",
    raHours: 12.50,
    decDegrees: -59.7,
    optimalLatitudeId: "35S",
    optimalLatitudeNameZh: "南纬 35° · 南天银河",
    optimalLatitude: -35.0,
    dayOfYear: 127,
    seasonNameZh: "南半球秋夜南十字",
  },
  "ursa-minor": {
    id: "ursa-minor",
    nameZh: "小熊座 (北极星)",
    raHours: 2.50,
    decDegrees: 89.3,
    optimalLatitudeId: "60N",
    optimalLatitudeNameZh: "北纬 60° · 高纬拱极",
    optimalLatitude: 60.0,
    dayOfYear: 102,
    seasonNameZh: "高纬北天永恒极星",
  },
};

/**
 * Calculates optimal observation time (21:30 local night) and viewing latitude
 * so the selected constellation is situated at a majestic observing altitude above the sea.
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

  // Local 21:30 in the observer's timezone
  const tz = TIMEZONE_PRESETS.find((t) => t.id === timezoneId) || { offsetHours: 8 };
  // Local 21:30 means UTC = 21.5 - offsetHours
  const utcHours = (21.5 - tz.offsetHours + 24) % 24;
  const utcH = Math.floor(utcHours);
  const utcM = Math.round((utcHours - utcH) * 60);

  const d = new Date(Date.UTC(2026, 0, 1, utcH, utcM, 0));
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
