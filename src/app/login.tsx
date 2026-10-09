import { router } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { auth, db } from '@/lib/firebase';

export default function Login() {
  const [registering, setRegistering] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(
    Boolean(auth.currentUser)
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  function showError(error: unknown) {
    setFailed(true);

    if (error instanceof FirebaseError) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/email-already-in-use': 'This email already has an account.',
        'auth/weak-password': 'Use a stronger password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/network-request-failed': 'Check your internet connection.',
      };

      setMessage(messages[error.code] ?? `${error.code}: ${error.message}`);
    } else {
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    }
  }

  async function saveProfile() {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in again.');

    // Preserve an existing profile, including a staff role.
    const existing = await getDocFromServer(doc(db, 'users', user.uid));
    if (existing.exists()) return;

    if (!name.trim() || !studentId.trim()) {
      throw new Error('Enter your name and student ID.');
    }

    await setDoc(doc(db, 'users', user.uid), {
      name: name.trim(),
      studentId: studentId.trim().toUpperCase(),
      role: 'student',
      defaultGroupId: null,
    });
  }

  async function submit() {
    if (busy) return;

    setMessage('');
    setFailed(false);
    setBusy(true);

    try {
      if (needsProfile) {
        await saveProfile();
      } else if (registering) {
        if (!name.trim() || !studentId.trim()) {
          throw new Error('Enter your name and student ID.');
        }
        if (password.length < 6) {
          throw new Error('Use at least 6 characters for your password.');
        }

        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // If the profile save fails, the screen allows a retry.
        setNeedsProfile(true);
        setPassword('');
        await saveProfile();
      } else {
        const result = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        setPassword('');

        const profile = await getDocFromServer(
          doc(db, 'users', result.user.uid)
        );

        if (!profile.exists()) {
          setNeedsProfile(true);
          setMessage('Complete your student profile to continue.');
          return;
        }
      }

      router.replace('/');
    } catch (error) {
      if (auth.currentUser) setNeedsProfile(true);
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setFailed(true);
      setMessage('Enter your email first.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setFailed(false);
      setMessage('If this account exists, check its email for reset instructions.');
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);

    try {
      await signOut(auth);
      setNeedsProfile(false);
      setRegistering(false);
      setMessage('');
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BookingScreen
      title="SLIIT Library"
      subtitle="Room & Seat Reservations"
    >
      <View style={ui.card}>
        <Text style={ui.heading}>
          {needsProfile
            ? 'Complete Your Profile'
            : registering
              ? 'Create Your Account'
              : 'Welcome Back'}
        </Text>

        <Text style={ui.muted}>
          Sign in with your library app email and password.
        </Text>

        {needsProfile ? (
          <Text style={ui.body}>{auth.currentUser?.email}</Text>
        ) : (
          <>
            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />

            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!busy}
            />
          </>
        )}

        {registering || needsProfile ? (
          <>
            <AppInput
              label="Full name"
              value={name}
              onChangeText={setName}
              editable={!busy}
              maxLength={80}
            />

            <AppInput
              label="Student ID"
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
              maxLength={30}
            />
          </>
        ) : null}

        <Notice text={message} error={failed} />

        <AppButton
          title={
            needsProfile
              ? 'Continue to Library'
              : registering
                ? 'Create Account'
                : 'Sign In'
          }
          loading={busy}
          onPress={() => void submit()}
        />

        {needsProfile ? (
          <AppButton
            title="Use another account"
            variant="secondary"
            disabled={busy}
            onPress={() => void switchAccount()}
          />
        ) : (
          <>
            <AppButton
              title={registering ? 'Already registered? Sign In' : 'Create Account'}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                setRegistering(!registering);
                setMessage('');
              }}
            />

            {!registering ? (
              <AppButton
                title="Forgot Password?"
                variant="secondary"
                disabled={busy}
                onPress={() => void resetPassword()}
              />
            ) : null}
          </>
        )}
      </View>
    </BookingScreen>
  );
}