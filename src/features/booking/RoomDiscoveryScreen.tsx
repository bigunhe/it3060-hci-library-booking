import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { StudentNavigation } from '@/components/ui/StudentNavigation';
import { colors } from '@/constants/theme';
import { subscribeRoomAvailability, type RoomAvailability } from '@/lib/availability';
import { auth, db } from '@/lib/firebase';
import type { Room } from '@/types/models';
import { router, useLocalSearchParams } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { BookingScreen, Notice, ui } from './BookingUI';
import { dateLabel, dayRange, dayStart, errorMessage, HOUR_MS, localDate, slotFree, slotStarts, timeLabel, useClock, validDate } from './bookingDisplay';

function RoomCard({ room, date, groupId, now, selected, onSelect }: {
  room: Room; date: string; groupId: string; now: number; selected: boolean; onSelect: () => void;
}) {
  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const [start, end] = dayRange(date);
    return subscribeRoomAvailability(room.id, start, end, setAvailability, (failure) => setError(errorMessage(failure)));
  }, [room.id, date, retry]);
  const openSlots = availability ? slotStarts(date).filter((start) => start > now && slotFree(start, availability)) : [];
  const status = error ? 'Could not load availability' : !availability ? 'Checking availability…' : availability.overstaying ? 'Awaiting staff clearance' : openSlots.length ? 'Available slots' : 'No remaining slots';
  return <Pressable onPress={onSelect} accessibilityRole="button" accessibilityLabel={`Select ${room.name}`} style={[ui.card, selected && ui.selected]}>
    {selected ? <Text style={ui.label}>SELECTED ROOM</Text> : null}
    <Text style={ui.heading}>{room.name}</Text>
    <Text style={ui.muted}>Level {room.level} · {room.location}</Text>
    <Text style={ui.muted}>{room.equipment?.join(' · ') || 'Discussion space'}</Text>
    <Text style={ui.body}>Capacity: {room.minCapacity}–{room.maxCapacity} members</Text>
    <View style={ui.divider} />
    <Text style={{ color: error ? colors.danger : openSlots.length ? colors.success : colors.muted, fontWeight: '600' }}>{status}</Text>
    {availability && !error ? <Text style={ui.muted}>{openSlots.length} open slots{openSlots.length ? ` · Next: ${timeLabel(openSlots[0])}` : ''}</Text> : null}
    {error ? <><Notice text={error} error /><AppButton title="Retry availability" variant="secondary" onPress={() => { setError(''); setAvailability(null); setRetry((value) => value + 1); }} /></> : <AppButton title={selected ? 'View Schedule' : 'View Slots'} variant={selected ? 'primary' : 'secondary'} disabled={!availability || !openSlots.length}
      onPress={() => router.push({ pathname: '/booking/schedule', params: { roomId: room.id, date, groupId } })} />}
  </Pressable>;
}

export default function RoomDiscoveryScreen() {
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId ?? '';
  const now = useClock();
  const [date, setDate] = useState(() => localDate(Date.now()));
  const [dateInput, setDateInput] = useState(date);
  const [level, setLevel] = useState(2);
  const [selected, setSelected] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => onAuthStateChanged(auth, (user) => { setUid(user?.uid ?? null); setAuthReady(true); setRooms([]); setLoaded(false); setError(''); }), []);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const list = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Room).filter((room) => room.enabled).sort((a, b) => a.name.localeCompare(b.name));
      setRooms(list); setLoaded(true);
      setLevel((previous) => list.some((room) => room.level === previous) ? previous : list[0]?.level ?? 2);
    }, (failure) => { setError(errorMessage(failure)); setLoaded(true); });
  }, [uid, retry]);
  function selectDate(next: string) { setDate(next); setDateInput(next); setDateError(''); }
  function applyDate() {
    if (!validDate(dateInput) || dateInput < localDate(Date.now())) { setDateError('Enter today or a future date as YYYY-MM-DD.'); return; }
    selectDate(dateInput);
  }
  async function logOut() {
    setBusy(true);
    try { await signOut(auth); router.replace('/login'); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  const today = localDate(now);
  const dates = Array.from({ length: 4 }, (_, i) => localDate(dayStart(today) + i * 24 * HOUR_MS));
  const levels = Array.from(new Set([1, 2, 3, ...rooms.map((room) => room.level)])).sort((a, b) => a - b);
  const visible = rooms.filter((room) => room.level === level);
  return (
    <BookingScreen
      title="Library Space Booking"
      subtitle="SLIIT · Main Campus · Discussion Spaces"
      footer={<StudentNavigation active="Rooms" />}
      headerRight={
        uid ? (
          <Pressable
            onPress={() => void logOut()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={{
              minHeight: 44,
              paddingHorizontal: 8,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </Text>
          </Pressable>
        ) : null
      }
    >    {!authReady ? <ActivityIndicator color={colors.primary} /> : !uid ? <><Notice text="Sign in to reserve a room." /><AppButton title="Sign in" onPress={() => router.replace('/login')} /></> : <>
      <View style={ui.card}>
        <View style={ui.row}><Text style={ui.label}>TARGET DATE</Text><Text style={ui.body}>{dateLabel(date)}</Text></View>
        <View style={ui.wrap}>{dates.map((day, index) => <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: date === day }} onPress={() => selectDate(day)} style={[ui.chip, date === day && ui.chipSelected]}><Text style={[ui.chipText, date === day && ui.chipTextSelected]}>{index === 0 ? 'Today' : dateLabel(day).split(' ').slice(0, 2).join(' ')}</Text></Pressable>)}</View>
        <AppInput label="Another date (YYYY-MM-DD)" value={dateInput} onChangeText={setDateInput} autoCapitalize="none" maxLength={10} error={dateError} />
        <AppButton title="Apply Date" variant="secondary" onPress={applyDate} />
      </View>
      <Text style={ui.muted}>Group requirement: 3–8 members · Bookings last 60 minutes</Text>
      {groupId ? <Notice text="Your saved group will be selected during Group Configuration." /> : null}
      <Text style={ui.label}>LIBRARY LEVEL</Text>
      <View style={ui.wrap}>{levels.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: level === item }} onPress={() => setLevel(item)} style={[ui.chip, level === item && ui.chipSelected]}><Text style={[ui.chipText, level === item && ui.chipTextSelected]}>Level {item}</Text></Pressable>)}</View>
      {error ? <><Notice text={error} error /><AppButton title="Retry rooms" variant="secondary" onPress={() => { setError(''); setLoaded(false); setRetry((value) => value + 1); }} /></> : !loaded ? <ActivityIndicator color={colors.primary} /> : !visible.length ? <Notice text="No enabled rooms on this level. Choose another level." /> : visible.map((room, index) => <RoomCard key={`${room.id}:${date}`} room={room} date={date} groupId={groupId} now={now} selected={selected === room.id || (!selected && index === 0)} onSelect={() => setSelected(room.id)} />)}
    </>}
  </BookingScreen>
  );
}
