import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { errorMessage, useClock } from '@/features/booking/bookingDisplay';
import { StaffBadge, StaffBookingCard, StaffLoading, StaffNotice, StaffScreen, styles } from '@/features/staff/StaffUI';
import { useStaffBooking } from '@/features/staff/useStaffBooking';
import { forceReleaseBooking } from '@/features/staff/staffOperations';
import { elapsedMinutes, formatClock, formatNowClock } from '@/features/staff/staffFormat';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';

export default function StaffOverstay() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const { booking, room, occupancy, loading, error, reload } = useStaffBooking(bookingId);
  const now = useClock();
  const [cleared, setCleared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const eligible = !!booking && booking.status === 'active' && now >= booking.endAt.toMillis() && occupancy?.bookingId === booking.id;
  async function release() {
    if (!eligible || !cleared || !booking || submitting.current || loading || error) return;
    submitting.current = true; setBusy(true); setMessage('');
    try { await forceReleaseBooking(booking.id); router.replace({ pathname: '/staff/details', params: { bookingId: booking.id } }); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <StaffScreen title="Resolve Overstay" tab="rooms" back footer={<><AppButton title="Confirm Clearance & Release Room" variant="danger" disabled={!eligible || !cleared || loading || !!error || busy} loading={busy} onPress={() => void release()} /><AppButton title="Keep Room Occupied" variant="secondary" disabled={busy} onPress={() => router.replace('/staff')} /></>}>
    <StaffLoading loading={loading} error={error || (!bookingId ? 'Missing booking reference. Open an overstayed room from the dashboard.' : '')} retry={reload} />
    {booking && !loading && !error ? <>
      <View style={[staffStyles.card, { borderColor: eligible ? staffColors.chipRed : staffColors.borderLight }]}><StaffBadge label={eligible ? `Overstay +${elapsedMinutes(booking.endAt, now)} min` : 'Staff release unavailable'} state={eligible ? 'overstay' : 'completed'} /><Text style={styles.value}>Scheduled end: {formatClock(booking.endAt)}</Text><Text style={staffStyles.body}>Current time: {formatNowClock(now)}</Text><Text style={staffStyles.muted}>{eligible ? 'The room is still occupied. Speak to the group and confirm handover before releasing it.' : 'Release requires an active session past its end time and matching room occupancy.'}</Text></View>
      <StaffBookingCard booking={booking} room={room} roster />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: cleared, disabled: busy || !eligible }} disabled={busy || !eligible} onPress={() => setCleared((value) => !value)} style={[styles.inset, { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 }]}><View style={{ width: 24, height: 24, borderWidth: 1, borderColor: staffColors.navy, borderRadius: 4, backgroundColor: cleared ? staffColors.navy : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{cleared ? '✓' : ''}</Text></View><Text style={[staffStyles.body, { flex: 1 }]}>I have confirmed that the group has left and the room is physically cleared.</Text></Pressable>
      <StaffNotice text="Successful release completes the booking, removes its owned time locks and room occupancy, and records a staff release event. Booking history is retained." />
    </> : null}
    <StaffNotice text={message} error />
  </StaffScreen>;
}
