import type { Observer } from "@/types/astronomy";

export const DEFAULT_OBSERVER: Observer = {
  latitude: 39.9042,
  longitude: 116.4074,
  elevation: 43,
  date: new Date().toISOString(),
  label: "Beijing",
};

export function observerDateValue(observer: Observer): string {
  const date = new Date(observer.date);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function observerFromDateInput(
  observer: Observer,
  dateInput: string,
): Observer {
  return {
    ...observer,
    date: new Date(dateInput).toISOString(),
  };
}
