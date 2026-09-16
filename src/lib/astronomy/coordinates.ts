import { Horizon } from "astronomy-engine";
import type {
  HorizonPosition,
  Observer,
  StarRecord,
} from "@/types/astronomy";
import { toAstronomyObserver } from "./observer";

const DEG_TO_RAD = Math.PI / 180;
const STAR_RADIUS = 42;

export function horizonToVector(
  azimuth: number,
  altitude: number,
  radius = STAR_RADIUS,
): { x: number; y: number; z: number } {
  const azimuthRad = azimuth * DEG_TO_RAD;
  const altitudeRad = altitude * DEG_TO_RAD;
  const horizontalRadius = Math.cos(altitudeRad) * radius;

  return {
    x: Math.sin(azimuthRad) * horizontalRadius,
    y: Math.sin(altitudeRad) * radius,
    z: -Math.cos(azimuthRad) * horizontalRadius,
  };
}

export function starToHorizon(
  star: Pick<StarRecord, "raHours" | "decDegrees">,
  observer: Observer,
): HorizonPosition {
  const horizontal = Horizon(
    new Date(observer.date),
    toAstronomyObserver(observer),
    star.raHours,
    star.decDegrees,
    "normal",
  );
  const vector = horizonToVector(horizontal.azimuth, horizontal.altitude);

  return {
    azimuth: horizontal.azimuth,
    altitude: horizontal.altitude,
    visible: horizontal.altitude >= -2,
    vector,
  };
}

export function starsToHorizon(
  stars: StarRecord[],
  observer: Observer,
): Array<StarRecord & { horizon: HorizonPosition }> {
  return stars
    .map((star) => ({ ...star, horizon: starToHorizon(star, observer) }))
    .filter((star) => star.horizon.visible);
}
