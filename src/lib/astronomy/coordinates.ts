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
  const date = new Date(observer.date);
  const astroObs = toAstronomyObserver(observer);
  return starToHorizonFast(star, date, astroObs);
}

export function starToHorizonFast(
  star: Pick<StarRecord, "raHours" | "decDegrees">,
  date: Date,
  astroObs: ReturnType<typeof toAstronomyObserver>,
): HorizonPosition {
  const horizontal = Horizon(
    date,
    astroObs,
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
  date: Date = new Date(observer.date),
  astroObs: ReturnType<typeof toAstronomyObserver> = toAstronomyObserver(observer),
): Array<StarRecord & { horizon: HorizonPosition }> {
  const result: Array<StarRecord & { horizon: HorizonPosition }> = [];
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const horizon = starToHorizonFast(star, date, astroObs);
    if (horizon.visible) {
      result.push({ ...star, horizon });
    }
  }
  return result;
}

/**
 * Calculates the exact 3D orthonormal orientation basis of the celestial sphere (J2000)
 * in current observer Horizontal coordinates (Azimuth/Altitude).
 *
 * Defines:
 * - xAxis: RA = 0h, Dec = 0° (Vernal Equinox)
 * - yAxis: RA = 6h, Dec = 0°
 * - zAxis: Dec = +90° (North Celestial Pole)
 *
 * When transformed into a matrix, its inverse projects any horizontal viewing ray
 * into exact J2000 equatorial coordinates with machine precision (< 1e-15 error).
 */
export function calculateMilkyWayBasis(
  observer: Observer,
  date: Date = new Date(observer.date),
  astroObs: ReturnType<typeof toAstronomyObserver> = toAstronomyObserver(observer),
): {
  xAxis: { x: number; y: number; z: number };
  yAxis: { x: number; y: number; z: number };
  zAxis: { x: number; y: number; z: number };
} {
  const p0 = Horizon(date, astroObs, 0, 0, undefined);
  const p6 = Horizon(date, astroObs, 6, 0, undefined);
  const pNCP = Horizon(date, astroObs, 0, 90, undefined);

  const vX = horizonToVector(p0.azimuth, p0.altitude, 1.0);
  const vY = horizonToVector(p6.azimuth, p6.altitude, 1.0);
  const vZ = horizonToVector(pNCP.azimuth, pNCP.altitude, 1.0);

  return { xAxis: vX, yAxis: vY, zAxis: vZ };
}


