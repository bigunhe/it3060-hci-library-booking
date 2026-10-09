import { Stack, router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';
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

  const completingProfile = needsProfile || profileRetry;
  const profileForm = mode === 'register' || completingProfile;
  const registrationCredentials = mode === 'register' && !auth.currentUser && !profileRetry;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (profileForm) {
        if (mode === 'register' && !auth.currentUser) {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        }
        await (completingProfile
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
    if (completingProfile) await signOut(auth);
    setNeedsProfile(false);
    setProfileRetry(false);
    setError('');
  }

  const title = completingProfile
    ? 'Complete your profile'
    : mode === 'register'
      ? 'Create student account'
      : 'Library Space Booking';

  const subtitle = completingProfile
    ? 'Your profile connects your library bookings to your student identity.'
    : mode === 'register'
      ? 'Create an account for room reservations and saved groups.'
      : 'Digital reservation and access system for discussion and quiet study spaces.';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false, title: mode === 'register' ? 'Register' : 'Sign in' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View accessible accessibilityLabel="SLIIT logo" style={styles.logo}>
              <Text style={styles.logoText}>SLIIT</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {profileForm ? (
            <View style={styles.form}>
              {registrationCredentials ? (
                <>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Student account</Text>
                    <Text style={styles.infoText}>
                      Use an email and password to access saved groups and space reservations.
                    </Text>
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
                    autoComplete="new-password"
                    label="Password"
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    secureTextEntry
                    value={password}
                  />
                </>
              ) : (
                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Finish student profile</Text>
                  <Text style={styles.infoText}>
                    Enter the name and student ID that should appear on your saved groups.
                  </Text>
                </View>
              )}
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
              {completingProfile ? (
                <AppButton onPress={() => void leaveProfile()} title="Sign out" variant="secondary" />
              ) : null}
              {registrationCredentials ? (
                <AppButton onPress={() => router.replace('/login')} title="Back to sign in" variant="secondary" />
              ) : null}
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Email/password access</Text>
                <Text style={styles.infoText}>
                  Sign in with your registered campus email to access saved groups and space reservations.
                  This prototype does not use SLIIT Single Sign-On.
                </Text>
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

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            {!profileForm ? (
              <Text style={styles.note}>
                For authentication issues, visit the Library Counter. Email/password is used because
                institutional SSO is unavailable; it does not verify student identity.
              </Text>
            ) : null}
            <Text style={styles.footerLabel}>IT3060 HCI Prototype</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white, flex: 1 },
  flex: { flex: 1 },
  content: {
    backgroundColor: colors.white,
    flexGrow: 1,
    gap: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  hero: { alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.md },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    elevation: 4,
    height: 58,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: 58,
  },
  logoText: { color: colors.white, fontSize: fontSize.bodySmall, fontWeight: fontWeight.bold },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.bodySmall,
    lineHeight: 20,
    maxWidth: 300,
    textAlign: 'center',
  },
  form: { gap: spacing.lg, width: '100%' },
  infoCard: {
    backgroundColor: '#F1F7FF',
    borderColor: '#D6E7FF',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    width: '100%',
  },
  infoTitle: { color: colors.primary, fontSize: 13, fontWeight: fontWeight.bold },
  infoText: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  registerAction: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  registerText: { color: colors.primary, fontSize: fontSize.bodySmall, fontWeight: fontWeight.semibold },
  error: { color: colors.danger, fontSize: fontSize.bodySmall, lineHeight: 20, textAlign: 'center' },
  note: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  footer: { alignItems: 'center', gap: spacing.sm },
  footerLabel: { color: colors.muted, fontSize: 11 },
});
