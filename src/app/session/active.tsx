import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { timeLabel } from '@/features/booking/bookingDisplay';
import { useSessionBooking } from '@/features/session/useSessionBooking';
import { BookingSummary, Notice, PreviewNotice, SessionLoading, SessionScreen, SessionUnavailable, StatusBadge, TimerCard, s, ui } from '@/features/session/SessionUI';

export default function ActiveSessionScreen() {
  const { booking, room, bookingId, preview, error, loading, now, reload } = useSessionBooking();
  const available = !!booking && (booking.status === 'active' || preview);
  const params = { bookingId, ...(preview ? { preview: '1' } : {}) };
  return <SessionScreen title="Active Session" subtitle={preview ? 'Screen preview' : booking?.status === 'active' ? 'SESSION IN PROGRESS' : 'Reservation status'} onBack={() => router.replace('/passes')}
    headerRight={booking && !preview ? <StatusBadge status={booking.status} /> : undefined}
    footer={available ? <AppButton title={preview ? 'Preview Handover & Checkout' : 'End Session / Checkout'} onPress={() => router.push({ pathname: '/session/checkout', params })} /> : undefined}>
    <SessionLoading loading={loading} error={error} reload={reload} />
    {preview ? <PreviewNotice /> : null}
    {booking ? <>
      <SessionUnavailable booking={booking} preview={preview} />
      {booking.extensionMinutes > 0 ? <View style={s.success}><Text style={[s.successText, { fontWeight: '700' }]}>✓ +{booking.extensionMinutes} min extension confirmed</Text><Text style={s.successText}>New checkout time: {timeLabel(booking.endAt.toMillis())} · was {timeLabel(booking.originalEndAt.toMillis())}</Text></View> : null}
      <BookingSummary booking={booking} room={room} compact />
      {available ? <>
        <TimerCard booking={booking} now={now} preview={preview} />
        {booking.extensionMinutes > 0 ? <View style={s.columns}><View style={[s.inset, ui.flex]}><Text style={ui.label}>ORIGINAL END</Text><Text style={[s.value, { textDecorationLine: 'line-through' }]}>{timeLabel(booking.originalEndAt.toMillis())}</Text></View><View style={[s.success, ui.flex]}><Text style={ui.label}>EXTENDED END</Text><Text style={s.successText}>{timeLabel(booking.endAt.toMillis())}</Text></View></View> : null}
        <Notice text={room?.equipment.length ? `Room equipment: ${room.equipment.join(', ')}. Please return all equipment when leaving.` : 'Please leave the room clean and ready for the next group.'} />
        <AppButton title={booking.extensionMinutes > 0 ? 'Extension Limit Reached (1 of 1)' : preview ? 'Preview Extension Options' : 'Request Session Extension'} variant="secondary" disabled={booking.extensionMinutes > 0 || (!preview && now >= booking.endAt.toMillis())} onPress={() => router.push({ pathname: '/session/extend', params })} />
        <Text style={ui.muted}>{booking.checkedInAt ? `Checked in: ${timeLabel(booking.checkedInAt.toMillis())}` : 'Staff check-in has not occurred.'}</Text>
      </> : null}
    </> : null}
  </SessionScreen>;
}
