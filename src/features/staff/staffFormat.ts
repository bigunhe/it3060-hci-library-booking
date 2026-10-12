import type { Timestamp } from 'firebase/firestore';

import { DISPLAY_TIME_ZONE, MAX_GROUP_SIZE, MIN_GROUP_SIZE } from '@/lib/bookingRules';
import type { Booking, BookingStatus } from '@/types/models';

import type { RoomStaffState } from './staffQueries';

export function formatColombo(time: Timestamp): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(time.toDate());
}

export function formatClock(time: Timestamp): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(time.toDate());
}

export function formatNowClock(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(now));
}

export function formatLongDate(time: Timestamp): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(time.toDate());
}

export function formatDayShort(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function remainingMinutes(endAt: Timestamp, now = Date.now()): number {
  return Math.max(0, Math.ceil((endAt.toMillis() - now) / 60000));
}

export function elapsedMinutes(from: Timestamp, now = Date.now()): number {
  return Math.max(0, Math.ceil((now - from.toMillis()) / 60000));
}

export function bookingRefLabel(id: string): string {
  return `#${id}`;
}

export function groupRuleOk(count: number): boolean {
  return count >= MIN_GROUP_SIZE && count <= MAX_GROUP_SIZE;
}

export type LedgerState = 'active' | 'overstay' | 'completed' | 'pending' | 'other';

export function ledgerState(booking: Booking, now = Date.now()): LedgerState {
  if (booking.status === 'active' && booking.endAt.toMillis() <= now) return 'overstay';
  if (booking.status === 'active') return 'active';
  if (booking.status === 'completed') return 'completed';
  if (booking.status === 'confirmed') return 'pending';
  return 'other';
}

export function auditActionLabel(action: string): string {
  if (action === 'checked_in') return 'Checked In';
  if (action === 'extended') return 'Extended End Time';
  if (action === 'checked_out') return 'Checked Out';
  if (action === 'force_released') return 'Staff Released Room';
  if (action === 'confirmed') return 'Booking Confirmed';
  if (action === 'cancelled') return 'Cancelled';
  if (action === 'expired') return 'Expired / No-show';
  return statusLabel(action);
}

export function colomboDateKey(time: Timestamp): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(time.toDate());
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function todayColomboKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function stateLabel(state: RoomStaffState): string {
  if (state === 'overstay') return 'Overstay';
  if (state === 'active') return 'Active';
  if (state === 'pending') return 'Pending';
  return 'Available';
}

export function statusLabel(status: BookingStatus | string): string {
  return status.replaceAll('_', ' ');
}
