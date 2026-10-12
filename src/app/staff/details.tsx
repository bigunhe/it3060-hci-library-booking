import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { useClock } from '@/features/booking/bookingDisplay';
import { StaffBadge, StaffBookingCard, StaffLoading, StaffNotice, StaffScreen, styles } from '@/features/staff/StaffUI';
import { useStaffBooking } from '@/features/staff/useStaffBooking';
import { auditActionLabel, formatColombo, formatClock, ledgerState, statusLabel } from '@/features/staff/staffFormat';
import { staffStyles } from '@/features/staff/staffStyles';

export default function StaffDetails() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const { booking, room, events, loading, error, reload } = useStaffBooking(bookingId);
  const now = useClock();
  const state = booking ? ledgerState(booking, now) : 'other';
  return <StaffScreen title="Booking Details" subtitle="AUDIT TRAIL / RECORDS" tab="audit" back>
    <StaffLoading loading={loading} error={error || (!bookingId ? 'Missing booking reference. Open a reservation from the dashboard or audit log.' : '')} retry={reload} />
    {booking && !loading && !error ? <>
      <View style={staffStyles.headerRow}><Text style={staffStyles.kicker}>RESERVATION STATUS</Text><StaffBadge label={state === 'other' ? statusLabel(booking.status) : state} state={state} /></View>
      <StaffBookingCard booking={booking} room={room} roster />
      <View style={staffStyles.card}><Text style={styles.heading}>Session Record</Text><Text style={staffStyles.body}>Check-in: {booking.checkedInAt ? formatClock(booking.checkedInAt) : 'Not checked in'}</Text><Text style={staffStyles.body}>Checkout: {booking.checkedOutAt ? formatClock(booking.checkedOutAt) : 'Not checked out'}</Text><Text style={staffStyles.body}>Extension: {booking.extensionMinutes} minutes</Text>{booking.checkedInBy ? <Text selectable style={staffStyles.muted}>Checked in by staff UID: {booking.checkedInBy}</Text> : null}</View>
      <View style={staffStyles.card}><Text style={styles.heading}>Audit Timeline</Text>{events.length ? events.map((event) => <View key={event.id} style={styles.inset}><Text style={styles.value}>{auditActionLabel(event.action)}</Text><Text style={staffStyles.muted}>{formatColombo(event.createdAt)}</Text><Text selectable style={staffStyles.muted}>Actor UID: {event.actorId}</Text></View>) : <Text style={staffStyles.muted}>No audit events recorded for this booking.</Text>}</View>
      {booking.status === 'confirmed' ? <AppButton title="Verify Check-In" onPress={() => router.push({ pathname: '/staff/verify', params: { bookingId } })} /> : null}
      {state === 'overstay' ? <><StaffNotice text="This room remains occupied. Confirm physical clearance before releasing it." /><AppButton title="Resolve Overstay" variant="danger" onPress={() => router.push({ pathname: '/staff/overstay', params: { bookingId } })} /></> : null}
      <AppButton title="View Audit Log" variant="secondary" onPress={() => router.replace({ pathname: '/staff/audit', params: { bookingId } })} />
    </> : null}
  </StaffScreen>;
}
