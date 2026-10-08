import { router, useLocalSearchParams } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { AppInput } from '@/constants/ui/AppInput';
import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import type { GroupMember, SavedGroup } from '@/types/models';
import {
  createGroup,
  deleteGroup,
  getCurrentProfile,
  getGroup,
  listGroups,
  readableError,
  setDefaultGroup,
  updateGroup,
} from './groupOperations';

const emptyMember = (): GroupMember => ({ name: '', studentId: '' });

export function GroupListScreen() {
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [savedGroups, profile] = await Promise.all([listGroups(), getCurrentProfile()]);
      setGroups(savedGroups);
      setDefaultGroupId(profile.defaultGroupId);
    } catch (failure: unknown) {
      setError(readableError(failure));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  async function chooseDefault(groupId: string) {
    setBusy(true);
    setError('');
    try {
      await setDefaultGroup(groupId);
      setDefaultGroupId(groupId);
    } catch (failure: unknown) {
      setError(readableError(failure));
    } finally {
      setBusy(false);
    }
  }

  async function remove(group: SavedGroup) {
    Alert.alert('Delete saved group?', `${group.name} will be removed. Existing bookings are unchanged.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void deleteGroup(group.id)
            .then(() => {
              setGroups((current) => current.filter((item) => item.id !== group.id));
              if (defaultGroupId === group.id) setDefaultGroupId(null);
            })
            .catch((failure: unknown) => setError(readableError(failure)))
            .finally(() => setBusy(false));
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.groupsPage}>
      <View style={styles.groupsHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.groupsTitle}>Saved Study Groups</Text>
          <Text style={styles.groupsSubtitle}>Auto-populated presets for faster room booking.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a new saved group"
          accessibilityState={{ disabled: busy || loading }}
          disabled={busy || loading}
          onPress={() => router.push('/groups/edit')}
          style={({ pressed }) => [styles.newGroupButton, pressed && styles.pressed, (busy || loading) && styles.disabled]}
        >
          <Text style={styles.newGroupText}>+ New Group</Text>
        </Pressable>
      </View>

      <View style={styles.bookingHint}>
        <Text style={styles.bookingHintText}>Saved groups enable rapid 1-tap booking in under 60 seconds.</Text>
      </View>

      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View accessibilityLiveRegion="polite" style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Loading saved groups...</Text>
        </View>
      ) : null}
      {!loading && groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No saved groups yet</Text>
          <Text style={styles.emptyText}>Create a group with at least three members, including yourself, to book faster next time.</Text>
          <AppButton disabled={busy} onPress={() => router.push('/groups/edit')} title="Create your first group" />
        </View>
      ) : null}
      {!loading && groups.map((group) => {
        const isDefault = defaultGroupId === group.id;
        return (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.cardTopRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View details for ${group.name}`}
                disabled={busy}
                onPress={() => router.push({ pathname: '/groups/details', params: { groupId: group.id } })}
                style={styles.cardTitleArea}
              >
                <Text numberOfLines={1} style={styles.groupName}>{group.name}</Text>
                <Text style={styles.memberCount}>{group.members.length} Members · {isDefault ? 'Default group' : 'Minimum size'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${group.name}`}
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => router.push({ pathname: '/groups/edit', params: { groupId: group.id } })}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <Text style={styles.editIcon}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {group.members.slice(0, 4).map((member) => (
                <View key={member.studentId} style={styles.memberChip}>
                  <Text numberOfLines={1} style={styles.memberChipText}>{member.name}</Text>
                </View>
              ))}
              {group.members.length > 4 ? <Text style={styles.moreMembers}>+{group.members.length - 4}</Text> : null}
            </View>

            <View style={styles.cardDivider} />
            <View style={styles.cardBottomRow}>
              <Text style={styles.createdText}>Saved group</Text>
              <View style={styles.statusArea}>
                <Text style={[styles.statusBadge, isDefault ? styles.defaultBadge : styles.readyBadge]}>
                  {isDefault ? 'DEFAULT' : 'READY TO BOOK'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Book a room with ${group.name}`}
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={() => router.push({ pathname: '/rooms', params: { groupId: group.id } })}
                  style={({ pressed }) => [styles.bookLink, pressed && styles.pressed]}
                >
                  <Text style={styles.bookLinkText}>Book Room with Group →</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDefault ? `${group.name} is the default group` : `Set ${group.name} as default`}
              accessibilityState={{ busy, disabled: busy || isDefault }}
              disabled={busy || isDefault}
              onPress={() => void chooseDefault(group.id)}
              style={styles.defaultAction}
            >
              <Text style={[styles.defaultActionText, isDefault && styles.defaultActionSelected]}>
                {isDefault ? 'Active preset' : 'Set as default preset'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${group.name}`}
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              onPress={() => void remove(group)}
              style={styles.deleteAction}
            >
              <Text style={styles.deleteText}>Delete saved group</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out" disabled={busy} onPress={() => void signOut(auth)} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

export function GroupEditScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const editing = Boolean(groupId);
  const [name, setName] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([emptyMember(), emptyMember(), emptyMember()]);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) return;
    void getGroup(groupId)
      .then((group) => {
        setName(group.name);
        setMembers(group.members);
      })
      .catch((failure: unknown) => setError(readableError(failure)))
      .finally(() => setLoading(false));
  }, [groupId]);

  function changeMember(index: number, key: keyof GroupMember, value: string) {
    setMembers((current) => current.map((member, memberIndex) => (
      memberIndex === index ? { ...member, [key]: value } : member
    )));
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      if (editing && groupId) await updateGroup(groupId, name, members);
      else await createGroup(name, members);
      router.replace('/groups');
    } catch (failure: unknown) {
      setError(readableError(failure));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>GROUP EDITOR</Text>
      <Text style={styles.title}>{editing ? 'Edit saved group' : 'New saved group'}</Text>
      <Text style={styles.subtitle}>Use each person’s official student ID. Your own ID must be included.</Text>
      <AppInput label="Group name" onChangeText={setName} placeholder="Wednesday study team" value={name} />
      {members.map((member, index) => (
        <View key={index} style={styles.memberBlock}>
          <Text style={styles.memberLabel}>Member {index + 1}</Text>
          <AppInput label="Name" onChangeText={(value) => changeMember(index, 'name', value)} value={member.name} />
          <AppInput
            autoCapitalize="characters"
            label="Student ID"
            onChangeText={(value) => changeMember(index, 'studentId', value)}
            value={member.studentId}
          />
          {members.length > 3 ? (
            <Pressable onPress={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}>
              <Text style={styles.remove}>Remove member</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {members.length < 8 ? <AppButton onPress={() => setMembers((current) => [...current, emptyMember()])} title="Add member" variant="secondary" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton loading={busy} onPress={() => void save()} title={editing ? 'Save changes' : 'Create group'} />
      <AppButton disabled={busy} onPress={() => router.back()} title="Cancel" variant="secondary" />
    </ScrollView>
  );
}

export function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [group, setGroup] = useState<SavedGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      void getGroup(groupId).then(setGroup).catch((failure: unknown) => setError(readableError(failure)));
    }
  }, [groupId]);

  function book() {
    if (!group) return;
    router.push({ pathname: '/rooms', params: { groupId: group.id } });
  }

  async function makeDefault() {
    if (!group) return;
    setBusy(true);
    setError('');
    try {
      await setDefaultGroup(group.id);
    } catch (failure: unknown) {
      setError(readableError(failure));
    } finally {
      setBusy(false);
    }
  }

  if (!group) return <View style={styles.center}><Text style={styles.error}>{error || 'A group ID is required.'}</Text></View>;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>GROUP DETAILS</Text>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.subtitle}>Editing this group never changes an existing booking roster.</Text>
      <View style={styles.roster}>
        {group.members.map((member) => (
          <View key={member.studentId} style={styles.rosterRow}>
            <Text style={styles.rosterName}>{member.name}</Text>
            <Text style={styles.rosterId}>{member.studentId}</Text>
          </View>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton onPress={() => void book()} title="Book with this group" />
      <AppButton loading={busy} onPress={() => void makeDefault()} title="Set as default" variant="secondary" />
      <AppButton onPress={() => router.push({ pathname: '/groups/edit', params: { groupId: group.id } })} title="Edit group" variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  groupsPage: {
    backgroundColor: '#EEF3F9',
    flexGrow: 1,
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  groupsHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  groupsTitle: { color: '#0B2545', flex: 1, fontSize: 20, fontWeight: '700' },
  groupsSubtitle: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 3 },
  newGroupButton: {
    alignItems: 'center',
    backgroundColor: '#0B2545',
    borderRadius: 7,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
  },
  newGroupText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  bookingHint: {
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE8F8',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bookingHintText: { color: '#64748B', fontSize: 11, lineHeight: 16 },
  stateBox: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  stateText: { color: '#64748B', fontSize: 12 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E1EE',
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 22,
  },
  emptyText: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1DCEB',
    borderRadius: 11,
    borderWidth: 1,
    gap: 11,
    padding: 12,
  },
  cardTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  cardTitleArea: { flex: 1, gap: 3 },
  groupName: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  memberCount: { color: '#15805D', fontSize: 11, fontWeight: '600' },
  editButton: { minHeight: 32, minWidth: 38, paddingHorizontal: 5, paddingVertical: 7 },
  editIcon: { color: '#7A8CA4', fontSize: 11, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  memberChip: { backgroundColor: '#F0F4F9', borderRadius: 4, maxWidth: '48%', paddingHorizontal: 7, paddingVertical: 5 },
  memberChipText: { color: '#475569', fontSize: 10 },
  moreMembers: { color: '#64748B', fontSize: 10, paddingVertical: 5 },
  cardDivider: { backgroundColor: '#E8EEF5', height: 1, width: '100%' },
  cardBottomRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  createdText: { color: '#94A3B8', flex: 1, fontSize: 10 },
  statusArea: { alignItems: 'flex-end', gap: 5 },
  statusBadge: { borderRadius: 4, fontSize: 9, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3 },
  defaultBadge: { backgroundColor: '#E4F4EC', color: '#147A57' },
  readyBadge: { backgroundColor: '#EFF3F8', color: '#64748B' },
  bookLink: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 2 },
  bookLinkText: { color: '#0B2545', fontSize: 10, fontWeight: '700' },
  defaultAction: { minHeight: 28, justifyContent: 'center' },
  defaultActionText: { color: '#64748B', fontSize: 10 },
  defaultActionSelected: { color: '#15805D', fontWeight: '700' },
  deleteAction: { minHeight: 28, justifyContent: 'center' },
  deleteText: { color: '#B42318', fontSize: 10 },
  signOutButton: { alignItems: 'center', minHeight: 40, justifyContent: 'center' },
  signOutText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  page: { flexGrow: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.sm },
  eyebrow: { color: colors.accent, fontSize: fontSize.caption, fontWeight: fontWeight.bold, letterSpacing: 1.5 },
  title: { color: colors.primary, fontSize: 30, fontWeight: fontWeight.bold },
  subtitle: { color: colors.muted, fontSize: fontSize.bodySmall, lineHeight: 20 },
  link: { color: colors.primary, fontWeight: fontWeight.semibold, paddingTop: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.bodySmall, lineHeight: 20 },
  empty: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: fontWeight.semibold },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  badge: { color: colors.success, fontSize: fontSize.caption, fontWeight: fontWeight.bold },
  memberPreview: { color: colors.muted, fontSize: fontSize.bodySmall, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  memberBlock: { borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.lg, gap: spacing.md },
  memberLabel: { color: colors.primary, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  remove: { color: colors.danger, fontSize: fontSize.bodySmall, fontWeight: fontWeight.semibold },
  roster: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.lg },
  rosterRow: { borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, gap: spacing.xs },
  rosterName: { color: colors.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  rosterId: { color: colors.muted, fontSize: fontSize.bodySmall },
});
