import { router, useLocalSearchParams } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDocFromServer,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { colors } from '@/constants/theme';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { auth, db } from '@/lib/firebase';
import type { GroupMember, SavedGroup, UserProfile } from '@/types/models';

export default function EditGroup() {
  const { groupId = '' } = useLocalSearchParams<{ groupId?: string }>();
  const [name, setName] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let stopped = false;

    async function load() {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }

      const profileDoc = await getDocFromServer(
        doc(db, 'users', user.uid)
      );
      if (!profileDoc.exists()) {
        throw new Error('Complete your student profile before creating a group.');
      }

      const profile = profileDoc.data() as UserProfile;
      if (!profile.name || !profile.studentId) {
        throw new Error('Your profile needs a name and student ID.');
      }

      const owner: GroupMember = {
        name: profile.name,
        studentId: profile.studentId.trim().toUpperCase(),
      };

      let group: SavedGroup | null = null;

      if (groupId) {
        const snapshot = await getDocFromServer(
          doc(db, 'groups', groupId)
        );

        if (!snapshot.exists()) throw new Error('This group no longer exists.');

        group = { ...snapshot.data(), id: snapshot.id } as SavedGroup;
        if (group.ownerId !== user.uid) {
          throw new Error('You can only edit your own groups.');
        }
      }

      if (stopped) return;

      setOwnerId(owner.studentId);
      setName(group?.name ?? '');
      setMembers(group?.members ?? [owner]);
      setLoaded(true);
    }

    void load().catch((failure: unknown) => {
      if (!stopped) {
        setError(
          failure instanceof Error ? failure.message : 'Could not load group.'
        );
      }
    });

    return () => {
      stopped = true;
    };
  }, [groupId, retry]);

  function addMember() {
    const id = studentId.trim().toUpperCase();
    const fullName = memberName.trim();

    if (!id || !fullName) {
      setError('Enter the member name and student ID.');
      return;
    }
    if (members.length >= 8) {
      setError('A group can have at most 8 members.');
      return;
    }
    if (members.some((member) => member.studentId.toUpperCase() === id)) {
      setError('This student ID is already in the group.');
      return;
    }

    setMembers([...members, { name: fullName, studentId: id }]);
    setMemberName('');
    setStudentId('');
    setError('');
  }

  function changeMember(index: number, field: 'name' | 'studentId', value: string) {
    setMembers(members.map((member, position) => (
      position === index ? { ...member, [field]: value } : member
    )));
  }

  async function save() {
    if (busy || !loaded) return;

    const user = auth.currentUser;
    if (!user) {
      router.replace('/login');
      return;
    }

    const roster = members.map((member) => ({
      name: member.name.trim(),
      studentId: member.studentId.trim().toUpperCase(),
    }));

    if (!name.trim()) {
      setError('Enter a group name.');
      return;
    }
    if (roster.length < 3 || roster.length > 8) {
      setError('Include 3–8 members, counting yourself.');
      return;
    }
    if (roster.some((member) => !member.name || !member.studentId)) {
      setError('Every member needs a name and student ID.');
      return;
    }
    if (new Set(roster.map((member) => member.studentId)).size !== roster.length) {
      setError('Every student ID must be unique.');
      return;
    }
    if (!roster.some((member) => member.studentId === ownerId)) {
      setError('Include yourself in the group.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (groupId) {
        await updateDoc(doc(db, 'groups', groupId), {
          name: name.trim(),
          members: roster,
        });
      } else {
        await addDoc(collection(db, 'groups'), {
          ownerId: user.uid,
          name: name.trim(),
          members: roster,
          createdAt: serverTimestamp(),
        });
      }

      router.replace('/groups');
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Could not save group.'
      );
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    Alert.alert('Discard changes?', 'Unsaved changes will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => router.replace('/groups'),
      },
    ]);
  }

  return (
    <BookingScreen
      title={groupId ? 'Edit Group' : 'Create Group'}
      subtitle="3–8 members, including yourself"
      onBack={busy ? undefined : leave}
      footer={
        <>
          <AppButton
            title="Save Group"
            loading={busy}
            disabled={!loaded}
            onPress={() => void save()}
          />
          <AppButton
            title="Cancel"
            variant="secondary"
            disabled={busy}
            onPress={leave}
          />
        </>
      }
    >
      <Notice text={error} error />

      {!loaded ? (
        <>
          <ActivityIndicator color={colors.primary} />
          {error ? (
            <AppButton
              title="Retry"
              variant="secondary"
              onPress={() => {
                setError('');
                setRetry((value) => value + 1);
              }}
            />
          ) : null}
        </>
      ) : (
        <>
          <AppInput
            label="Group name"
            value={name}
            onChangeText={setName}
            maxLength={80}
            editable={!busy}
          />

          <Text style={ui.heading}>Group Roster ({members.length}/8)</Text>

          {members.map((member, index) => {
            const isOwner =
              member.studentId.trim().toUpperCase() === ownerId;

            return (
              <View key={index} style={ui.card}>
                <Text style={ui.label}>
                  MEMBER {index + 1}{isOwner ? ' · YOU / LEAD' : ''}
                </Text>

                <AppInput
                  label="Name"
                  value={member.name}
                  editable={!busy && !isOwner}
                  maxLength={80}
                  onChangeText={(value) => changeMember(index, 'name', value)}
                />

                <AppInput
                  label="Student ID"
                  value={member.studentId}
                  editable={!busy && !isOwner}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={30}
                  onChangeText={(value) => changeMember(index, 'studentId', value)}
                />

                {!isOwner ? (
                  <AppButton
                    title="Remove Member"
                    variant="secondary"
                    disabled={busy}
                    onPress={() => {
                      setMembers(members.filter((_, position) => position !== index));
                    }}
                  />
                ) : null}
              </View>
            );
          })}

          <View style={ui.card}>
            <Text style={ui.heading}>Add Member</Text>

            <AppInput
              label="Full name"
              value={memberName}
              onChangeText={setMemberName}
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

            <AppButton
              title="Add Member"
              disabled={busy || members.length >= 8}
              onPress={addMember}
            />
          </View>
        </>
      )}
    </BookingScreen>
  );
}