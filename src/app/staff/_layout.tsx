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
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F4F6F9' }}>
        <Text style={{ textAlign: 'center', color: '#0B1F4B', fontWeight: '600' }}>
          Checking staff access...
        </Text>
      </View>
    );
  }

  if (!allowed) {
    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F4F6F9' }}>
          <Text style={{ color: '#B42318', textAlign: 'center' }}>{error}</Text>
        </View>
      );
    }
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Staff Operations' }} />
      <Stack.Screen name="verify" options={{ title: 'Verify Check-In' }} />
      <Stack.Screen name="details" options={{ title: 'Booking Details' }} />
      <Stack.Screen name="audit" options={{ title: 'Audit Log' }} />
      <Stack.Screen name="overstay" options={{ title: 'Resolve Overstay' }} />
    </Stack>
  );
}
