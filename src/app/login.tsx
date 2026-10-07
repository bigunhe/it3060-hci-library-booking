import { router } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { AppInput } from '@/constants/ui/AppInput';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/');
    });
  }, []);

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
      router.replace('/');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>SLIIT Library</Text>
      <Text style={styles.muted}>
        Sign in with your Firebase email and password. Staff accounts open the
        operations dashboard. Student accounts open room booking.
      </Text>
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton
        title="Sign in"
        loading={busy}
        disabled={!email.trim() || !password}
        onPress={() => void signIn()}
      />
      <View>
        <AppButton
          title="Foundation test tools"
          variant="secondary"
          onPress={() => router.push('/foundation-test')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.primary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  muted: {
    color: colors.muted,
    fontSize: fontSize.bodySmall,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.bodySmall,
  },
});
