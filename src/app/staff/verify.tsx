import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { AppInput } from '@/constants/ui/AppInput';
import { formatColombo, statusLabel } from '@/features/staff/staffFormat';
import { loadRoomName, loadStaffBooking } from '@/features/staff/staffQueries';
import { checkInBooking, resolveStaffBookingId } from '@/features/staff/staffOperations';
import { staffStyles } from '@/features/staff/staffStyles';
import type { Booking } from '@/types/models';

export default function StaffVerify() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [reference, setReference] = useState(params.bookingId ?? '');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(idText: string) {
    setBusy(true);
    setError('');
    setBooking(null);
    try {
      const bookingId = resolveStaffBookingId(idText);
      const record = await loadStaffBooking(bookingId);
      const name = await loadRoomName(record.roomId);
      setBooking(record);
      setRoomName(name);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not load this booking.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (params.bookingId) {
      void load(params.bookingId);
    }
  }, [params.bookingId]);

  async function authorize() {
    if (!booking) return;
    setBusy(true);
    setError('');
    try {
      await checkInBooking(booking.id);
      router.replace({ pathname: '/staff/details', params: { bookingId: booking.id } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
      <Text style={staffStyles.title}>Verify reservation</Text>
      <Text style={staffStyles.muted}>
        Review the roster before authorizing. Looking up a code does not check anyone in.
      </Text>
      <AppInput
        label="Booking reference or pass QR text"
        value={reference}
        onChangeText={setReference}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppButton
        title="Find booking"
        variant="secondary"
        disabled={busy}
        onPress={() => void load(reference)}
      />
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      {booking ? (
        <View style={staffStyles.card}>
          <Text style={staffStyles.body}>{roomName}</Text>
          <Text style={staffStyles.muted}>Status: {statusLabel(booking.status)}</Text>
          <Text style={staffStyles.muted}>Reference: {booking.id}</Text>
          <Text style={staffStyles.muted}>
            {formatColombo(booking.startAt)} – {formatColombo(booking.endAt)}
          </Text>
          <Text style={staffStyles.muted}>Group: {booking.groupName || '—'}</Text>
          <Text style={staffStyles.muted}>Purpose: {booking.purpose || '—'}</Text>
          {booking.members.map((member) => (
            <Text key={member.studentId} style={staffStyles.body}>
              {member.name} ({member.studentId})
            </Text>
          ))}
          <AppButton
            title="Authorize check-in"
            loading={busy}
            onPress={() => void authorize()}
          />
          <AppButton
            title="Open booking details"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/staff/details', params: { bookingId: booking.id } })
            }
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
