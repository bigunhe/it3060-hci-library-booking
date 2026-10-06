import { doc, runTransaction, Timestamp } from 'firebase/firestore';

import { readOwnedBookingLocks } from '@/lib/bookingLocks';
import { auth, db } from '@/lib/firebase';
import type { Booking } from '@/types/models';

// Owner/staff cleanup; this is not a scheduled background service.
export async function expireBooking(bookingId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  if (!bookingId) throw new Error('Missing booking reference.');

  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_expired`);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) throw new Error('Booking not found.');
    const booking = snapshot.data() as Omit<Booking, 'id'>;

    if (booking.ownerId !== user.uid) {
      const profile = await transaction.get(doc(db, 'users', user.uid));
      if (!profile.exists() || profile.data().role !== 'staff') {
        throw new Error('Only the owner or staff can expire this booking.');
      }
    }

    if (booking.status === 'expired') return;
    const locks = await readOwnedBookingLocks(transaction, bookingId, booking);
    const now = Timestamp.now();
    const due =
      (booking.status === 'held' && booking.holdExpiresAt.toMillis() <= now.toMillis()) ||
      (booking.status === 'confirmed' && booking.checkInDeadline.toMillis() < now.toMillis());

    if (!due) throw new Error('This booking cannot expire yet.');

    transaction.update(bookingRef, { status: 'expired' });
    for (const ref of locks) transaction.delete(ref);
    transaction.set(eventRef, {
      bookingId,
      actorId: user.uid,
      action: 'expired',
      createdAt: now,
    });
  });
}
