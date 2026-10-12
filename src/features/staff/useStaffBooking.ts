import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AuditEvent, Booking, Room, RoomOccupancy } from '@/types/models';
import { errorMessage } from '@/features/booking/bookingDisplay';

type RecordState = { id: string; booking: Booking | null; room: Room | null; occupancy: RoomOccupancy | null; events: AuditEvent[]; loading: boolean; error: string };
export function useStaffBooking(bookingId: string) {
  const [state, setState] = useState<RecordState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const valid = /^[A-Za-z0-9]{20}$/.test(bookingId);
  useEffect(() => {
    if (!valid) return;
    let stopped = false; let stopRoom: (() => void) | undefined; let stopOccupancy: (() => void) | undefined;
    const ready = [false, false, false, false];
    const record: RecordState = { id: bookingId, booking: null, room: null, occupancy: null, events: [], loading: true, error: '' };
    const publish = () => { if (!stopped) setState({ ...record, loading: !ready.every(Boolean) && !record.error }); };
    const fail = (error: Error) => { record.error = errorMessage(error); publish(); };
    const stopBooking = onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
      stopRoom?.(); stopOccupancy?.(); ready[1] = false; ready[2] = false;
      if (!snapshot.exists()) { record.booking = null; fail(new Error('Booking not found.')); return; }
      record.booking = { ...snapshot.data(), id: snapshot.id } as Booking; ready[0] = true;
      const roomId = record.booking.roomId;
      stopRoom = onSnapshot(doc(db, 'rooms', roomId), (roomSnapshot) => {
        record.room = roomSnapshot.exists() ? { ...roomSnapshot.data(), id: roomSnapshot.id } as Room : null;
        ready[1] = true; publish();
      }, fail);
      stopOccupancy = onSnapshot(doc(db, 'roomOccupancy', roomId), (snapshot) => {
        record.occupancy = snapshot.exists() ? snapshot.data() as RoomOccupancy : null; ready[2] = true; publish();
      }, fail);
      publish();
    }, fail);
    const stopEvents = onSnapshot(query(collection(db, 'auditEvents'), where('bookingId', '==', bookingId)), (snapshot) => {
      record.events = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AuditEvent)).sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
      ready[3] = true; publish();
    }, fail);
    return () => { stopped = true; stopBooking(); stopRoom?.(); stopOccupancy?.(); stopEvents(); };
  }, [bookingId, attempt, valid]);
  const current = state?.id === bookingId ? state : null;
  return { booking: current?.booking ?? null, room: current?.room ?? null, occupancy: current?.occupancy ?? null,
    events: current?.events ?? [], loading: valid && (current?.loading ?? true),
    error: valid ? current?.error ?? '' : bookingId ? 'Invalid booking reference. Use the full 20-character reference or pass QR.' : '',
    reload: () => setAttempt((value) => value + 1) };
}
