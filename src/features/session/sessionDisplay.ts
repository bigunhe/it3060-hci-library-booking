import type { Booking, BookingStatus } from '@/types/models';

export function displayStatus(booking: Booking, now: number): BookingStatus {
  if (booking.status === 'held' && booking.holdExpiresAt.toMillis() <= now) return 'expired';
  if (booking.status === 'confirmed' && booking.checkInDeadline.toMillis() < now) return 'expired';
  return booking.status;
}

export function countdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function bookingReference(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}
