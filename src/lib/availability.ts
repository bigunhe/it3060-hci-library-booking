import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { RoomOccupancy, SlotLock } from '@/types/models';

export interface RoomAvailability {
  blockedStarts: number[];
  overstaying: boolean;
}

// A preview only. Creating a hold or extending must recheck in a transaction.
export function subscribeRoomAvailability(
  roomId: string,
  startAt: Timestamp,
  endAt: Timestamp,
  onChange: (availability: RoomAvailability) => void,
  onError: (error: Error) => void
): () => void {
  if (!roomId || startAt.toMillis() >= endAt.toMillis()) {
    throw new Error('Select a room and a valid time range.');
  }

  let locks: SlotLock[] = [];
  let occupancy: RoomOccupancy | null = null;
  let locksReady = false;
  let occupancyReady = false;
  let stopped = false;
  let failed = false;

  function reportError(error: Error) {
    failed = true;
    onError(error);
  }

  function publish() {
    if (stopped || failed || !locksReady || !occupancyReady) return;
    const now = Timestamp.now().toMillis();
    onChange({
      overstaying: occupancy != null && occupancy.endAt.toMillis() <= now,
      blockedStarts: locks
        .filter((lock) =>
          lock.startAt.toMillis() < endAt.toMillis() &&
          lock.endAt.toMillis() > startAt.toMillis() &&
          (lock.state === 'reserved' ||
            (lock.holdExpiresAt != null && lock.holdExpiresAt.toMillis() > now))
        )
        .map((lock) => lock.startAt.toMillis()),
    });
  }

  const stopLocks = onSnapshot(
    query(collection(db, 'slotLocks'), where('roomId', '==', roomId)),
    (snapshot) => {
      locks = snapshot.docs.map((item) => item.data() as SlotLock);
      locksReady = true;
      publish();
    },
    reportError
  );

  const stopOccupancy = onSnapshot(
    doc(db, 'roomOccupancy', roomId),
    (snapshot) => {
      occupancy = snapshot.exists() ? snapshot.data() as RoomOccupancy : null;
      occupancyReady = true;
      publish();
    },
    reportError
  );

  // Expired holds stop blocking even when no new database write occurs.
  const timer = setInterval(publish, 15000);

  return () => {
    stopped = true;
    stopLocks();
    stopOccupancy();
    clearInterval(timer);
  };
}
