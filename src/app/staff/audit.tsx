import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { db } from '@/lib/firebase';
import type { Booking, Room } from '@/types/models';
import { errorMessage, useClock, validDate } from '@/features/booking/bookingDisplay';
import { StaffBadge, StaffLoading, StaffNotice, StaffScreen, styles } from '@/features/staff/StaffUI';
import { colomboDateKey, formatClock, formatLongDate, ledgerState, statusLabel, type LedgerState } from '@/features/staff/staffFormat';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';

type Filter = 'all' | LedgerState;
const filters: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'active', label: 'Active' }, { id: 'completed', label: 'Completed' }, { id: 'overstay', label: 'Overstay' }];
export default function StaffAudit() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [filter, setFilter] = useState<Filter>('all');
  const [dateInput, setDateInput] = useState('');
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(typeof params.bookingId === 'string' ? params.bookingId : '');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; bookings: Booking[]; rooms: Record<string, Room>; error: string } | null>(null);
  const now = useClock();
  useFocusEffect(useCallback(() => { setAttempt((value) => value + 1); }, []));
  useEffect(() => {
    let bookings: Booking[] = []; const rooms: Record<string, Room> = {}; const ready = [false, false]; let stopped = false; let failed = false;
    const publish = () => { if (!stopped && !failed && ready.every(Boolean)) setResult({ attempt, bookings, rooms: { ...rooms }, error: '' }); };
    const fail = (failure: Error) => { failed = true; if (!stopped) setResult({ attempt, bookings: [], rooms: {}, error: errorMessage(failure) }); };
    const stopBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => { bookings = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Booking)).filter((booking) => booking.status !== 'held').sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis()); ready[0] = true; publish(); }, fail);
    const stopRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => { for (const key of Object.keys(rooms)) delete rooms[key]; snapshot.docs.forEach((item) => { rooms[item.id] = { ...item.data(), id: item.id } as Room; }); ready[1] = true; publish(); }, fail);
    return () => { stopped = true; stopBookings(); stopRooms(); };
  }, [attempt]);
  const loading = result?.attempt !== attempt;
  const error = loading ? '' : result?.error ?? '';
  const records = loading ? [] : result?.bookings ?? [];
  const base = records.filter((booking) => (!date || colomboDateKey(booking.startAt) === date) && (!selectedBooking || booking.id === selectedBooking));
  const visible = base.filter((booking) => filter === 'all' || ledgerState(booking, now) === filter);
  function applyDate() {
    if (dateInput && !validDate(dateInput)) { setDateError('Enter a valid date as YYYY-MM-DD, or leave blank for all dates.'); return; }
    setDateError(''); setDate(dateInput);
  }
  return <StaffScreen title="Audit Log" subtitle="ROOM USAGE LEDGER" tab="audit">
    <View style={staffStyles.card}><AppInput label="Filter date (YYYY-MM-DD)" value={dateInput} onChangeText={setDateInput} error={dateError} autoCapitalize="none" autoCorrect={false} maxLength={10} /><AppButton title="Apply Date Filter" variant="secondary" onPress={applyDate} /><Text style={staffStyles.muted}>{date ? `Showing bookings on ${date}` : 'Showing all dates'}</Text>{selectedBooking ? <AppButton title="Clear Booking Filter" variant="secondary" onPress={() => setSelectedBooking('')} /> : null}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{filters.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: filter === item.id }} onPress={() => setFilter(item.id)} style={[staffStyles.filterChip, { minHeight: 44, justifyContent: 'center', borderColor: staffColors.borderLight, backgroundColor: filter === item.id ? staffColors.navy : '#FFFFFF' }]}><Text style={[staffStyles.filterChipText, { color: filter === item.id ? '#FFFFFF' : staffColors.navy }]}>{item.label} ({item.id === 'all' ? base.length : base.filter((booking) => ledgerState(booking, now) === item.id).length})</Text></Pressable>)}</View>
    <StaffLoading loading={loading} error={error} retry={() => setAttempt((value) => value + 1)} />
    {!loading && !error ? <Text style={staffStyles.muted}>Showing {visible.length} actual reservations</Text> : null}
    {!loading && !error && !visible.length ? <StaffNotice text="No reservations match these filters." /> : null}
    {visible.map((booking) => {
      const state = ledgerState(booking, now);
      return <View key={booking.id} style={staffStyles.card}><View style={staffStyles.headerRow}><Text style={[styles.heading, { flex: 1 }]}>{result?.rooms[booking.roomId]?.name ?? booking.roomId}</Text><StaffBadge label={state === 'other' ? statusLabel(booking.status) : state} state={state} /></View><Text style={staffStyles.body}>{booking.groupName} · {booking.members.length} members</Text><Text style={staffStyles.muted}>{formatLongDate(booking.startAt)} · {formatClock(booking.startAt)} – {formatClock(booking.endAt)}</Text><Text style={staffStyles.muted}>Check-in: {booking.checkedInAt ? formatClock(booking.checkedInAt) : 'Not checked in'} · Checkout: {booking.checkedOutAt ? formatClock(booking.checkedOutAt) : 'Not checked out'}</Text><Text selectable style={styles.reference}>{booking.id}</Text><AppButton title="Details & Audit Timeline" variant="secondary" onPress={() => router.push({ pathname: '/staff/details', params: { bookingId: booking.id } })} />{state === 'overstay' ? <AppButton title="Resolve Overstay" variant="danger" onPress={() => router.push({ pathname: '/staff/overstay', params: { bookingId: booking.id } })} /> : null}</View>;
    })}
  </StaffScreen>;
}
