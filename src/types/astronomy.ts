export type Observer = {
  latitude: number;
  longitude: number;
  elevation: number;
  date: string;
  label: string;
};

export type StarRecord = {
  id: string;
  name: string;
  raHours: number;
  decDegrees: number;
  magnitude: number;
  color: string;
  constellation: string;
};

export type ConstellationDefinition = {
  id: string;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  segments: Array<[string, string]>;
};

export type HorizonPosition = {
  azimuth: number;
  altitude: number;
  visible: boolean;
  vector: {
    x: number;
    y: number;
    z: number;
  };
};

export type CloudSettings = {
  density: number; // 薄厚: 0.0 ~ 2.0 (default 1.0)
  elevation: number; // 仰角: 0.05 ~ 0.75 (default 0.32)
  coverage: number; // 覆盖范围: 0.15 ~ 1.0 (default 0.55)
};

