import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  where,
} from 'firebase/firestore';

import { expireBooking } from '@/lib/expireBooking';
import { db } from '@/lib/firebase';
import type {
  AuditEvent,
  Booking,
  Room,
  RoomOccupancy,
} from '@/types/models';

import { requireStaffProfile, resolveStaffBookingId } from './staffOperations';

export type RoomStaffState = 'available' | 'pending' | 'active' | 'overstay';

export type StaffRoomRow = {
  room: Room;
  state: RoomStaffState;
  occupancy: (RoomOccupancy & { roomId: string }) | null;
  pendingBookings: Booking[];
};

function asBooking(id: string, data: Omit<Booking, 'id'>): Booking {
  return { ...data, id };
}

export async function expireDueNoShows(): Promise<string[]> {
  await requireStaffProfile();

  const snapshot = await getDocsFromServer(
    query(collection(db, 'bookings'), where('status', '==', 'confirmed'))
  );
  const now = Date.now();
  const notes: string[] = [];

  for (const item of snapshot.docs) {
    const booking = item.data() as Omit<Booking, 'id'>;
    if (booking.checkInDeadline.toMillis() >= now) {
      continue;
    }

    try {
      await expireBooking(item.id);
      notes.push(`Expired missed check-in ${item.id}.`);
    } catch (error) {
      notes.push(
        error instanceof Error
          ? error.message
          : `Could not expire missed booking ${item.id}.`
      );
    }
  }

  return notes;
}

export async function loadStaffRooms(): Promise<StaffRoomRow[]> {
  await requireStaffProfile();

  const [roomSnap, occupancySnap, bookingSnap] = await Promise.all([
    getDocsFromServer(collection(db, 'rooms')),
    getDocsFromServer(collection(db, 'roomOccupancy')),
    getDocsFromServer(collection(db, 'bookings')),
  ]);

  const occupancyByRoom = new Map<string, RoomOccupancy & { roomId: string }>();
  for (const item of occupancySnap.docs) {
    occupancyByRoom.set(item.id, {
      ...(item.data() as RoomOccupancy),
      roomId: item.id,
    });
  }

  const bookings = bookingSnap.docs.map((item) =>
    asBooking(item.id, item.data() as Omit<Booking, 'id'>)
  );
  const now = Date.now();

  return roomSnap.docs
    .map((item) => {
      const room = { ...(item.data() as Omit<Room, 'id'>), id: item.id };
      const occupancy = occupancyByRoom.get(room.id) ?? null;
      const pendingBookings = bookings.filter(
        (booking) =>
          booking.roomId === room.id && booking.status === 'confirmed'
      );

      let state: RoomStaffState = 'available';
      if (occupancy && occupancy.endAt.toMillis() <= now) {
        state = 'overstay';
      } else if (occupancy) {
        state = 'active';
      } else if (pendingBookings.length > 0) {
        state = 'pending';
      }

      return { room, state, occupancy, pendingBookings };
    })
    .sort((a, b) => a.room.name.localeCompare(b.room.name));
}

export async function loadStaffBooking(bookingId: string): Promise<Booking> {
  await requireStaffProfile();
  const id = resolveStaffBookingId(bookingId);
  const snapshot = await getDocFromServer(doc(db, 'bookings', id));
  if (!snapshot.exists()) {
    throw new Error('Booking not found.');
  }
  return asBooking(snapshot.id, snapshot.data() as Omit<Booking, 'id'>);
}

export async function loadStaffAuditEvents(bookingId?: string): Promise<AuditEvent[]> {
  await requireStaffProfile();

  const snapshot = bookingId
    ? await getDocsFromServer(
        query(collection(db, 'auditEvents'), where('bookingId', '==', bookingId))
      )
    : await getDocsFromServer(collection(db, 'auditEvents'));

  return snapshot.docs
    .map((item) => ({
      ...(item.data() as Omit<AuditEvent, 'id'>),
      id: item.id,
    }))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function loadRoomName(roomId: string): Promise<string> {
  const snapshot = await getDocFromServer(doc(db, 'rooms', roomId));
  if (!snapshot.exists()) {
    return roomId;
  }
  const room = snapshot.data() as Omit<Room, 'id'>;
  return room.name;
}
