import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { auth } from '@/lib/firebase';
import FoundationTest from './foundation-test';

export default function Login() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setSignedIn(Boolean(user));
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {signedIn ? (
        <View style={{ padding: 16 }}>
          <AppButton
            title="Continue to Library"
            onPress={() => router.replace('/')}
          />
        </View>
      ) : null}

      <FoundationTest />
    </SafeAreaView>
  );
}