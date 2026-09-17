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
    starLimit: 2400,
    oceanSegments: 96,
    reflectionScale: 0.85,
    maxPixelRatio: 1.5,
    targetFps: 60,
  },
  balanced: {
    starLimit: 1400,
    oceanSegments: 64,
    reflectionScale: 0.65,
    maxPixelRatio: 1.5,
    targetFps: 50,
  },
  low: {
    starLimit: 600,
    oceanSegments: 32,
    reflectionScale: 0.4,
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
