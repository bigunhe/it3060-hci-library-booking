import {
  doc,
  type DocumentReference,
  type Transaction,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getSlotLockIds } from '@/lib/slotLocks';
import type { Booking, SlotLock } from '@/types/models';

export async function readOwnedBookingLocks(
  transaction: Transaction,
  bookingId: string,
  booking: Omit<Booking, 'id'>
): Promise<DocumentReference[]> {
  const lockIds = getSlotLockIds(
    booking.roomId,
    booking.startAt,
    booking.endAt
  );

  const ownedRefs: DocumentReference[] = [];

  for (const id of lockIds) {
    const ref = doc(db, 'slotLocks', id);
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      if (booking.status === 'held' || booking.status === 'expired') {
        continue;
      }

      throw new Error('Reservation lock missing. Contact staff.');
    }

    const lock = snapshot.data() as SlotLock;

    if (lock.bookingId !== bookingId) {
      if (booking.status === 'held' || booking.status === 'expired') {
        continue;
      }

      throw new Error('Reservation lock conflict. Contact staff.');
    }

    ownedRefs.push(ref);
  }

  return ownedRefs;
}