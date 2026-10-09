import {
  collection,
  doc,
  getDocsFromServer,
  query,
  where,
  type Transaction,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Booking } from '@/types/models';

export async function checkBookingConflict(
  transaction: Transaction,
  uid: string,
  startMs: number,
  endMs: number
) {
  const guardRef = doc(db, 'bookingGuards', uid);

  // Every booking attempt reads and updates the same account document.
  // If another attempt succeeds first, this transaction retries.
  await transaction.get(guardRef);

  // This query runs again when the transaction retries.
  const snapshot = await getDocsFromServer(
    query(
      collection(db, 'bookings'),
      where('ownerId', '==', uid)
    )
  );

  const now = Date.now();

  for (const item of snapshot.docs) {
    const booking = item.data() as Booking;

    const blocksTime =
      booking.status === 'confirmed' ||
      booking.status === 'active' ||
      (
        booking.status === 'held' &&
        booking.holdExpiresAt.toMillis() > now
      );

    const overlaps =
      booking.startAt.toMillis() < endMs &&
      booking.endAt.toMillis() > startMs;

    if (blocksTime && overlaps) {
      throw new Error(
        'You already have a booking or temporary hold during this time. ' +
        'Choose another time or cancel the existing booking.'
      );
    }
  }

  return guardRef;
}