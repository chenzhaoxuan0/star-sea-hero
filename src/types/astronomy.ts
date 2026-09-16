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
