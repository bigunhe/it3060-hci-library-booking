import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { dateLabel, localDate, timeLabel } from '@/features/booking/bookingDisplay';
import { useSessionBooking } from '@/features/session/useSessionBooking';
import { Notice, PreviewNotice, SessionLoading, SessionScreen, s, ui } from '@/features/session/SessionUI';
import { bookingReference } from '@/features/session/sessionDisplay';

export default function CompletedScreen() {
  const { booking, room, bookingId, preview, error, loading, reload } = useSessionBooking();
  const completed = booking?.status === 'completed';
  const actualStart = booking?.checkedInAt;
  const actualEnd = booking?.checkedOutAt;
  const duration = actualStart && actualEnd ? Math.max(0, Math.round((actualEnd.toMillis() - actualStart.toMillis()) / 60000)) : null;
  return <SessionScreen title={preview ? 'Completion Receipt Preview' : 'Session Completed'} onBack={() => router.replace('/passes')}
    footer={<><AppButton title="Back to My Passes" onPress={() => router.replace('/passes')} /><AppButton title="Book Another Room" variant="secondary" onPress={() => router.replace('/rooms')} /></>}>
    <SessionLoading loading={loading} error={error} reload={reload} />
    {preview ? <PreviewNotice /> : null}
    {booking ? <>
      <View style={s.hero}><View style={s.circle}><Text style={{ color: '#059669', fontSize: 32 }}>{completed ? '✓' : 'i'}</Text></View><Text style={ui.heading}>{completed ? 'Session Ended' : 'Receipt Preview'}</Text><Text style={[ui.muted, { textAlign: 'center' }]}>{completed ? 'Checkout has been recorded and this session’s room occupancy has been released.' : 'This booking has not been checked out. The receipt below shows its current reservation details.'}</Text></View>
      <View style={ui.card}>
        <View style={ui.row}><Text style={ui.label}>BOOKING RECEIPT</Text><Text style={s.reference}>{bookingReference(bookingId)}</Text></View><View style={ui.divider} />
        <Text style={ui.label}>DISCUSSION SPACE</Text><Text style={s.value}>{room?.name ?? booking.roomId}{room ? ` · Level ${room.level}` : ''}</Text>
        <Text style={ui.label}>DATE</Text><Text style={ui.body}>{dateLabel(localDate(booking.startAt.toMillis()))}</Text>
        <Text style={ui.label}>STUDENT GROUP</Text><Text style={ui.body}>{booking.groupName} · {booking.members.length} members</Text>
        <Text style={ui.label}>RESERVATION WINDOW</Text><Text style={ui.body}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text>
        {booking.extensionMinutes > 0 ? <Text style={ui.muted}>Extension used: +{booking.extensionMinutes} minutes</Text> : null}
        <Text style={ui.label}>ACTUAL OCCUPANCY</Text><Text style={ui.body}>{actualStart && actualEnd ? `${timeLabel(actualStart.toMillis())} – ${timeLabel(actualEnd.toMillis())} (${duration} min)` : 'Not recorded yet'}</Text>
        <View style={s.inset}><Text style={ui.label}>HANDOVER INFORMATION</Text><Text style={ui.muted}>Please leave the whiteboard, display, cables and chairs ready for the next group. Individual checklist responses are not stored in this version.</Text></View>
        <Text selectable style={ui.muted}>Full reference: {bookingId}</Text>
      </View>
      {!completed && !preview ? <Notice text="This reservation is not completed. Return to My Passes to view its current status." /> : null}
    </> : null}
  </SessionScreen>;
}
