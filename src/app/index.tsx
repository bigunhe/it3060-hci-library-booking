import { Redirect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

import { auth, db } from '@/lib/firebase';

type Destination = '/login' | '/rooms' | '/staff';

export default function Index() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let stopped = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setDestination(null);
      setError('');
      if (!user) {
        setDestination('/login');
        return;
      }

      void getDocFromServer(doc(db, 'users', user.uid))
        .then((profile) => {
          if (stopped || auth.currentUser?.uid !== user.uid) return;
          if (!profile.exists()) {
            setDestination('/login');
          } else {
            setDestination(profile.data().role === 'staff' ? '/staff' : '/rooms');
          }
        })
        .catch((failure: unknown) => {
          if (stopped || auth.currentUser?.uid !== user.uid) return;
          setError(failure instanceof Error ? failure.message : 'Could not load your profile.');
        });
    });
    return () => {
      stopped = true;
      unsubscribe();
    };
  }, [retry]);

  if (destination) return <Redirect href={destination} />;
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text>{error || 'Opening SLIIT Library...'}</Text>
      {error ? (
        <Button title="Retry" onPress={() => setRetry((value) => value + 1)} />
      ) : null}
    </View>
  );
}
