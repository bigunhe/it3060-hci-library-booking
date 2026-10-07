import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { formatColombo, statusLabel } from '@/features/staff/staffFormat';
import { loadRoomName, loadStaffBooking } from '@/features/staff/staffQueries';
import { forceReleaseBooking } from '@/features/staff/staffOperations';
import { staffStyles } from '@/features/staff/staffStyles';
import type { Booking } from '@/types/models';

export default function StaffOverstay() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId ?? '';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError('');
      try {
        if (!bookingId) {
          throw new Error('Missing booking reference.');
        }
        const record = await loadStaffBooking(bookingId);
        const name = await loadRoomName(record.roomId);
        if (!cancelled) {
          setBooking(record);
          setRoomName(name);
        }
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load this booking.');
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  function confirmRelease() {
    Alert.alert(
      'Confirm physical clearance',
      'Release this room only after the group has left. This completes the booking and frees the locks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release room',
          style: 'destructive',
          onPress: () => {
            void release();
          },
        },
      ]
    );
  }

  async function release() {
    setBusy(true);
    setError('');
    try {
      await forceReleaseBooking(bookingId);
      router.replace({ pathname: '/staff/details', params: { bookingId } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Staff release failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
      <Text style={staffStyles.title}>Overstay release</Text>
      {busy && !booking ? <Text style={staffStyles.muted}>Loading...</Text> : null}
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      {booking ? (
        <View style={staffStyles.card}>
          <Text style={staffStyles.body}>{roomName}</Text>
          <Text style={staffStyles.muted}>Status: {statusLabel(booking.status)}</Text>
          <Text style={staffStyles.muted}>Ended {formatColombo(booking.endAt)}</Text>
          <Text style={staffStyles.muted}>
            Occupancy stays blocked until staff or the student clears it. This control
            does not invent a successful release.
          </Text>
          {booking.members.map((member) => (
            <Text key={member.studentId} style={staffStyles.body}>
              {member.name} ({member.studentId})
            </Text>
          ))}
        </View>
      ) : null}

      <AppButton
        title="Confirm room is empty and release"
        variant="danger"
        loading={busy}
        disabled={!booking}
        onPress={confirmRelease}
      />
    </ScrollView>
  );
}
