import { router } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  getDocsFromServer,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createBookingHold } from '@/lib/bookings';
import { auth, db } from '@/lib/firebase';
import type { Room } from '@/types/models';

const timeZone = 'Asia/Colombo';

function initialSlot() {
  const hour = 60 * 60 * 1000;
  const date = new Date(Math.ceil(Date.now() / hour) * hour + hour);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (name: string) =>
    parts.find((part) => part.type === name)?.value ?? '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
}

export default function Index() {
  const [slot] = useState(initialSlot);
  const [date, setDate] = useState(slot.date);
  const [time, setTime] = useState(slot.time);
  const [groupSize, setGroupSize] = useState('3');
  const [email, setEmail] = useState<string | null>(null);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
      setCheckingLogin(false);
      setRooms([]);
    });
  }, []);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;

    async function loadRooms() {
      setBusy(true);
      setMessage('Loading rooms...');

      try {
        const snapshot = await getDocsFromServer(
          collection(db, 'rooms')
        );

        const availableRooms = snapshot.docs
          .map((item) => ({
            ...item.data(),
            id: item.id,
          }) as Room)
          .filter((room) => room.enabled);

        if (!cancelled) {
          setRooms(availableRooms);
          setMessage(
            availableRooms.length ? '' : 'No rooms have been added yet.'
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Could not load rooms.'
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void loadRooms();

    return () => {
      cancelled = true;
    };
  }, [email]);

  async function reserve(room: Room, now: number) {
    setMessage('');

    const count = Number(groupSize);

    if (!Number.isInteger(count) || count < 3 || count > 8) {
      setMessage('Enter a group size from 3 to 8.');
      return;
    }

    if (count < room.minCapacity || count > room.maxCapacity) {
      setMessage('This room does not fit your group size.');
      return;
    }

    const selectedDate = date.trim();
    const selectedTime = time.trim();

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ||
      !/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(selectedTime)
    ) {
      setMessage(
        'Use YYYY-MM-DD for the date and HH:00 or HH:30 for the time.'
      );
      return;
    }

    // The entered date and time are Sri Lankan local time.
    const start = new Date(
      `${selectedDate}T${selectedTime}:00+05:30`
    );

    if (!Number.isFinite(start.getTime())) {
      setMessage('Enter a valid calendar date.');
      return;
    }

    const localValue = new Date(
      start.getTime() + 330 * 60 * 1000
    ).toISOString().slice(0, 16);

    if (localValue !== `${selectedDate}T${selectedTime}`) {
      setMessage('Enter a valid calendar date.');
      return;
    }

    if (start.getTime() <= now) {
      setMessage('Choose a future date and time.');
      return;
    }

    setBusy(true);
    setMessage('Checking the time and holding the room...');

    try {
      const bookingId = await createBookingHold(
        room.id,
        Timestamp.fromDate(start)
      );

      router.push({
        pathname: '/booking/review',
        params: {
          bookingId,
          groupSize: String(count),
        },
      });

      setMessage('');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not reserve this time.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function logOut() {
    setBusy(true);

    try {
      await signOut(auth);
      setMessage('');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not sign out.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (checkingLogin) {
    return (
      <View style={styles.center}>
        <Text>Checking login...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>SLIIT Library</Text>

      {!email ? (
        <>
          <Text>Sign in to reserve a room.</Text>
          <Button
            title="Open temporary sign-in screen"
            onPress={() => router.push('/foundation-test')}
          />
          <Text>
            After signing in, use the back arrow to return here.
          </Text>
        </>
      ) : (
        <>
          <Text>{email}</Text>
          <Text style={styles.heading}>Reserve a room</Text>
          <Text>
            Reservations last 60 minutes. Times are in Sri Lankan time.
          </Text>

          <Text>Date — YYYY-MM-DD</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-07"
            editable={!busy}
          />

          <Text>Start time — HH:00 or HH:30</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="10:30"
            editable={!busy}
          />

          <Text>Group size — including yourself</Text>
          <TextInput
            style={styles.input}
            value={groupSize}
            onChangeText={setGroupSize}
            keyboardType="number-pad"
            maxLength={1}
            editable={!busy}
          />

          {message ? <Text>{message}</Text> : null}

          {rooms.map((room) => {
            const count = Number(groupSize);
            const fits =
              Number.isInteger(count) &&
              count >= 3 &&
              count <= 8 &&
              count >= room.minCapacity &&
              count <= room.maxCapacity;

            return (
              <View key={room.id} style={styles.card}>
                <Text style={styles.heading}>{room.name}</Text>
                <Text>
                  Level {room.level} · {room.location}
                </Text>
                <Text>
                  Capacity: {room.minCapacity}–{room.maxCapacity}
                </Text>
                <Text>{room.equipment.join(', ')}</Text>
                <Button
                  title={
                    fits
                      ? 'Check time and reserve'
                      : 'Does not fit this group size'
                  }
                  disabled={busy || !fits}
                  onPress={() => void reserve(room, Date.now())}
                />
              </View>
            );
          })}

          <Button
            title="Firebase test screen"
            disabled={busy}
            onPress={() => router.push('/foundation-test')}
          />
          <Button
            title="Sign out"
            disabled={busy}
            onPress={() => void logOut()}
          />
        </>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#183153',
  },
  heading: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
});
