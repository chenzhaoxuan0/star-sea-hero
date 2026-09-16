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

/**
 * Calculates the exact 3D orthonormal orientation basis of the Milky Way galaxy
 * in current observer Horizontal coordinates (Azimuth/Altitude).
 *
 * IAU 1958 standard definitions:
 * - Galactic Center (Sgr A*): RA = 17h 45m 40s (17.7611h), Dec = -29° 00' 28" (-29.0078°)
 * - Galactic North Pole (NGP): RA = 12h 51m 26s (12.8573h), Dec = +27° 07' 42" (+27.1283°)
 * - Galactic l=90° (Cygnus direction): RA = 21h 12m (21.2000h), Dec = +48° 02' (+48.0333°)
 */
export function calculateMilkyWayBasis(observer: Observer): {
  xAxis: { x: number; y: number; z: number };
  yAxis: { x: number; y: number; z: number };
  zAxis: { x: number; y: number; z: number };
} {
  const date = new Date(observer.date);
  const astroObs = toAstronomyObserver(observer);

  const hGC = Horizon(date, astroObs, 17.7611, -29.0078, "normal");
  const hNGP = Horizon(date, astroObs, 12.8573, 27.1283, "normal");

  const vGC = horizonToVector(hGC.azimuth, hGC.altitude, 1.0);
  const vNGP = horizonToVector(hNGP.azimuth, hNGP.altitude, 1.0);

  // yAxis is the Galactic North Pole (normal to galactic disk)
  const y = { ...vNGP };
  const yLen = Math.hypot(y.x, y.y, y.z) || 1;
  y.x /= yLen; y.y /= yLen; y.z /= yLen;

  // Project vGC onto the galactic plane (perpendicular to y)
  const dotY = vGC.x * y.x + vGC.y * y.y + vGC.z * y.z;
  const z = {
    x: vGC.x - y.x * dotY,
    y: vGC.y - y.y * dotY,
    z: vGC.z - y.z * dotY,
  };
  const zLen = Math.hypot(z.x, z.y, z.z) || 1;
  z.x /= zLen; z.y /= zLen; z.z /= zLen;

  // xAxis = y cross z (pointing towards l = 90° Cygnus)
  const x = {
    x: y.y * z.z - y.z * z.y,
    y: y.z * z.x - y.x * z.z,
    z: y.x * z.y - y.y * z.x,
  };
  const xLen = Math.hypot(x.x, x.y, x.z) || 1;
  x.x /= xLen; x.y /= xLen; x.z /= xLen;

  return { xAxis: x, yAxis: y, zAxis: z };
}

