import { doc, runTransaction, Timestamp } from 'firebase/firestore';

import { readOwnedBookingLocks } from '@/lib/bookingLocks';
import { auth, db } from '@/lib/firebase';
import type { Booking } from '@/types/models';

export async function cancelBookingHold(
  bookingId: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Sign in before cancelling.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_cancelled`);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);

    if (!snapshot.exists()) {
      throw new Error('Booking not found.');
    }

    const booking = snapshot.data() as Omit<Booking, 'id'>;

    if (booking.ownerId !== user.uid) {
      throw new Error('This booking does not belong to you.');
    }

    if (booking.status !== 'held') {
      throw new Error('Only a temporary hold can be cancelled here.');
    }

    const lockRefs = await readOwnedBookingLocks(
      transaction,
      bookingId,
      booking
    );

    transaction.update(bookingRef, {
      status: 'cancelled',
    });

    for (const ref of lockRefs) {
      transaction.delete(ref);
    }

    transaction.set(eventRef, {
      bookingId,
      actorId: user.uid,
      action: 'cancelled',
      createdAt: Timestamp.now(),
    });
  });
}