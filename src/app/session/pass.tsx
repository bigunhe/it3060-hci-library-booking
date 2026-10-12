import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/constants/theme';
import { timeLabel, dateLabel, localDate, errorMessage } from '@/features/booking/bookingDisplay';
import { expireBooking } from '@/lib/expireBooking';
import { cancelReservation } from '@/features/session/sessionOperations';
import { PassQRCode } from '@/features/session/PassQRCode';
import { useSessionBooking } from '@/features/session/useSessionBooking';
import { displayStatus, bookingReference } from '@/features/session/sessionDisplay';
import { SessionScreen, SessionLoading, StatusBadge, Notice, s, ui } from '@/features/session/SessionUI';

export default function AccessPassScreen() {
  const { booking, bookingId, room, error, loading, now, reload } = useSessionBooking();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const status = booking ? displayStatus(booking, now) : null;
  const validPass = status === 'confirmed' || status === 'active';
  async function action(operation: 'cancel' | 'expire') {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setMessage('');
    try {
      if (operation === 'cancel') await cancelReservation(bookingId); else await expireBooking(bookingId);
      router.replace('/passes');
    } catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  function askCancel() {
    Alert.alert('Cancel reservation?', 'Your room slot will be released. This cannot be undone.', [
      { text: 'Keep Reservation', style: 'cancel' },
      { text: 'Cancel Reservation', style: 'destructive', onPress: () => void action('cancel') },
    ]);
  }
  return <SessionScreen title="Digital Access Pass" onBack={() => router.replace('/passes')}
    headerRight={booking ? <Text style={s.reference}>{bookingReference(bookingId)}</Text> : undefined}
    footer={booking ? <>
      <AppButton title={booking.status === 'active' ? 'Go to Active Session' : 'Awaiting Staff Check-In'} disabled={booking.status !== 'active' || busy} onPress={() => router.push({ pathname: '/session/active', params: { bookingId } })} />
      {status === 'confirmed' ? <><AppButton title="Preview Session Screens" variant="secondary" disabled={busy} onPress={() => router.push({ pathname: '/session/active', params: { bookingId, preview: '1' } })} /><AppButton title="Cancel Reservation" variant="danger" loading={busy} onPress={askCancel} /></> : null}
      {status === 'expired' && booking.status !== 'expired' ? <AppButton title="Release Expired Reservation" variant="secondary" loading={busy} onPress={() => void action('expire')} /> : null}
      {status === 'completed' ? <AppButton title="View Receipt" variant="secondary" onPress={() => router.replace({ pathname: '/session/completed', params: { bookingId } })} /> : null}
    </> : undefined}>
    <SessionLoading loading={loading} error={error} reload={reload} />
    {booking && status ? <View style={ui.card}>
      <View style={ui.row}><StatusBadge status={status} /><Text style={ui.muted}>{booking.members.length} members</Text></View>
      {booking.demo ? <Notice text="VIVA DEMO · Staff may check this booking in immediately, before the displayed check-in deadline." /> : null}
      <Text style={ui.label}>ASSIGNED SPACE</Text><Text style={ui.heading}>{room?.name ?? booking.roomId}</Text><Text style={ui.muted}>{room ? `Level ${room.level} · ${room.location}` : 'Loading room…'}</Text>
      <View style={ui.divider} /><Text style={s.value}>{booking.groupName}</Text><Text style={ui.body}>{dateLabel(localDate(booking.startAt.toMillis()))}</Text><Text style={ui.body}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text>
      {validPass ? <PassQRCode bookingId={bookingId} /> : <View style={[s.hero, { backgroundColor: colors.background }]}><Text style={ui.heading}>Pass unavailable</Text><Text style={ui.muted}>This reservation is {status}.</Text></View>}
      <Text selectable style={[s.reference, { maxWidth: undefined, textAlign: 'center' }]}>{bookingId}</Text>
      {status === 'confirmed' ? <View style={s.warning}><Text style={[s.warningText, { fontWeight: '700' }]}>Check-in required by {timeLabel(booking.checkInDeadline.toMillis())}</Text><Text style={s.warningText}>{booking.demo ? 'Demo booking: present this pass before the displayed deadline. Staff authorization activates the real session.' : 'Present this pass at the library counter within 15 minutes of your reservation start. Staff authorization activates your session.'}</Text></View> : null}
      {status === 'active' ? <View style={s.success}><Text style={s.successText}>Staff check-in complete. Your session is now active.</Text></View> : null}
      {status === 'expired' ? <Notice text="The check-in window or temporary hold has expired. This pass cannot be used." /> : null}
    </View> : null}
    <Notice text={message} error />
  </SessionScreen>;
}
