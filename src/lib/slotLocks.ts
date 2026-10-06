import { Timestamp } from 'firebase/firestore';

import { LOCK_BLOCK_MINUTES } from '@/lib/bookingRules';

export function getSlotLockIds(
  roomId: string,
  startAt: Timestamp,
  endAt: Timestamp
): string[] {
  const blockMs = LOCK_BLOCK_MINUTES * 60 * 1000;
  const startMs = startAt.toMillis();
  const endMs = endAt.toMillis();

  if (!roomId || roomId.includes('/')) {
    throw new Error('Invalid room ID.');
  }

  if (
    endMs <= startMs ||
    startMs % blockMs !== 0 ||
    endMs % blockMs !== 0
  ) {
    throw new Error('Time range must align with 15-minute boundaries.');
  }

  const ids: string[] = [];

  for (let time = startMs; time < endMs; time += blockMs) {
    ids.push(`${roomId}_${time}`);
  }

  return ids;
}