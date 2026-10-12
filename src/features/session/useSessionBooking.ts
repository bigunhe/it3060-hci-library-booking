import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '@/lib/firebase';
import type { Booking, Room } from '@/types/models';
import { errorMessage, useClock } from '@/features/booking/bookingDisplay';

// Every session route observes the same booking; staff activation updates it live.
export function useSessionBooking() {
  const params = useLocalSearchParams<{ bookingId?: string | string[]; preview?: string | string[] }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const preview = params.preview === '1';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const now = useClock();

  useEffect(() => {
    let stopBooking: (() => void) | undefined;
    let stopped = false;
    let generation = 0;
    if (!/^[A-Za-z0-9]{20}$/.test(bookingId)) return;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      generation += 1;
      const currentGeneration = generation;
      stopBooking?.(); setBooking(null); setRoom(null);
      if (!user) { setError('Sign in to view your reservations.'); setLoading(false); return; }
      setError(''); setLoading(true);
      stopBooking = onSnapshot(doc(db, 'bookings', bookingId), (snapshot) => {
        if (!snapshot.exists()) { setBooking(null); setError('Booking not found.'); setLoading(false); return; }
        const data = { ...snapshot.data(), id: snapshot.id } as Booking;
        if (data.ownerId !== user.uid) { setBooking(null); setError('This reservation belongs to another account.'); setLoading(false); return; }
        setBooking(data); setError(''); setLoading(false);
        void getDoc(doc(db, 'rooms', data.roomId)).then((result) => {
          if (stopped || currentGeneration !== generation) return;
          if (!result.exists()) { setRoom(null); setError('Room details are unavailable.'); return; }
          setRoom({ ...result.data(), id: result.id } as Room);
        }).catch((failure: unknown) => {
          if (!stopped && currentGeneration === generation) setError(errorMessage(failure));
        });
      }, (failure) => { setBooking(null); setError(errorMessage(failure)); setLoading(false); });
    });
    return () => { stopped = true; generation += 1; stopAuth(); stopBooking?.(); };
  }, [bookingId, attempt]);

  const validId = /^[A-Za-z0-9]{20}$/.test(bookingId);
  return { bookingId, preview, booking: booking?.id === bookingId ? booking : null, room,
    error: validId ? error : 'Missing or invalid booking reference. Return to My Passes.',
    loading: validId && loading, now,
    reload: () => setAttempt((value) => value + 1) };
}
