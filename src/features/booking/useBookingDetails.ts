import { useEffect, useState } from 'react';
import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Booking, Room } from '@/types/models';
import { errorMessage } from './bookingDisplay';

export function useBookingDetails(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let stopped = false;
    if (!bookingId) return;
    const unsubscribe = onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
      if (!snapshot.exists()) { setError('Booking not found.'); return; }
      const data = { ...snapshot.data(), id: snapshot.id } as Booking;
      if (data.ownerId !== auth.currentUser?.uid) { setError('This is not your booking.'); return; }
      setBooking(data);
      void getDocFromServer(doc(db, 'rooms', data.roomId)).then((result) => {
        if (stopped) return;
        if (!result.exists()) { setError('Room not found.'); return; }
        setRoom({ ...result.data(), id: result.id } as Room);
      }).catch((failure: unknown) => { if (!stopped) setError(errorMessage(failure)); });
    }, (failure) => setError(errorMessage(failure)));
    return () => { stopped = true; unsubscribe(); };
  }, [bookingId, retry]);
  return { booking, room, error: bookingId ? error : 'Missing booking reference. Return to Rooms.', reload: () => { setBooking(null); setRoom(null); setError(''); setRetry((value) => value + 1); } };
}
