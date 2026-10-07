import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { formatColombo, statusLabel } from '@/features/staff/staffFormat';
import {
  loadRoomName,
  loadStaffAuditEvents,
  loadStaffBooking,
} from '@/features/staff/staffQueries';
import { staffStyles } from '@/features/staff/staffStyles';
import type { AuditEvent, Booking } from '@/types/models';

export default function StaffDetails() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId ?? '';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
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
        const audit = await loadStaffAuditEvents(record.id);
        if (!cancelled) {
          setBooking(record);
          setRoomName(name);
          setEvents(audit);
        }
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load details.');
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

  return (
    <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
      <Text style={staffStyles.title}>Booking details</Text>
      {busy ? <Text style={staffStyles.muted}>Loading...</Text> : null}
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      {booking ? (
        <View style={staffStyles.card}>
          <Text style={staffStyles.body}>{roomName}</Text>
          <Text style={staffStyles.muted}>Status: {statusLabel(booking.status)}</Text>
          <Text style={staffStyles.muted}>Reference: {booking.id}</Text>
          <Text style={staffStyles.muted}>
            {formatColombo(booking.startAt)} – {formatColombo(booking.endAt)}
          </Text>
          <Text style={staffStyles.muted}>
            Check-in deadline: {formatColombo(booking.checkInDeadline)}
          </Text>
          <Text style={staffStyles.muted}>Group: {booking.groupName || '—'}</Text>
          {booking.members.map((member) => (
            <Text key={member.studentId} style={staffStyles.body}>
              {member.name} ({member.studentId})
            </Text>
          ))}
        </View>
      ) : null}

      {events.map((event) => (
        <View key={event.id} style={staffStyles.card}>
          <Text style={staffStyles.body}>{event.action.replaceAll('_', ' ')}</Text>
          <Text style={staffStyles.muted}>{formatColombo(event.createdAt)}</Text>
          <Text style={staffStyles.muted}>Actor: {event.actorId}</Text>
        </View>
      ))}

      {booking?.status === 'active' ? (
        <AppButton
          title="If this room is overstaying, open release"
          variant="danger"
          onPress={() =>
            router.push({ pathname: '/staff/overstay', params: { bookingId: booking.id } })
          }
        />
      ) : null}
      <AppButton
        title="Audit for this booking"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/staff/audit', params: { bookingId } })
        }
      />
    </ScrollView>
  );
}
