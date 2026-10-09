import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/constants/theme';
import { useBookingDraft } from '@/features/booking/BookingDraft';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { dateLabel, errorMessage, localDate, timeLabel, useClock } from '@/features/booking/bookingDisplay';
import { useBookingDetails } from '@/features/booking/useBookingDetails';
import { confirmBooking } from '@/lib/bookings';
import { cancelBookingHold } from '@/lib/cancelBookingHold';

export default function Review() {
  const { bookingId = '' } = useLocalSearchParams<{ bookingId?: string }>();
  const { booking, room, error, reload } = useBookingDetails(bookingId);
  const { draft, setDraft } = useBookingDraft();
  const details = draft?.bookingId === bookingId ? draft : null;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const now = useClock();
  const confirmed = saved || booking?.status === 'confirmed' || booking?.status === 'active';
  const remaining = booking ? Math.max(0, Math.ceil((booking.holdExpiresAt.toMillis() - now) / 1000)) : 0;
  const expired = !confirmed && !!booking && (remaining === 0 || booking.status !== 'held' || booking.startAt.toMillis() <= now);
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  async function confirm() {
    if (!details || submitting.current || expired || confirmed) return;
    submitting.current = true; setBusy(true); setMessage('');
    try {
      await confirmBooking(bookingId, details.groupName, details.members, details.purpose);
      setSaved(true);
    } catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function cancel() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setMessage('');
    try { await cancelBookingHold(bookingId); setDraft(null); router.replace('/rooms'); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  function editGroup() { router.replace({ pathname: '/booking/group', params: { bookingId } }); }
  const groupName = confirmed ? booking?.groupName || details?.groupName : details?.groupName;
  const members = confirmed && booking?.members.length ? booking.members : details?.members ?? [];
  return <BookingScreen title={confirmed ? 'Reservation Confirmed' : 'Review & Confirm'} subtitle={confirmed ? 'Your booking has been saved' : 'Final step · Confirm your group'}
    onBack={busy ? undefined : confirmed ? () => router.replace('/rooms') : editGroup}
    footer={confirmed ? <>
      <AppButton title="View My Passes" onPress={() => router.replace('/passes')} />
      <AppButton title="Back to Rooms" variant="secondary" onPress={() => router.replace('/rooms')} />
    </> : <>
      <AppButton title="Confirm Reservation" onPress={() => void confirm()} loading={busy} disabled={!booking || !room || !details || expired || !!error} />
      <AppButton title="Cancel & Release Slot" variant="secondary" onPress={() => void cancel()} disabled={!booking || booking.status !== 'held'} loading={busy} />
    </>}>
    {error ? <><Notice text={error} error /><AppButton title="Retry" variant="secondary" onPress={reload} /></> : !booking || !room ? <ActivityIndicator color={colors.primary} /> : <>
      {confirmed ? <View style={ui.card}><Text style={ui.success}>✓ CONFIRMED</Text><Text selectable style={ui.body}>Booking reference: {bookingId}</Text><Text style={ui.muted}>Present your access pass at the library counter before the check-in deadline.</Text></View> : <View style={ui.notice}><Text style={ui.warning}>{expired ? 'Hold expired or no longer available' : `Slot Held for ${timer}`}</Text><Text style={ui.body}>Complete confirmation before the hold expires.</Text></View>}
      {!confirmed && !details ? <><Notice text="Your group entry was cleared after reopening. Enter it again while the hold is valid." /><AppButton title="Enter Group Details" variant="secondary" onPress={editGroup} disabled={expired} /></> : null}
      <View style={ui.card}>
        <View style={ui.row}><Text style={ui.label}>RESERVED SPACE</Text><Text style={ui.muted}>{confirmed ? 'CONFIRMED' : 'PENDING'}</Text></View>
        <Text style={ui.heading}>{room.name}</Text><Text style={ui.muted}>Level {room.level} · {room.location}</Text>
        <View style={ui.divider} />
        <Text style={ui.label}>DATE</Text><Text style={ui.body}>{dateLabel(localDate(booking.startAt.toMillis()))}</Text>
        <Text style={ui.label}>TIME WINDOW</Text><Text style={ui.body}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())} (60 min)</Text>
        <Text style={ui.label}>GROUP NAME</Text><Text style={ui.body}>{groupName || 'Not entered'}</Text>
        <Text style={ui.label}>MEMBERS</Text><Text style={ui.body}>{members.length} students</Text>
        {members.map((member, index) => <Text key={index} style={ui.muted}>{member.name} · {member.studentId}</Text>)}
        {(confirmed ? booking.purpose : details?.purpose) ? <><Text style={ui.label}>PURPOSE</Text><Text style={ui.body}>{confirmed ? booking.purpose : details?.purpose}</Text></> : null}
      </View>
      <Notice text={`Check-in grace rule: present your pass at the counter within 15 minutes of the start, by ${timeLabel(booking.checkInDeadline.toMillis())}.`} />
      {!confirmed && details && !expired ? <AppButton title="Edit Group Details" variant="secondary" disabled={busy} onPress={editGroup} /> : null}
      {expired ? <AppButton title="Choose Another Slot" onPress={() => router.replace('/rooms')} /> : null}
    </>}
    <Notice text={message} error />
  </BookingScreen>;
}
