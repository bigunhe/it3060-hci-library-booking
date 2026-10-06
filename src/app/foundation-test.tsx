import { useEffect, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDocFromServer, Timestamp } from 'firebase/firestore';

import { confirmBooking, createBookingHold } from '@/lib/bookings';
import { cancelBookingHold } from '@/lib/cancelBookingHold';
import { auth, db } from '@/lib/firebase';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('Checking login...');
  const [busy, setBusy] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [startAt] = useState(() => {
    const hourMs = 60 * 60 * 1000;

    return Timestamp.fromMillis(
      Math.ceil(Date.now() / hourMs) * hourMs + hourMs
    );
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSignedInEmail(user?.email ?? null);
      setBookingId(null);
      setMessage(user ? 'Signed in.' : 'Signed out.');
    });
  }, []);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setMessage('Working...');

    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unexpected error.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function logIn() {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    setPassword('');
  }

  async function readRoom() {
    const snapshot = await getDocFromServer(
      doc(db, 'rooms', 'room-02')
    );

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    setMessage(`Room read verified: ${snapshot.data().name}.`);
  }

  async function createHold() {
    const id = await createBookingHold('room-02', startAt);
    setBookingId(id);
    setMessage(`Hold created: ${id}`);
  }

  async function confirmHold() {
    if (!bookingId) {
      throw new Error('Create a hold first.');
    }

    await confirmBooking(
      bookingId,
      'Demo Study Group',
      [
        { name: 'Demo Student One', studentId: 'DEMO001' },
        { name: 'Demo Student Two', studentId: 'DEMO002' },
        { name: 'Demo Student Three', studentId: 'DEMO003' },
      ],
      'Foundation test'
    );

    setMessage('Booking confirmed.');
  }

  async function cancelHold() {
    if (!bookingId) {
      throw new Error('Create a hold first.');
    }

    await cancelBookingHold(bookingId);
    setMessage('Hold cancelled. Its owned locks were released.');
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Foundation Test — VERSION 3</Text>
      <Text selectable>{message}</Text>

      {signedInEmail ? (
        <>
          <Text>{signedInEmail}</Text>

          <Text>
            Test start:{' '}
            {startAt.toDate().toLocaleString('en-GB', {
              timeZone: 'Asia/Colombo',
            })}
          </Text>

          <Text selectable>
            Booking ID: {bookingId ?? 'No hold selected'}
          </Text>

          <Button
            title="Read room"
            disabled={busy}
            onPress={() => {
              void runAction(readRoom);
            }}
          />

          <Button
            title="Create hold"
            disabled={busy}
            onPress={() => {
              void runAction(createHold);
            }}
          />

          <Button
            title="Confirm hold"
            disabled={busy || !bookingId}
            onPress={() => {
              void runAction(confirmHold);
            }}
          />

          <Button
            title="Cancel hold"
            disabled={busy || !bookingId}
            onPress={() => {
              void runAction(cancelHold);
            }}
          />

          <Button
            title="Sign out"
            disabled={busy}
            onPress={() => {
              void runAction(() => signOut(auth));
            }}
          />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="Sign in"
            disabled={busy || !email.trim() || !password}
            onPress={() => {
              void runAction(logIn);
            }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
  },
});