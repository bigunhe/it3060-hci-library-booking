import { doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { readOwnedBookingLocks } from '@/lib/bookingLocks';
import { checkBookingConflict } from '@/lib/bookingConflicts';
import { getSlotLockIds } from '@/lib/slotLocks';
import type { Booking, SlotLock } from '@/types/models';

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  return user;
}

export async function cancelReservation(bookingId: string): Promise<void> {
  const user = requireUser();
  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_cancelled`);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('Booking not found.');
    const booking = snapshot.data() as Omit<Booking, 'id'>;
    if (booking.ownerId !== user.uid || booking.status !== 'confirmed') {
      throw new Error('Only your confirmed reservation can be cancelled.');
    }
    const locks = await readOwnedBookingLocks(transaction, bookingId, booking);
    const now = Timestamp.now();
    transaction.update(bookingRef, { status: 'cancelled' });
    for (const ref of locks) transaction.delete(ref);
    transaction.set(eventRef, { bookingId, actorId: user.uid, action: 'cancelled', createdAt: now });
  });
}

export async function checkoutBooking(bookingId: string): Promise<void> {
  const user = requireUser();
  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_checked_out`);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('Booking not found.');
    const booking = snapshot.data() as Omit<Booking, 'id'>;
    if (booking.ownerId !== user.uid || booking.status !== 'active') {
      throw new Error('Only your active session can be checked out.');
    }
    const occupancyRef = doc(db, 'roomOccupancy', booking.roomId);
    const occupancy = await transaction.get(occupancyRef);
    if (!occupancy.exists() || occupancy.data().bookingId !== bookingId) {
      throw new Error('Room occupancy does not match this session. Contact staff.');
    }
    const locks = await readOwnedBookingLocks(transaction, bookingId, booking);
    const now = Timestamp.now();
    transaction.update(bookingRef, { status: 'completed', checkedOutAt: now });
    for (const ref of locks) transaction.delete(ref);
    transaction.delete(occupancyRef);
    transaction.set(eventRef, { bookingId, actorId: user.uid, action: 'checked_out', createdAt: now });
  });
}

export async function extendBooking(bookingId: string, minutes: 15 | 30): Promise<void> {
  if (minutes !== 15 && minutes !== 30) throw new Error('Choose 15 or 30 minutes.');
  const user = requireUser();
  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_extended`);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('Booking not found.');
    const booking = snapshot.data() as Omit<Booking, 'id'>;
    if (booking.ownerId !== user.uid || booking.status !== 'active') {
      throw new Error('Only your active session can be extended.');
    }
    if (booking.extensionMinutes !== 0) throw new Error('This session has already used its one extension.');
    const newEnd = Timestamp.fromMillis(booking.endAt.toMillis() + minutes * 60000);
    // Same account guard as hold creation; the extension interval starts at the old end.
    const guardRef = await checkBookingConflict(transaction, user.uid, booking.endAt.toMillis(), newEnd.toMillis());
    const occupancyRef = doc(db, 'roomOccupancy', booking.roomId);
    const occupancy = await transaction.get(occupancyRef);
    if (!occupancy.exists() || occupancy.data().bookingId !== bookingId ||
      occupancy.data().endAt.toMillis() !== booking.endAt.toMillis()) {
      throw new Error('Room occupancy is inconsistent. Contact staff.');
    }
    const eligibilityEnd = Timestamp.fromMillis(booking.endAt.toMillis() + 60 * 60000);
    const refs = getSlotLockIds(booking.roomId, booking.endAt, eligibilityEnd)
      .map((id) => doc(db, 'slotLocks', id));
    const snapshots = [];
    for (const ref of refs) snapshots.push(await transaction.get(ref));
    const now = Timestamp.now();
    if (now.toMillis() >= booking.endAt.toMillis()) throw new Error('The session has ended. Please check out.');
    for (const item of snapshots) {
      if (!item.exists()) continue;
      const lock = item.data() as SlotLock;
      const expiredHold = lock.state === 'held' && lock.holdExpiresAt !== null && lock.holdExpiresAt.toMillis() <= now.toMillis();
      if (!expiredHold) throw new Error('The entire next hour must be free. Another booking or hold blocks this extension.');
    }
    // Check all four blocks, but reserve only the requested 15/30 minutes.
    for (let index = 0; index < minutes / 15; index++) {
      const blockStart = booking.endAt.toMillis() + index * 15 * 60000;
      const lock: SlotLock = { bookingId, roomId: booking.roomId,
        startAt: Timestamp.fromMillis(blockStart), endAt: Timestamp.fromMillis(blockStart + 15 * 60000),
        state: 'reserved', holdExpiresAt: null };
      transaction.set(refs[index], lock);
    }
    transaction.set(guardRef, { updatedAt: serverTimestamp() });
    transaction.update(bookingRef, { endAt: newEnd, extensionMinutes: minutes });
    transaction.update(occupancyRef, { endAt: newEnd });
    transaction.set(eventRef, { bookingId, actorId: user.uid, action: 'extended', createdAt: now });
  });
}
