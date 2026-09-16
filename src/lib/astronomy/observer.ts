import { Observer as AstronomyObserver } from "astronomy-engine";
import type { Observer } from "@/types/astronomy";

export function validateObserver(observer: Observer): void {
  if (observer.latitude < -90 || observer.latitude > 90) {
    throw new RangeError("Latitude must be between -90 and 90 degrees.");
  }
  if (observer.longitude < -180 || observer.longitude > 180) {
    throw new RangeError("Longitude must be between -180 and 180 degrees.");
  }
  if (!Number.isFinite(observer.elevation)) {
    throw new RangeError("Elevation must be a finite number.");
  }
  if (Number.isNaN(new Date(observer.date).getTime())) {
    throw new RangeError("Observer date must be a valid ISO date.");
  }
}

export function toAstronomyObserver(observer: Observer): AstronomyObserver {
  validateObserver(observer);
  return new AstronomyObserver(
    observer.latitude,
    observer.longitude,
    observer.elevation,
  );
}
