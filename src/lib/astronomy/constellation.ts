import type {
  ConstellationDefinition,
  StarRecord,
} from "@/types/astronomy";
import { starToHorizon } from "./coordinates";

export function constellationStars(
  constellation: ConstellationDefinition,
  stars: StarRecord[],
): StarRecord[] {
  const ids = new Set(constellation.segments.flat());
  return stars.filter((star) => ids.has(star.id));
}

export function constellationAltitude(
  constellation: ConstellationDefinition,
  stars: StarRecord[],
  observer: Parameters<typeof starToHorizon>[1],
): number {
  const points = constellationStars(constellation, stars).map((star) =>
    starToHorizon(star, observer),
  );
  if (points.length === 0) return -90;
  return points.reduce((total, point) => total + point.altitude, 0) / points.length;
}
