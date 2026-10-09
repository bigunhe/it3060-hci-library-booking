import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { RoomAvailability } from '@/lib/availability';

export const HOUR_MS = 60 * 60 * 1000;
const OFFSET_MS = 330 * 60 * 1000;
// Demo schedule; confirm actual opening hours with the library before real use.
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 18;

export function localDate(ms: number): string {
  return new Date(ms + OFFSET_MS).toISOString().slice(0, 10);
}
export function dayStart(date: string): number {
  return new Date(`${date}T00:00:00+05:30`).getTime();
}
export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const ms = dayStart(date);
  return Number.isFinite(ms) && localDate(ms) === date;
}
export function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
export function dateLabel(date: string): string {
  return new Date(dayStart(date)).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Colombo', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
export function slotStarts(date: string): number[] {
  // Start at 08:30, then hourly. Last session ends at 17:30.
  return Array.from({ length: CLOSING_HOUR - OPENING_HOUR - 1 }, (_, i) =>
    dayStart(date) + (OPENING_HOUR + i) * HOUR_MS + HOUR_MS / 2);
}
export function slotFree(start: number, availability: RoomAvailability): boolean {
  return !availability.overstaying && !availability.blockedStarts.some(
    (block) => block < start + HOUR_MS && block + 15 * 60 * 1000 > start
  );
}
export function dayRange(date: string): [Timestamp, Timestamp] {
  return [Timestamp.fromMillis(dayStart(date)), Timestamp.fromMillis(dayStart(date) + 24 * HOUR_MS)];
}
export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
