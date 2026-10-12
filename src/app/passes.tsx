import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/constants/theme';
import { auth, db } from '@/lib/firebase';
import type { Booking, Room } from '@/types/models';
import { dateLabel, errorMessage, localDate, timeLabel, useClock } from '@/features/booking/bookingDisplay';
import { BookingSummary, Notice, SessionLoading, SessionScreen, StatusBadge, s, ui } from '@/features/session/SessionUI';
import { bookingReference, displayStatus } from '@/features/session/sessionDisplay';

type Tab = 'Upcoming' | 'Active' | 'Past';
export default function PassesScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [tab, setTab] = useState<Tab>('Upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState('');
  const now = useClock();
  useEffect(() => {
    let stopped = false;
    let generation = 0;
    let stopBookings: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      generation += 1;
      const currentGeneration = generation;
      stopBookings?.(); setBookings([]); setRooms({}); setError(''); setLoading(true);
      if (!user) { setError('Sign in to view your passes.'); setLoading(false); return; }
      void getDocs(collection(db, 'rooms')).then((snapshot) => {
        if (stopped || currentGeneration !== generation) return;
        const result: Record<string, Room> = {};
        snapshot.docs.forEach((item) => { result[item.id] = { ...item.data(), id: item.id } as Room; });
        setRooms(result);
      }).catch((failure: unknown) => { if (!stopped && currentGeneration === generation) setError(errorMessage(failure)); });
      stopBookings = onSnapshot(query(collection(db, 'bookings'), where('ownerId', '==', user.uid)), (snapshot) => {
        setBookings(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Booking)));
        setLoading(false);
      }, (failure) => { setError(errorMessage(failure)); setLoading(false); });
    });
    return () => { stopped = true; generation += 1; stopAuth(); stopBookings?.(); };
  }, [attempt]);
  const upcoming = bookings.filter((booking) => ['confirmed', 'held'].includes(displayStatus(booking, now))).sort((a, b) => a.startAt.toMillis() - b.startAt.toMillis());
  const active = bookings.filter((booking) => booking.status === 'active').sort((a, b) => a.endAt.toMillis() - b.endAt.toMillis());
  const past = bookings.filter((booking) => ['completed', 'cancelled', 'expired'].includes(displayStatus(booking, now))).sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis());
  const groups: Record<Tab, Booking[]> = { Upcoming: upcoming, Active: active, Past: past };
  const visible = groups[tab];
  function open(booking: Booking) {
    const status = displayStatus(booking, now);
    const pathname = status === 'active' ? '/session/active' : status === 'completed' ? '/session/completed' : status === 'held' ? '/booking/group' : '/session/pass';
    router.push({ pathname, params: { bookingId: booking.id } });
  }
  return <SessionScreen title="My Reservations" subtitle="SLIIT STUDENT PORTAL" headerRight={<Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.refresh}><Text style={ui.link}>Refresh</Text></Pressable>}>
    <View style={styles.tabs}>{(['Upcoming', 'Active', 'Past'] as const).map((name) => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: name === tab }} onPress={() => setTab(name)} style={[styles.tab, name === tab && styles.selected]}><Text style={[styles.tabText, name === tab && { color: colors.primary, fontWeight: '700' }]}>{name} ({groups[name].length})</Text></Pressable>)}</View>
    <SessionLoading loading={loading} error={error} reload={() => setAttempt((value) => value + 1)} />
    {!loading && !error && visible.length === 0 ? <View style={[ui.card, { paddingVertical: 32 }]}><Text style={ui.heading}>No {tab.toLowerCase()} reservations</Text><Text style={ui.muted}>{tab === 'Active' ? 'Your session appears here after library staff check you in.' : tab === 'Past' ? 'Completed, cancelled and expired bookings will appear here.' : 'Reserve a room to get your digital access pass.'}</Text><AppButton title="Browse Rooms" onPress={() => router.replace('/rooms')} /></View> : null}
    {visible.map((booking) => {
      const status = displayStatus(booking, now);
      return <View key={booking.id} style={[ui.card, { padding: 0, overflow: 'hidden' }]}>
        <View style={{ height: 5, backgroundColor: status === 'active' ? colors.success : colors.primary }} />
        <View style={{ padding: 16, gap: 14 }}>
          <View style={ui.row}><StatusBadge status={status} /><Text style={s.reference}>{bookingReference(booking.id)}</Text></View>
          {booking.demo ? <Text style={ui.warning}>VIVA DEMO RESERVATION</Text> : null}
          <Text style={ui.heading}>{rooms[booking.roomId]?.name ?? booking.roomId}</Text>
          <Text style={ui.muted}>{rooms[booking.roomId] ? `Level ${rooms[booking.roomId].level} · ${rooms[booking.roomId].location}` : 'Room details loading'}</Text>
          <View style={s.inset}><Text style={s.value}>{dateLabel(localDate(booking.startAt.toMillis()))}</Text><Text style={s.value}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text><Text style={ui.body}>{booking.groupName || 'Group setup pending'} · {booking.members.length} members</Text></View>
          {status === 'confirmed' ? <View style={s.warning}><Text style={s.warningText}>Check-in notice: 15-minute grace period applies. Present your pass at the library counter by {timeLabel(booking.checkInDeadline.toMillis())}.</Text></View> : null}
          <AppButton title={status === 'active' ? 'Open Active Session' : status === 'completed' ? 'View Booking Receipt' : status === 'held' ? 'Continue Group Setup' : status === 'confirmed' ? 'View Access Pass (QR Code)' : 'View Reservation Details'} onPress={() => open(booking)} />
          <AppButton title={expanded === booking.id ? 'Hide Details & Group Policy' : 'View Details & Group Policy'} variant="secondary" onPress={() => setExpanded(expanded === booking.id ? '' : booking.id)} />
          {expanded === booking.id ? <><BookingSummary booking={booking} room={rooms[booking.roomId] ?? null} />{booking.members.map((member) => <Text key={member.studentId} style={ui.muted}>{member.name} · {member.studentId}</Text>)}<Notice text="Groups must contain 3–8 members within room capacity. Check in within 15 minutes. One 15/30-minute extension is permitted when the entire next hour is free. Clean and hand over the room before checking out." /></> : null}
        </View>
      </View>;
    })}
    {tab === 'Upcoming' && past.length > 0 ? <><Text style={ui.label}>PREVIOUS RESERVATION</Text><Pressable accessibilityRole="button" onPress={() => open(past[0])} style={ui.card}><View style={ui.row}><Text style={[ui.body, { fontWeight: '600', flex: 1 }]}>{rooms[past[0].roomId]?.name ?? past[0].roomId}</Text><Text style={ui.link}>{past[0].status === 'completed' ? 'Receipt →' : 'Details →'}</Text></View><Text style={ui.muted}>{dateLabel(localDate(past[0].startAt.toMillis()))} · {displayStatus(past[0], now)}</Text></Pressable></> : null}
  </SessionScreen>;
}
const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: '#E8EEF5', padding: 4, borderRadius: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  selected: { backgroundColor: colors.white },
  tabText: { color: colors.muted, fontSize: 12 },
  refresh: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
});
