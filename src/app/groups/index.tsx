import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { StudentNavigation } from '@/components/ui/StudentNavigation';
import { colors } from '@/constants/theme';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { auth, db } from '@/lib/firebase';
import type { SavedGroup } from '@/types/models';

export default function SavedGroups() {
  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setGroups([]);
      setDefaultId(null);
      setLoaded(false);
      if (!user) router.replace('/login');
    });
  }, []);

  useEffect(() => {
    if (!uid) return;

    const stopProfile = onSnapshot(doc(db, 'users', uid), (snapshot) => {
      setDefaultId(snapshot.data()?.defaultGroupId ?? null);
    }, (failure) => setError(failure.message));

    const stopGroups = onSnapshot(
      query(collection(db, 'groups'), where('ownerId', '==', uid)),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }) as SavedGroup);

        list.sort((a, b) => a.name.localeCompare(b.name));
        setGroups(list);
        setLoaded(true);
      },
      (failure) => {
        setError(failure.message);
        setLoaded(true);
      }
    );

    return () => {
      stopProfile();
      stopGroups();
    };
  }, [uid, retry]);

  async function makeDefault(groupId: string) {
    if (!uid || busy) return;

    setBusy(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', uid), {
        defaultGroupId: groupId,
      });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Could not set default.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!uid || busy) return;

    setBusy(true);
    setError('');

    try {
      const batch = writeBatch(db);

      // A default group must be unlinked before it can be deleted.
      if (defaultId === groupId) {
        batch.update(doc(db, 'users', uid), {
          defaultGroupId: null,
        });
      }

      batch.delete(doc(db, 'groups', groupId));
      await batch.commit();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Could not delete group.'
      );
    } finally {
      setBusy(false);
    }
  }

  function askToDelete(group: SavedGroup) {
    Alert.alert(
      'Delete saved group?',
      `Delete "${group.name}"? Existing bookings will keep their member lists.`,
      [
        { text: 'Keep Group', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteGroup(group.id),
        },
      ]
    );
  }

  return (
    <BookingScreen
      title="Saved Groups"
      subtitle="Keep your study groups ready for booking"
      footer={<StudentNavigation active="Groups" />}
    >
      <AppButton
        title="+ Create Group"
        disabled={busy || !uid}
        onPress={() => router.push('/groups/edit')}
      />

      <Notice text={error} error />

      {error ? (
        <AppButton
          title="Retry"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            setError('');
            setLoaded(false);
            setRetry((value) => value + 1);
          }}
        />
      ) : null}

      {!loaded ? (
        <ActivityIndicator color={colors.primary} />
      ) : !groups.length ? (
        <Notice text="No saved groups yet. Create a group with 3–8 members, including yourself." />
      ) : (
        groups.map((group) => (
          <View key={group.id} style={ui.card}>
            <Text style={ui.heading}>{group.name}</Text>
            <Text style={ui.muted}>
              {group.members.length} members
              {defaultId === group.id ? ' · DEFAULT GROUP' : ''}
            </Text>

            <AppButton
              title={expandedId === group.id ? 'Hide Members' : 'View Members'}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                setExpandedId(expandedId === group.id ? '' : group.id);
              }}
            />

            {expandedId === group.id ? (
              group.members.map((member, index) => (
                <View key={member.studentId} style={ui.notice}>
                  <Text style={ui.body}>{index + 1}. {member.name}</Text>
                  <Text style={ui.muted}>{member.studentId}</Text>
                </View>
              ))
            ) : null}

            <AppButton
              title="Book with This Group"
              disabled={busy}
              onPress={() => router.push({
                pathname: '/rooms',
                params: { groupId: group.id },
              })}
            />

            <AppButton
              title="Edit Group"
              variant="secondary"
              disabled={busy}
              onPress={() => router.push({
                pathname: '/groups/edit',
                params: { groupId: group.id },
              })}
            />

            {defaultId !== group.id ? (
              <AppButton
                title="Set as Default"
                variant="secondary"
                disabled={busy}
                onPress={() => void makeDefault(group.id)}
              />
            ) : null}

            <AppButton
              title="Delete Group"
              variant="danger"
              disabled={busy}
              onPress={() => askToDelete(group)}
            />
          </View>
        ))
      )}
    </BookingScreen>
  );
}