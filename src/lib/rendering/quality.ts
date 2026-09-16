export type QualityLevel = "high" | "balanced" | "low";

export type QualitySettings = {
  starLimit: number;
  oceanSegments: number;
  reflectionScale: number;
  maxPixelRatio: number;
  targetFps: number;
};

const SETTINGS: Record<QualityLevel, QualitySettings> = {
  high: {
    starLimit: 2200,
    oceanSegments: 96,
    reflectionScale: 0.7,
    maxPixelRatio: 1.75,
    targetFps: 55,
  },
  balanced: {
    starLimit: 1200,
    oceanSegments: 64,
    reflectionScale: 0.5,
    maxPixelRatio: 1.35,
    targetFps: 45,
  },
  low: {
    starLimit: 520,
    oceanSegments: 32,
    reflectionScale: 0.25,
    maxPixelRatio: 1,
    targetFps: 30,
  },
};

export function getQualitySettings(level: QualityLevel): QualitySettings {
  return SETTINGS[level];
}

export function chooseInitialQuality(
  width: number,
  hardwareConcurrency = 4,
): QualityLevel {
  if (width < 640 || hardwareConcurrency <= 2) return "low";
  if (width < 1200 || hardwareConcurrency <= 4) return "balanced";
  return "high";
}
