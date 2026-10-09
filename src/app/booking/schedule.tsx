import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDocFromServer, Timestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/constants/theme';
import { BookingScreen, goBack, Notice, ui } from '@/features/booking/BookingUI';
import { dateLabel, dayRange, errorMessage, HOUR_MS, localDate, slotFree, slotStarts, timeLabel, useClock, validDate } from '@/features/booking/bookingDisplay';
import { subscribeRoomAvailability, type RoomAvailability } from '@/lib/availability';
import { createBookingHold } from '@/lib/bookings';
import { db } from '@/lib/firebase';
import type { Room } from '@/types/models';

export default function Schedule() {
  const { roomId = '', date = '', groupId = '' } = useLocalSearchParams<{ roomId?: string; date?: string; groupId?: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const now = useClock();
  useEffect(() => {
    let stopped = false;
    if (!roomId || !validDate(date)) return;
    void getDocFromServer(doc(db, 'rooms', roomId)).then((snapshot) => {
      if (stopped) return;
      if (!snapshot.exists() || !snapshot.data().enabled) throw new Error('This room is unavailable.');
      setRoom({ ...snapshot.data(), id: snapshot.id } as Room);
    }).catch((failure: unknown) => { if (!stopped) setLoadError(errorMessage(failure)); });
    const [start, end] = dayRange(date);
    const unsubscribe = subscribeRoomAvailability(roomId, start, end, setAvailability, (failure) => setLoadError(errorMessage(failure)));
    return () => { stopped = true; unsubscribe(); };
  }, [roomId, date, retry]);
  const displayedError = !roomId || !validDate(date) ? 'Invalid room or date. Return to Rooms.' : loadError;
  const canContinue = !!room && !!availability && !displayedError && selected !== null && selected > now && slotFree(selected, availability);
  async function continueBooking() {
    if (!canContinue || selected === null || submitting.current) return;
    submitting.current = true; setBusy(true); setActionError('');
    try {
      const bookingId = await createBookingHold(roomId, Timestamp.fromMillis(selected));
      router.push({ pathname: '/booking/group', params: { bookingId, groupId } });
    } catch (failure) { setActionError(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <BookingScreen title="Select Time Slot" subtitle={room ? `${room.name} · Level ${room.level}` : 'Room schedule'} onBack={busy ? undefined : goBack} footer={<>
    <Text style={ui.muted}>Selected slot</Text><Text style={ui.heading}>{selected ? `${timeLabel(selected)} – ${timeLabel(selected + HOUR_MS)}` : 'Choose an available slot'}</Text>
    <AppButton title="Continue to Group Setup" disabled={!canContinue} loading={busy} onPress={() => void continueBooking()} />
  </>}>
    {displayedError ? <><Notice text={displayedError} error /><AppButton title="Retry" variant="secondary" onPress={() => { setRoom(null); setAvailability(null); setLoadError(''); setSelected(null); setRetry((value) => value + 1); }} /></> : !room || !availability ? <ActivityIndicator color={colors.primary} /> : <>
      <View style={ui.notice}><Text style={ui.heading}>{dateLabel(date)}</Text><Text style={ui.muted}>1 slot = 60 minutes · Sri Lankan time</Text></View>
      <Text style={ui.label}>AVAILABLE SLOTS</Text>
      {date < localDate(now) ? <Notice text="This date is in the past. Please choose another date." /> : null}
      {availability.overstaying ? <Notice text="This room is awaiting staff clearance. New bookings are temporarily blocked." error /> : null}
      <View style={ui.wrap}>{slotStarts(date).map((start) => {
        const past = start <= now;
        const free = slotFree(start, availability);
        const active = selected === start && !past && free;
        const disabled = past || !free || busy;
        return <Pressable key={start} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, selected: active }} onPress={() => { setSelected(start); setActionError(''); }} style={[ui.card, { width: '48%', minHeight: 96, backgroundColor: disabled ? colors.background : colors.surface }, active && ui.selected]}>
          <Text style={[ui.body, { fontWeight: '600', color: past ? colors.muted : colors.primary }]}>{timeLabel(start)} – {timeLabel(start + HOUR_MS)}</Text>
          <Text style={{ color: past ? colors.muted : !free ? colors.danger : active ? colors.primary : colors.success, fontSize: 12 }}>{past ? 'PAST' : !free ? 'Unavailable' : active ? 'SELECTED ✓' : 'Available'}</Text>
        </Pressable>;
      })}</View>
      <Notice text="Continuing holds this slot for 5 minutes while you confirm your group. Other groups cannot reserve the same slot during that time." />
    </>}
    <Notice text={actionError} error />
  </BookingScreen>;
}
