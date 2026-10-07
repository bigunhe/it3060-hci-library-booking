import type { Timestamp } from 'firebase/firestore';

import { DISPLAY_TIME_ZONE } from '@/lib/bookingRules';
import type { BookingStatus } from '@/types/models';

import type { RoomStaffState } from './staffQueries';

export function formatColombo(time: Timestamp): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(time.toDate());
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
