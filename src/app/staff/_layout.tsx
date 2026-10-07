import { Redirect, Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { auth, db } from '@/lib/firebase';

export default function StaffLayout() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let stopped = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setReady(false);
      setError('');
      if (!user) {
        setAllowed(false);
        setReady(true);
        return;
      }

      void getDocFromServer(doc(db, 'users', user.uid))
        .then((profile) => {
          if (stopped || auth.currentUser?.uid !== user.uid) return;
          setAllowed(profile.exists() && profile.data().role === 'staff');
          setReady(true);
        })
        .catch((failure: unknown) => {
          if (stopped || auth.currentUser?.uid !== user.uid) return;
          setError(failure instanceof Error ? failure.message : 'Could not verify staff access.');
          setAllowed(false);
          setReady(true);
        });
    });
    return () => {
      stopped = true;
      unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Checking staff access...</Text>
      </View>
    );
  }

  if (!allowed) {
    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Text>{error}</Text>
        </View>
      );
    }
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Staff dashboard' }} />
      <Stack.Screen name="verify" options={{ title: 'Verify pass' }} />
      <Stack.Screen name="details" options={{ title: 'Booking details' }} />
      <Stack.Screen name="audit" options={{ title: 'Audit log' }} />
      <Stack.Screen name="overstay" options={{ title: 'Overstay release' }} />
    </Stack>
  );
}
