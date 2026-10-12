import { collection, doc, getDocFromServer, getDocsFromServer, onSnapshot, query, where } from 'firebase/firestore';
import { expireBooking } from '@/lib/expireBooking';
import { db } from '@/lib/firebase';
import type { AuditEvent, Booking, Room, RoomOccupancy } from '@/types/models';
import { requireStaffProfile, resolveStaffBookingId } from './staffOperations';

export type RoomStaffState = 'available' | 'pending' | 'active' | 'overstay';
export type StaffRoomRow = {
  room: Room; state: RoomStaffState; occupancy: (RoomOccupancy & { roomId: string }) | null;
  occupancyBooking: Booking | null; pendingBookings: Booking[]; nextBooking: Booking | null;
};

export function buildStaffRoomRows(rooms: Room[], occupancyByRoom: Map<string, RoomOccupancy & { roomId: string }>, bookings: Booking[], now: number): StaffRoomRow[] {
  return rooms.filter((room) => room.enabled).map((room) => {
    const occupancy = occupancyByRoom.get(room.id) ?? null;
    const pendingBookings = bookings.filter((booking) => booking.roomId === room.id && booking.status === 'confirmed')
      .sort((a, b) => a.startAt.toMillis() - b.startAt.toMillis());
    const occupancyBooking = occupancy ? bookings.find((booking) => booking.id === occupancy.bookingId) ?? null : null;
    const nextBooking = bookings.filter((booking) => booking.roomId === room.id && booking.id !== occupancy?.bookingId &&
      ['confirmed', 'active'].includes(booking.status) && booking.startAt.toMillis() > now)
      .sort((a, b) => a.startAt.toMillis() - b.startAt.toMillis())[0] ?? null;
    const state: RoomStaffState = occupancy ? occupancy.endAt.toMillis() <= now ? 'overstay' : 'active' : pendingBookings.length ? 'pending' : 'available';
    return { room, occupancy, occupancyBooking, pendingBookings, nextBooking, state };
  }).sort((a, b) => a.room.name.localeCompare(b.room.name));
}

// Public room state + staff-only bookings. All three listeners must load before display.
export function subscribeStaffRooms(onChange: (rows: StaffRoomRow[]) => void, onError: (error: Error) => void): () => void {
  let rooms: Room[] = []; let bookings: Booking[] = [];
  const occupancy = new Map<string, RoomOccupancy & { roomId: string }>();
  const ready = [false, false, false]; let failed = false; let stopped = false;
  const report = (error: Error) => { failed = true; onError(error); };
  const publish = () => { if (!stopped && !failed && ready.every(Boolean)) onChange(buildStaffRoomRows(rooms, occupancy, bookings, Date.now())); };
  const stopRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
    rooms = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Room)); ready[0] = true; publish();
  }, report);
  const stopOccupancy = onSnapshot(collection(db, 'roomOccupancy'), (snapshot) => {
    occupancy.clear(); snapshot.docs.forEach((item) => occupancy.set(item.id, { ...item.data(), roomId: item.id } as RoomOccupancy & { roomId: string }));
    ready[1] = true; publish();
  }, report);
  const stopBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
    bookings = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Booking)); ready[2] = true; publish();
  }, report);
  const timer = setInterval(publish, 1000);
  return () => { stopped = true; stopRooms(); stopOccupancy(); stopBookings(); clearInterval(timer); };
}

export async function expireDueNoShows(): Promise<string[]> {
  await requireStaffProfile();
  const snapshot = await getDocsFromServer(query(collection(db, 'bookings'), where('status', '==', 'confirmed')));
  const now = Date.now(); const notes: string[] = [];
  for (const item of snapshot.docs) {
    const booking = item.data() as Omit<Booking, 'id'>;
    if (booking.checkInDeadline.toMillis() >= now) continue;
    try { await expireBooking(item.id); notes.push(`Released missed check-in ${item.id}.`); }
    catch (error) { notes.push(error instanceof Error ? error.message : `Could not release missed booking ${item.id}.`); }
  }
  return notes;
}

export async function loadStaffRooms(): Promise<StaffRoomRow[]> {
  await requireStaffProfile();
  const [rooms, occupied, bookings] = await Promise.all([
    getDocsFromServer(collection(db, 'rooms')), getDocsFromServer(collection(db, 'roomOccupancy')), getDocsFromServer(collection(db, 'bookings')),
  ]);
  const map = new Map<string, RoomOccupancy & { roomId: string }>();
  occupied.docs.forEach((item) => map.set(item.id, { ...item.data(), roomId: item.id } as RoomOccupancy & { roomId: string }));
  return buildStaffRoomRows(rooms.docs.map((item) => ({ ...item.data(), id: item.id } as Room)), map,
    bookings.docs.map((item) => ({ ...item.data(), id: item.id } as Booking)), Date.now());
}

export async function loadStaffBooking(bookingId: string): Promise<Booking> {
  await requireStaffProfile();
  const id = resolveStaffBookingId(bookingId);
  const snapshot = await getDocFromServer(doc(db, 'bookings', id));
  if (!snapshot.exists()) throw new Error('Booking not found.');
  return { ...snapshot.data(), id: snapshot.id } as Booking;
}
export async function loadStaffAuditEvents(bookingId?: string): Promise<AuditEvent[]> {
  await requireStaffProfile();
  const snapshot = await getDocsFromServer(bookingId ? query(collection(db, 'auditEvents'), where('bookingId', '==', bookingId)) : collection(db, 'auditEvents'));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AuditEvent)).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}
export async function loadRoom(roomId: string): Promise<Room | null> {
  const snapshot = await getDocFromServer(doc(db, 'rooms', roomId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Room : null;
}
export async function loadRoomName(roomId: string): Promise<string> { return (await loadRoom(roomId))?.name ?? roomId; }
export type StaffLedgerRow = { booking: Booking; room: Room | null };
export async function loadStaffLedger(): Promise<StaffLedgerRow[]> {
  await requireStaffProfile();
  const [bookingSnap, roomSnap] = await Promise.all([getDocsFromServer(collection(db, 'bookings')), getDocsFromServer(collection(db, 'rooms'))]);
  const rooms = new Map(roomSnap.docs.map((item) => [item.id, { ...item.data(), id: item.id } as Room]));
  return bookingSnap.docs.map((item) => ({ booking: { ...item.data(), id: item.id } as Booking, room: rooms.get(item.data().roomId) ?? null }))
    .filter((row) => row.booking.status !== 'held').sort((a, b) => b.booking.startAt.toMillis() - a.booking.startAt.toMillis());
}
