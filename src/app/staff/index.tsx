import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { errorMessage, useClock } from '@/features/booking/bookingDisplay';
import { StaffBadge, StaffLoading, StaffNotice, StaffScreen, styles } from '@/features/staff/StaffUI';
import { formatClock, formatLongDate, stateLabel } from '@/features/staff/staffFormat';
import { expireDueNoShows, subscribeStaffRooms, type StaffRoomRow } from '@/features/staff/staffQueries';
import { staffColors, staffStyles, stateTone } from '@/features/staff/staffStyles';

export default function StaffDashboard() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; rooms: StaffRoomRow[]; error: string } | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [cleanupNotes, setCleanupNotes] = useState<string[]>([]);
  const [cleanupError, setCleanupError] = useState('');
  const [cleaning, setCleaning] = useState(false);
  const now = useClock();
  useEffect(() => subscribeStaffRooms((rooms) => setResult({ attempt, rooms, error: '' }),
    (failure) => setResult({ attempt, rooms: [], error: errorMessage(failure) })), [attempt]);
  useFocusEffect(useCallback(() => {
    let stopped = false;
    void expireDueNoShows().then((notes) => { if (!stopped) setCleanupNotes(notes); })
      .catch((failure: unknown) => { if (!stopped) setCleanupError(errorMessage(failure)); });
    return () => { stopped = true; };
  }, []));
  const loading = result?.attempt !== attempt;
  const error = loading ? '' : result?.error ?? '';
  const rooms = loading ? [] : result?.rooms ?? [];
  const levels = [...new Set(rooms.map((row) => row.room.level))].sort((a, b) => a - b);
  const visible = level === null ? rooms : rooms.filter((row) => row.room.level === level);
  async function refresh() {
    if (cleaning) return;
    setCleaning(true); setCleanupError(''); setCleanupNotes([]);
    try { setCleanupNotes(await expireDueNoShows()); setAttempt((value) => value + 1); }
    catch (failure) { setCleanupError(errorMessage(failure)); }
    finally { setCleaning(false); }
  }
  return <StaffScreen title="Staff Operations" tab="rooms">
    <View style={staffStyles.card}><View style={staffStyles.headerRow}><View style={{ flex: 1, gap: 5 }}><Text style={styles.value}>Student Arrival Verification</Text><Text style={staffStyles.muted}>Scan a student pass or enter its full reference.</Text></View><AppButton title="Scan / Verify" onPress={() => router.push('/staff/verify')} /></View></View>
    <View style={staffStyles.headerRow}><Text style={staffStyles.kicker}>FLOOR OVERVIEW</Text><Text style={staffStyles.muted}>{loading ? 'Loading…' : `${visible.length} rooms`}</Text></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[null, ...levels].map((item) => <Pressable key={item ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: level === item }} onPress={() => setLevel(item)} style={[staffStyles.filterChip, { minHeight: 44, justifyContent: 'center', borderColor: staffColors.borderLight, backgroundColor: level === item ? staffColors.navy : '#FFFFFF' }]}><Text style={[staffStyles.filterChipText, { color: level === item ? '#FFFFFF' : staffColors.navy }]}>{item === null ? 'All Levels' : `Level ${item}`}</Text></Pressable>)}</View>
    {!loading && !error ? <View style={staffStyles.countRow}>{(['active', 'pending', 'overstay', 'available'] as const).map((state) => {
      const tone = stateTone(state);
      return <View key={state} style={[staffStyles.countTile, { borderColor: tone.border, backgroundColor: tone.badgeBg }]}><Text style={[staffStyles.countValue, { color: tone.badgeText }]}>{String(visible.filter((row) => row.state === state).length).padStart(2, '0')}</Text><Text style={[staffStyles.countLabel, { color: tone.badgeText }]}>{state.toUpperCase()}</Text></View>;
    })}</View> : null}
    <AppButton title="Refresh & Release Missed Check-Ins" variant="secondary" loading={cleaning} onPress={() => void refresh()} />
    <StaffNotice text={cleanupError} error />
    {cleanupNotes.length ? <StaffNotice text={cleanupNotes.slice(-4).join('\n')} /> : null}
    <StaffLoading loading={loading} error={error} retry={() => setAttempt((value) => value + 1)} />
    <View style={staffStyles.headerRow}><Text style={staffStyles.kicker}>DISCUSSION ROOM STATUS</Text>{!loading && !error ? <Text style={{ color: staffColors.chipGreen, fontSize: 12 }}>Live updates</Text> : null}</View>
    {!loading && !error && !visible.length ? <StaffNotice text="No enabled rooms on this level." /> : null}
    {visible.map((row) => {
      const booking = row.occupancyBooking ?? row.pendingBookings[0];
      const tone = stateTone(row.state);
      const remaining = row.occupancy ? Math.ceil((row.occupancy.endAt.toMillis() - now) / 60000) : null;
      return <View key={row.room.id} style={[staffStyles.card, { borderColor: tone.border }]}>
        <View style={staffStyles.headerRow}><Text style={[styles.heading, { flex: 1 }]}>{row.room.name}</Text><StaffBadge label={stateLabel(row.state)} state={row.state} /></View>
        {booking?.demo ? <Text style={{ color: staffColors.chipOrange, fontWeight: '600' }}>VIVA DEMO RESERVATION</Text> : null}
        <Text style={staffStyles.muted}>Level {row.room.level} · Capacity {row.room.minCapacity}–{row.room.maxCapacity} · {row.room.location}</Text>
        {booking ? <><Text style={styles.value}>{booking.groupName} · {booking.members.length} members</Text><Text style={staffStyles.muted}>{formatLongDate(booking.startAt)} · {formatClock(booking.startAt)} – {formatClock(booking.endAt)}</Text></> : <Text style={staffStyles.muted}>{row.occupancy ? 'Occupancy exists, but its reservation could not be matched. Contact the leader.' : 'No current occupancy or confirmed reservation.'}</Text>}
        {remaining !== null ? <Text style={{ color: remaining <= 0 ? staffColors.chipRed : staffColors.chipGreen, fontWeight: '600' }}>{remaining <= 0 ? `Overdue by ${Math.abs(remaining)} min` : `${remaining} min remaining`}</Text> : null}
        {row.state === 'pending' && booking ? <Text style={{ color: staffColors.chipOrange, fontSize: 13 }}>{now < booking.startAt.toMillis() ? `Check-in opens at ${formatClock(booking.startAt)}` : now <= booking.checkInDeadline.toMillis() ? `Check-in deadline: ${formatClock(booking.checkInDeadline)}` : 'Missed check-in. Use refresh to release its locks.'}</Text> : null}
        {row.nextBooking && row.nextBooking.id !== booking?.id ? <Text style={staffStyles.muted}>Next reservation: {formatLongDate(row.nextBooking.startAt)} · {formatClock(row.nextBooking.startAt)}</Text> : null}
        {booking ? <View style={{ gap: 8 }}>
          {row.state === 'overstay' ? <AppButton title="Resolve Overstay" variant="danger" onPress={() => router.push({ pathname: '/staff/overstay', params: { bookingId: booking.id } })} /> : row.state === 'pending' ? <AppButton title="Verify Check-In" onPress={() => router.push({ pathname: '/staff/verify', params: { bookingId: booking.id } })} /> : null}
          <AppButton title="Booking Details" variant="secondary" onPress={() => router.push({ pathname: '/staff/details', params: { bookingId: booking.id } })} />
        </View> : null}
      </View>;
    })}
  </StaffScreen>;
}
