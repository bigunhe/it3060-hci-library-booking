import {
  collection,
  doc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';

import {
  BOOKING_DURATION_MINUTES,
  CHECK_IN_GRACE_MINUTES,
  HOLD_DURATION_MINUTES,
  LOCK_BLOCK_MINUTES,
  MIN_GROUP_SIZE,
  MAX_GROUP_SIZE,
} from '@/lib/bookingRules';
import { auth, db } from '@/lib/firebase';
import { getSlotLockIds } from '@/lib/slotLocks';
import type { Booking, GroupMember, SlotLock } from '@/types/models';

export async function createBookingHold(
  roomId: string,
  startAt: Timestamp
): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Sign in before selecting a slot.');
  }

  const startMs = startAt.toMillis();
  const endAt = Timestamp.fromMillis(
    startMs + BOOKING_DURATION_MINUTES * 60 * 1000
  );

  const lockIds = getSlotLockIds(roomId, startAt, endAt);
  const lockRefs = lockIds.map((id) => doc(db, 'slotLocks', id));
  const roomRef = doc(db, 'rooms', roomId);
  const occupancyRef = doc(db, 'roomOccupancy', roomId);

  // Generate one ID outside the callback so retries reuse it.
  const bookingRef = doc(collection(db, 'bookings'));

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists() || roomSnapshot.data().enabled !== true) {
      throw new Error('This room is unavailable for booking.');
    }

    const occupancySnapshot = await transaction.get(occupancyRef);
    const lockSnapshots = [];

    for (const lockRef of lockRefs) {
      lockSnapshots.push(await transaction.get(lockRef));
    }

    const now = Timestamp.now();

    if (
      occupancySnapshot.exists() &&
      occupancySnapshot.data().endAt.toMillis() <= now.toMillis()
    ) {
      throw new Error('This room is awaiting staff clearance after an overstay.');
    }

    if (startMs <= now.toMillis()) {
      throw new Error('Select a future time slot.');
    }

    for (const snapshot of lockSnapshots) {
      if (!snapshot.exists()) {
        continue;
      }

      const lock = snapshot.data() as SlotLock;

      const expiredHold =
        lock.state === 'held' &&
        lock.holdExpiresAt != null &&
        lock.holdExpiresAt.toMillis() <= now.toMillis();

      if (!expiredHold) {
        throw new Error('This slot was just taken. Choose another slot.');
      }
    }

    const holdExpiresAt = Timestamp.fromMillis(
      now.toMillis() + HOLD_DURATION_MINUTES * 60 * 1000
    );

    const booking: Omit<Booking, 'id'> = {
      ownerId: user.uid,
      roomId,
      groupName: '',
      members: [],
      purpose: '',
      startAt,
      endAt,
      originalEndAt: endAt,
      status: 'held',
      holdExpiresAt,
      checkInDeadline: Timestamp.fromMillis(
        startMs + CHECK_IN_GRACE_MINUTES * 60 * 1000
      ),
      checkedInAt: null,
      checkedInBy: null,
      checkedOutAt: null,
      extensionMinutes: 0,
      createdAt: now,
    };

    transaction.set(bookingRef, booking);

    for (let index = 0; index < lockRefs.length; index++) {
      const blockStartMs =
        startMs + index * LOCK_BLOCK_MINUTES * 60 * 1000;

      const lock: SlotLock = {
        bookingId: bookingRef.id,
        roomId,
        startAt: Timestamp.fromMillis(blockStartMs),
        endAt: Timestamp.fromMillis(
          blockStartMs + LOCK_BLOCK_MINUTES * 60 * 1000
        ),
        state: 'held',
        holdExpiresAt,
      };

      transaction.set(lockRefs[index], lock);
    }
  });

  return bookingRef.id;
}

export async function confirmBooking(
  bookingId: string,
  groupName: string,
  members: GroupMember[],
  purpose: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Sign in before confirming.');
  }

  const name = groupName.trim();
  const roster = members.map((member) => ({
    name: member.name.trim(),
    studentId: member.studentId.trim().toUpperCase(),
  }));

  if (!name) {
    throw new Error('Enter a group name.');
  }

  if (
    roster.length < MIN_GROUP_SIZE ||
    roster.length > MAX_GROUP_SIZE
  ) {
    throw new Error('A group must contain 3–8 members.');
  }

  if (roster.some((member) => !member.name || !member.studentId)) {
    throw new Error('Every member needs a name and student ID.');
  }

  const studentIds = new Set(roster.map((member) => member.studentId));

  if (studentIds.size !== roster.length) {
    throw new Error('Duplicate student IDs are not allowed.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const eventRef = doc(db, 'auditEvents', `${bookingId}_confirmed`);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);

    if (!snapshot.exists()) {
      throw new Error('Booking not found.');
    }

    const booking = snapshot.data() as Omit<Booking, 'id'>;

    if (booking.ownerId !== user.uid || booking.status !== 'held') {
      throw new Error('This is not your active booking hold.');
    }

    const roomRef = doc(db, 'rooms', booking.roomId);
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = roomSnapshot.data();

    if (
      room.enabled !== true ||
      roster.length < room.minCapacity ||
      roster.length > room.maxCapacity
    ) {
      throw new Error('This room cannot accommodate your group.');
    }

    const lockRefs = getSlotLockIds(
      booking.roomId,
      booking.startAt,
      booking.endAt
    ).map((id) => doc(db, 'slotLocks', id));

    // Read every lock before performing any writes.
    for (const lockRef of lockRefs) {
      const lockSnapshot = await transaction.get(lockRef);

      if (!lockSnapshot.exists()) {
        throw new Error('Your hold no longer owns this time slot.');
      }

      const lock = lockSnapshot.data() as SlotLock;

      if (
        lock.bookingId !== bookingId ||
        lock.state !== 'held' ||
        lock.holdExpiresAt?.toMillis() !==
          booking.holdExpiresAt.toMillis()
      ) {
        throw new Error('Your hold no longer owns this time slot.');
      }
    }

    const now = Timestamp.now();

    if (
      booking.holdExpiresAt.toMillis() <= now.toMillis() ||
      booking.startAt.toMillis() <= now.toMillis()
    ) {
      throw new Error('Your hold expired. Select the slot again.');
    }

    transaction.update(bookingRef, {
      groupName: name,
      members: roster,
      purpose: purpose.trim(),
      status: 'confirmed',
    });

    for (const lockRef of lockRefs) {
      transaction.update(lockRef, {
        state: 'reserved',
        holdExpiresAt: null,
      });
    }

    transaction.set(eventRef, {
      bookingId,
      actorId: user.uid,
      action: 'confirmed',
      createdAt: now,
    });
  });
}