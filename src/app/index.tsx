import { FirebaseError } from 'firebase/app';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { auth, db } from '@/lib/firebase';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('Checking login state...');
  const [busy, setBusy] = useState(false);
  const [roomMessage, setRoomMessage] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSignedInEmail(user?.email ?? null);
      setMessage(user ? 'Firebase login verified.' : 'Signed out.');
    });
  }, []);

  async function logIn() {
    setBusy(true);
    setMessage('Signing in...');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (error) {
      setMessage(
        error instanceof FirebaseError
          ? error.code
          : 'Unexpected login error.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function logOut() {
    setBusy(true);

    try {
      await signOut(auth);
    } catch (error) {
      setMessage(
        error instanceof FirebaseError
          ? error.code
          : 'Unexpected logout error.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function testRoomRead() {
    setBusy(true);
    setRoomMessage('Reading room from Firestore...');
  
    try {
      const roomRef = doc(db, 'rooms', 'room-02');
      const snapshot = await getDocFromServer(roomRef);
  
      if (!snapshot.exists()) {
        setRoomMessage('Room not found. Check the collection and document ID.');
        return;
      }
  
      const room = snapshot.data();
  
      setRoomMessage(
        `Firestore verified: ${room.name}, Level ${room.level}, ` +
        `capacity ${room.minCapacity}–${room.maxCapacity}.`
      );
    } catch (error) {
      setRoomMessage(
        error instanceof FirebaseError
          ? error.code
          : 'Unexpected database error.'
      );
    } finally {
      setBusy(false);
    }
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      <Text>{message}</Text>

      {signedInEmail ? (
        <>
          <Text>Signed in as: {signedInEmail}</Text>
          <Button
              title="Test Firestore room read"
              onPress={testRoomRead}
              disabled={busy}
            />
      <Text>{roomMessage}</Text>
          <Button title="Sign out" onPress={logOut} disabled={busy} />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Test account email"
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
            title={busy ? 'Signing in...' : 'Sign in'}
            onPress={logIn}
            disabled={busy || !email.trim() || !password}
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