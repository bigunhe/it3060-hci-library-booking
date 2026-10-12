import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { errorMessage, useClock } from '@/features/booking/bookingDisplay';
import { StaffBadge, StaffBookingCard, StaffLoading, StaffNotice, StaffScreen, styles } from '@/features/staff/StaffUI';
import { useStaffBooking } from '@/features/staff/useStaffBooking';
import { checkInBooking, explainCheckInBlock, resolveStaffBookingId } from '@/features/staff/staffOperations';
import { formatClock } from '@/features/staff/staffFormat';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';

export default function StaffVerify() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const initialId = typeof params.bookingId === 'string' ? params.bookingId : '';
  const [reference, setReference] = useState(initialId);
  const [loadedId, setLoadedId] = useState(initialId);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  useFocusEffect(useCallback(() => () => setScanning(false), []));
  const scanned = useRef(false);
  const submitting = useRef(false);
  const now = useClock();
  const { booking, room, occupancy, loading, error, reload } = useStaffBooking(loadedId);
  const blocked = booking ? explainCheckInBlock(booking, occupancy !== null, now) : 'Look up a reservation first.';
  function lookup(input: string) {
    if (submitting.current) return;
    setMessage('');
    try {
      const id = resolveStaffBookingId(input);
      if (id === loadedId) reload(); else setLoadedId(id);
      setScanning(false);
    } catch (failure) { setLoadedId(''); setMessage(errorMessage(failure)); }
  }
  function readCode(result: BarcodeScanningResult) {
    if (scanned.current) return;
    scanned.current = true; setReference(result.data); lookup(result.data);
  }
  async function openCamera() {
    setMessage('');
    try {
      const result = permission?.granted ? permission : await requestPermission();
      if (!result.granted) { setMessage('Camera permission was denied. Enter the full booking reference below instead.'); return; }
      scanned.current = false; setScanning(true);
    } catch (failure) { setMessage(errorMessage(failure)); }
  }
  async function authorize() {
    if (!booking || blocked || loading || error || submitting.current) return;
    submitting.current = true; setBusy(true); setMessage('');
    try { await checkInBooking(booking.id); router.replace({ pathname: '/staff/details', params: { bookingId: booking.id } }); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <StaffScreen title="Verify Check-In" tab="scanner" back footer={<AppButton title="Authorize Check-In" disabled={!booking || !!blocked || loading || !!error || busy} loading={busy} onPress={() => void authorize()} />}>
    <View style={[staffStyles.card, { backgroundColor: staffColors.scanNavy, padding: 12 }]}>
      {scanning && permission?.granted ? <CameraView style={{ height: 220, borderRadius: 12 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={readCode} onMountError={(failure) => { setScanning(false); setMessage(`Camera unavailable: ${failure.message}. Use manual lookup.`); }} /> : <View style={{ height: 150, justifyContent: 'center', alignItems: 'center', gap: 12 }}><Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>Scan Digital Pass</Text><Text style={{ color: '#CBD5E1', fontSize: 13, textAlign: 'center' }}>QR and manual lookup load the same reservation. Scanning does not authorize entry.</Text></View>}
      <AppButton title={scanning ? 'Stop Camera' : 'Open QR Scanner'} variant="secondary" disabled={busy} onPress={scanning ? () => setScanning(false) : () => void openCamera()} />
    </View>
    <View style={staffStyles.card}><Text style={staffStyles.kicker}>MANUAL SEARCH FALLBACK</Text><AppInput label="Full booking reference or pass QR text" value={reference} onChangeText={(value) => { setReference(value); setLoadedId(''); setMessage(''); }} editable={!busy} autoCapitalize="none" autoCorrect={false} /><AppButton title="Look Up Reservation" variant="secondary" disabled={!reference.trim() || busy} onPress={() => lookup(reference)} /><Text style={staffStyles.muted}>Use the full 20-character reference shown below the student QR code, not its shortened card label.</Text></View>
    <StaffLoading loading={loading} error={error} retry={reload} />
    {booking && !loading && !error ? <>
      <View style={[staffStyles.card, { borderColor: blocked ? staffColors.chipOrange : staffColors.chipGreen }]}><StaffBadge label={blocked ? 'Booking found · check-in blocked' : 'Booking eligible for check-in'} state={blocked ? 'pending' : 'active'} /><Text style={styles.value}>{blocked ?? 'Check the group and roster below, then authorize check-in.'}</Text><Text style={staffStyles.muted}>Check-in window: {formatClock(booking.startAt)} – {formatClock(booking.checkInDeadline)}</Text></View>
      <StaffBookingCard booking={booking} room={room} roster />
      <AppButton title="Clear Lookup / Reject Arrival" variant="secondary" disabled={busy} onPress={() => { setLoadedId(''); setReference(''); setMessage('Lookup cleared. No check-in was recorded.'); }} />
    </> : null}
    <StaffNotice text={message} error />
  </StaffScreen>;
}
