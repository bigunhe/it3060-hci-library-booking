import { router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { AppInput } from '@/constants/ui/AppInput';
import { auth, db } from '@/lib/firebase';
import {
  completeStudentProfile,
  createStudentProfile,
  readableError,
} from './groupOperations';

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileRetry, setProfileRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const profileForm = mode === 'register' || needsProfile || profileRetry;
  const registrationCredentials = mode === 'register' && !auth.currentUser && !profileRetry;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (profileForm) {
        if (mode === 'register' && !auth.currentUser) {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        }
        await (profileRetry || needsProfile
          ? completeStudentProfile({ name, studentId })
          : createStudentProfile({ name, studentId }));
        router.replace('/');
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getDoc(doc(db, 'users', credential.user.uid));
      if (!profile.exists()) {
        setNeedsProfile(true);
        setError('Your account is signed in. Complete your student profile to continue.');
        return;
      }
      router.replace('/');
    } catch (failure: unknown) {
      setError(readableError(failure));
      if (auth.currentUser && (mode === 'register' || needsProfile)) {
        setProfileRetry(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function leaveProfile() {
    if (profileRetry || needsProfile) await signOut(auth);
    setNeedsProfile(false);
    setProfileRetry(false);
    setError('');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View accessible accessibilityLabel="SLIIT logo" style={styles.logo}>
            <Text style={styles.logoText}>SLIIT</Text>
          </View>
          <Text style={styles.title}>
            {needsProfile || profileRetry
              ? 'Complete your profile'
              : mode === 'register'
                ? 'Create student account'
                : 'Library Space Booking'}
          </Text>
          <Text style={styles.subtitle}>
            {needsProfile || profileRetry
              ? 'Your profile connects your library bookings to your student identity.'
              : mode === 'register'
                ? 'Create an account for room reservations and saved groups.'
                : 'Digital reservation and access system for discussion and quiet study spaces.'}
          </Text>
        </View>

        {profileForm ? (
          <View style={styles.form}>
            {registrationCredentials ? (
              <>
                <AppInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  value={email}
                />
                <AppInput
                  autoCapitalize="none"
                  autoComplete="new-password"
                  label="Password"
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry
                  value={password}
                />
              </>
            ) : null}
            {registrationCredentials ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Student account</Text>
                <Text style={styles.infoText}>Use an email and password to access saved groups and space reservations.</Text>
              </View>
            ) : null}
            <AppInput
              autoCapitalize="words"
              label="Full name"
              onChangeText={setName}
              placeholder="Alex Perera"
              value={name}
            />
            <AppInput
              autoCapitalize="characters"
              label="Student ID"
              onChangeText={setStudentId}
              placeholder="IT12345678"
              value={studentId}
            />
            <AppButton
              loading={busy}
              onPress={() => void submit()}
              title={registrationCredentials ? 'Create account' : 'Save profile'}
            />
            {(profileRetry || needsProfile) && (
              <AppButton onPress={() => void leaveProfile()} title="Sign out" variant="secondary" />
            )}
            {registrationCredentials ? (
              <AppButton onPress={() => router.replace('/login')} title="Back to sign in" variant="secondary" />
            ) : null}
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Email/password access</Text>
              <Text style={styles.infoText}>Sign in with your registered account to access saved groups and reservations.</Text>
            </View>
            <AppInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <AppInput
              autoCapitalize="none"
              autoComplete="password"
              label="Password"
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              value={password}
            />
            <AppButton loading={busy} onPress={() => void submit()} title="Sign in" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create student account"
              disabled={busy}
              onPress={() => router.push('/register')}
              style={styles.registerAction}
            >
              <Text style={styles.registerText}>Create a student account</Text>
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.footer}>
          {!profileForm ? (
            <Text style={styles.note}>Email/password is used for this prototype; it does not verify institutional identity.</Text>
          ) : null}
          <Text style={styles.footerLabel}>IT3060 HCI Prototype</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 24,
    gap: 26,
    backgroundColor: '#FFFFFF',
  },
  hero: { alignItems: 'center', gap: 16, paddingHorizontal: 12 },
  logo: {
    alignItems: 'center',
    backgroundColor: '#0B2545',
    borderRadius: 14,
    elevation: 4,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: 58,
  },
  logoText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  title: { color: '#0F172A', fontSize: 27, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, maxWidth: 300, textAlign: 'center' },
  form: { gap: 14, width: '100%' },
  infoCard: {
    backgroundColor: '#F1F7FF',
    borderColor: '#D6E7FF',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
    width: '100%',
  },
  infoTitle: { color: '#0B2545', fontSize: 13, fontWeight: '700' },
  infoText: { color: '#475569', fontSize: 12, lineHeight: 18 },
  registerAction: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  registerText: { color: '#0B2545', fontSize: 14, fontWeight: '600' },
  error: { color: '#B42318', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  note: { color: '#64748B', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  footer: { alignItems: 'center', gap: 8 },
  footerLabel: { color: '#64748B', fontSize: 11 },
});
