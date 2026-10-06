import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDocFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { cancelBookingHold } from '@/lib/cancelBookingHold';
import { confirmBooking } from '@/lib/bookings';
import { auth, db } from '@/lib/firebase';
import type { Booking, GroupMember } from '@/types/models';

export default function BookingReview() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    groupSize?: string;
  }>();

  const bookingId = params.bookingId ?? '';
  const requestedSize = Number(params.groupSize);
  const memberCount =
    Number.isInteger(requestedSize) &&
    requestedSize >= 3 &&
    requestedSize <= 8
      ? requestedSize
      : 3;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [groupName, setGroupName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [members, setMembers] = useState<GroupMember[]>(() =>
    Array.from({ length: memberCount }, () => ({
      name: '',
      studentId: '',
    }))
  );
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('Loading your booking...');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      try {
        if (!bookingId) throw new Error('Missing booking ID.');

        const snapshot = await getDocFromServer(
          doc(db, 'bookings', bookingId)
        );

        if (!snapshot.exists()) {
          throw new Error('Booking not found.');
        }

        const data = {
          ...snapshot.data(),
          id: snapshot.id,
        } as Booking;

        if (data.ownerId !== auth.currentUser?.uid) {
          throw new Error('This booking belongs to another user.');
        }

        if (!cancelled) {
          setBooking(data);
          setConfirmed(data.status === 'confirmed');
          setMessage(
            data.status === 'held'
              ? 'Complete your details before the hold expires.'
              : `Booking status: ${data.status}`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Could not load your booking.'
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  function updateMember(
    index: number,
    field: keyof GroupMember,
    value: string
  ) {
    setMembers((previous) =>
      previous.map((member, position) =>
        position === index
          ? { ...member, [field]: value }
          : member
      )
    );
  }

  async function confirm() {
    setBusy(true);
    setMessage('Confirming your reservation...');

    try {
      await confirmBooking(
        bookingId,
        groupName,
        members,
        purpose
      );

      setConfirmed(true);
      setMessage('Your reservation is confirmed.');
      Alert.alert('Reservation confirmed', 'Your booking has been saved.');
    } catch (error) {
      const details =
        error instanceof Error
          ? error.message
          : 'Could not confirm your reservation.';
      setMessage(details);
      Alert.alert('Confirmation failed', details);
    } finally {
      setBusy(false);
    }
  }

  async function abandonHold() {
    setBusy(true);
    setMessage('Releasing your hold...');

    try {
      await cancelBookingHold(bookingId);
      router.replace('/');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not release your hold.'
      );
    } finally {
      setBusy(false);
    }
  }

  function formatTime(timestamp: Booking['startAt']) {
    return timestamp.toDate().toLocaleString('en-GB', {
      timeZone: 'Asia/Colombo',
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {confirmed ? 'Reservation confirmed' : 'Review reservation'}
      </Text>

      {booking ? (
        <>
          <Text>Room: {booking.roomId}</Text>
          <Text>Start: {formatTime(booking.startAt)}</Text>
          <Text>End: {formatTime(booking.endAt)}</Text>
        </>
      ) : null}

      <Text>{message}</Text>

      {confirmed ? (
        <>
          <Text>Booking reference: {bookingId}</Text>
          <Text>
            Your reservation is saved in Firebase.
          </Text>
          <Button
            title="Return to rooms"
            onPress={() => router.replace('/')}
          />
        </>
      ) : booking?.status === 'held' ? (
        <>
          <Text>
            Hold expires: {formatTime(booking.holdExpiresAt)}
          </Text>

          <Text>Group name</Text>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Study group"
            editable={!busy}
          />

          <Text>Purpose</Text>
          <TextInput
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Assignment discussion"
            editable={!busy}
          />

          <Text>Include yourself in the member list.</Text>

          {members.map((member, index) => (
            <View key={index} style={styles.card}>
              <Text>Member {index + 1}</Text>
              <TextInput
                style={styles.input}
                value={member.name}
                onChangeText={(value) =>
                  updateMember(index, 'name', value)
                }
                placeholder="Full name"
                editable={!busy}
              />
              <TextInput
                style={styles.input}
                value={member.studentId}
                onChangeText={(value) =>
                  updateMember(index, 'studentId', value)
                }
                placeholder="Student ID"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!busy}
              />
            </View>
          ))}

          <Button
            title="Confirm reservation"
            disabled={busy}
            onPress={() => void confirm()}
          />
          <Button
            title="Cancel hold and return"
            disabled={busy}
            onPress={() => void abandonHold()}
          />
        </>
      ) : (
        <Button
          title="Return to rooms"
          disabled={busy}
          onPress={() => router.replace('/')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#183153',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 10,
  },
});