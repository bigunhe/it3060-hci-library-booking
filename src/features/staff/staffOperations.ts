import {
  doc,
  getDocFromServer,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';

import { readOwnedBookingLocks } from '@/lib/bookingLocks';
import { readPassPayload } from '@/lib/bookingPass';
import { auth, db } from '@/lib/firebase';
import type { Booking, UserProfile } from '@/types/models';

export function resolveStaffBookingId(input: string): string {
  const text = input.trim();
  if (!text) {
    throw new Error('Enter a booking reference or pass QR text.');
  }

  if (text.startsWith('SLIIT-LIBRARY:1:')) {
    return readPassPayload(text);
  }

  if (!/^[A-Za-z0-9]{20}$/.test(text)) {
    throw new Error('Invalid booking reference.');
  }

  return text;
}

export async function requireStaffProfile(): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in first.');
  }

  const snapshot = await getDocFromServer(doc(db, 'users', user.uid));
  if (!snapshot.exists()) {
    throw new Error('Staff access is required.');
  }

  const profile = {
    ...(snapshot.data() as Omit<UserProfile, 'id'>),
    id: snapshot.id,
  };

  if (profile.role !== 'staff') {
    throw new Error('Students cannot use staff operations.');
  }

  return profile;
}

function explainCheckInBlock(
  booking: Omit<Booking, 'id'>,
  occupied: boolean,
  nowMs: number
): string | null {
  if (booking.status === 'cancelled') {
    return 'This pass was cancelled.';
  }
  if (booking.status === 'expired') {
    return 'This booking has expired.';
  }
  if (booking.status === 'completed') {
    return 'This pass has already been used.';
  }
  if (booking.status === 'active') {
    return 'This booking is already checked in.';
  }
  if (booking.status === 'held') {
    return 'This booking is not confirmed yet.';
  }
  if (booking.status !== 'confirmed') {
    return `This booking cannot be checked in (${booking.status}).`;
  }
  if (nowMs < booking.startAt.toMillis()) {
    return 'Check-in opens at the reservation start time.';
  }
  if (nowMs > booking.checkInDeadline.toMillis()) {
    return 'The check-in window has closed. This is a missed grace deadline.';
  }
  if (occupied) {
    return 'Another session is still occupying this room. Clear it first.';
  }
  return null;
}

export async function checkInBooking(bookingId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in first.');
  }
  if (!bookingId) {
    throw new Error('Missing booking reference.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const profileRef = doc(db, 'users', user.uid);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_checked_in`);

  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists()) {
      throw new Error('Booking not found.');
    }

    const booking = bookingSnapshot.data() as Omit<Booking, 'id'>;
    const profileSnapshot = await transaction.get(profileRef);
    const occupancyRef = doc(db, 'roomOccupancy', booking.roomId);
    const occupancySnapshot = await transaction.get(occupancyRef);

    if (!profileSnapshot.exists() || profileSnapshot.data().role !== 'staff') {
      throw new Error('Staff access is required.');
    }

    const now = Timestamp.now();
    const blocked = explainCheckInBlock(
      booking,
      occupancySnapshot.exists(),
      now.toMillis()
    );
    if (blocked) {
      throw new Error(blocked);
    }

    transaction.update(bookingRef, {
      status: 'active',
      checkedInAt: now,
      checkedInBy: user.uid,
    });
    transaction.set(occupancyRef, {
      bookingId,
      endAt: booking.endAt,
    });
    transaction.set(eventRef, {
      bookingId,
      actorId: user.uid,
      action: 'checked_in',
      createdAt: now,
    });
  });
}

export async function forceReleaseBooking(bookingId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in first.');
  }
  if (!bookingId) {
    throw new Error('Missing booking reference.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const profileRef = doc(db, 'users', user.uid);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_force_released`);

  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists()) {
      throw new Error('Booking not found.');
    }

    const booking = bookingSnapshot.data() as Omit<Booking, 'id'>;
    const profileSnapshot = await transaction.get(profileRef);
    const occupancyRef = doc(db, 'roomOccupancy', booking.roomId);
    const occupancySnapshot = await transaction.get(occupancyRef);
    const locks = await readOwnedBookingLocks(transaction, bookingId, booking);

    if (!profileSnapshot.exists() || profileSnapshot.data().role !== 'staff') {
      throw new Error('Staff access is required.');
    }
    if (booking.status !== 'active') {
      throw new Error('Only an active overstay can be released by staff.');
    }

    const now = Timestamp.now();
    if (now.toMillis() < booking.endAt.toMillis()) {
      throw new Error('Staff release is only allowed after the session end time.');
    }
    if (!occupancySnapshot.exists() || occupancySnapshot.data().bookingId !== bookingId) {
      throw new Error('Occupancy does not match this booking. Refresh the dashboard.');
    }

    transaction.update(bookingRef, {
      status: 'completed',
      checkedOutAt: now,
    });
    for (const lockRef of locks) {
      transaction.delete(lockRef);
    }
    transaction.delete(occupancyRef);
    transaction.set(eventRef, {
      bookingId,
      actorId: user.uid,
      action: 'force_released',
      createdAt: now,
    });
  });
}
