import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { signOut } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

function createdLabel(createdAt?: Timestamp) {
  try {
    if (!createdAt || typeof createdAt.toDate !== 'function') return 'Saved group';
    return createdAt.toDate().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return 'Saved group';
  }
}

function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function GroupListScreen() {
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false, title: 'Saved groups' }} />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View style={styles.groupsHeader}>
          <View style={styles.headerCopy}>
            <Text style={styles.groupsTitle}>Saved Study Groups</Text>
            <Text style={styles.groupsSubtitle}>Auto-populated presets (FR6)</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a new saved group"
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={() => router.push('/groups/edit')}
            style={({ pressed }) => [styles.newGroupButton, pressed && styles.pressed, loading && styles.disabled]}
          >
            <Text style={styles.newGroupText}>+ New Group</Text>
          </Pressable>
        </View>

        <View style={styles.bookingHint}>
          <Text style={styles.bookingHintText}>
            Saved groups enable rapid 1-tap booking in under 60 seconds (NFR1).
          </Text>
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
            <Text style={styles.emptyText}>
              Create a group with at least three members, including yourself, to book faster next time.
            </Text>
            <AppButton onPress={() => router.push('/groups/edit')} title="Create your first group" />
          </View>
        ) : null}
        {!loading && groups.map((group) => {
          const isDefault = defaultGroupId === group.id;
          const validSize = group.members.length >= 3 && group.members.length <= 8;
          return (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.cardTopRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${group.name}`}
                  onPress={() => router.push({ pathname: '/groups/details', params: { groupId: group.id } })}
                  style={styles.cardTitleArea}
                >
                  <View style={styles.titleBadgeRow}>
                    <Text numberOfLines={1} style={styles.groupName}>{group.name}</Text>
                    {isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.memberCount, !validSize && styles.invalidCount]}>
                    {group.members.length} Members · {validSize ? 'Enforces 3-8 rule' : 'Needs 3-8 members'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${group.name}`}
                  onPress={() => router.push({ pathname: '/groups/edit', params: { groupId: group.id } })}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                >
                  <Text style={styles.editIcon}>✎</Text>
                </Pressable>
              </View>

              <View style={styles.chipRow}>
                {group.members.slice(0, 4).map((member) => (
                  <View key={member.studentId} style={styles.memberChip}>
                    <Text numberOfLines={1} style={styles.memberChipText}>{member.name}</Text>
                  </View>
                ))}
                {group.members.length > 4 ? (
                  <Text style={styles.moreMembers}>+{group.members.length - 4}</Text>
                ) : null}
              </View>

              <View style={styles.cardDivider} />
              <View style={styles.cardBottomRow}>
                <Text style={styles.createdText}>Created: {createdLabel(group.createdAt)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Book a room with ${group.name}`}
                  onPress={() => router.push({ pathname: '/rooms', params: { groupId: group.id } })}
                  style={({ pressed }) => [styles.bookLink, pressed && styles.pressed]}
                >
                  <Text style={styles.bookLinkText}>Book Room with Group →</Text>
                </Pressable>
              </View>
              <Text style={[styles.presetStatus, isDefault && styles.presetActive]}>
                {isDefault ? 'Active Preset' : 'Ready to Book'}
              </Text>
            </View>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => void signOut(auth)}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function GroupEditScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const editing = Boolean(groupId);
  const [name, setName] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [ownerStudentId, setOwnerStudentId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadEditor() {
      try {
        const profile = await getCurrentProfile();
        if (!active) return;
        const normalizedOwnerId = profile.studentId.trim().toUpperCase();
        setOwnerStudentId(normalizedOwnerId);
        if (groupId) {
          const group = await getGroup(groupId);
          if (!active) return;
          setName(group.name);
          setMembers(group.members);
        } else {
          setMembers([{ name: profile.name, studentId: normalizedOwnerId }]);
        }
      } catch (failure: unknown) {
        if (active) setError(readableError(failure));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadEditor();
    return () => {
      active = false;
    };
  }, [groupId]);

  function addMember() {
    const memberName = newMemberName.trim();
    const memberId = newMemberId.trim().toUpperCase();
    setMemberError('');
    if (!memberName) {
      setMemberError('Enter the member name. There is no student directory lookup.');
      return;
    }
    if (!memberId) {
      setMemberError('Enter the student ID.');
      return;
    }
    if (members.length >= 8) {
      setMemberError('A group can contain no more than 8 members.');
      return;
    }
    if (members.some((member) => member.studentId.trim().toUpperCase() === memberId)) {
      setMemberError('That student ID is already in the roster.');
      return;
    }
    setMembers((current) => [...current, { name: memberName, studentId: memberId }]);
    setNewMemberName('');
    setNewMemberId('');
  }

  function removeMember(studentId: string) {
    setMembers((current) => current.filter((member) => member.studentId !== studentId));
    setMemberError('');
  }

  function validateForm() {
    const trimmedName = name.trim();
    const normalizedIds = members.map((member) => member.studentId.trim().toUpperCase());
    setNameError(trimmedName ? '' : 'Enter a group name.');
    if (members.length < 3 || members.length > 8) {
      setMemberError('Add between 3 and 8 members.');
      return false;
    }
    if (members.some((member) => !member.name.trim() || !member.studentId.trim())) {
      setMemberError('Every member needs a name and student ID.');
      return false;
    }
    if (new Set(normalizedIds).size !== normalizedIds.length) {
      setMemberError('Student IDs must be unique.');
      return false;
    }
    if (!ownerStudentId || !normalizedIds.includes(ownerStudentId)) {
      setMemberError('Your student ID must remain in the roster.');
      return false;
    }
    return Boolean(trimmedName);
  }

  async function save() {
    if (!validateForm()) return;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <Stack.Screen options={{ headerShown: false, title: editing ? 'Edit group' : 'Create group' }} />
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const validSize = members.length >= 3 && members.length <= 8;
  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false, title: editing ? 'Edit group' : 'Create group' }} />
      <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
        <View style={styles.editorHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={busy} onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.editorHeaderCopy}>
            <Text style={styles.editorTitle}>Configure Group</Text>
            <Text style={styles.editorSubtitle}>Edit Group Details & Members</Text>
          </View>
        </View>

        <AppInput
          error={nameError}
          label="Group Title"
          onChangeText={(value) => {
            setName(value);
            setNameError('');
          }}
          placeholder="HCI Project Squad"
          value={name}
        />

        <View style={styles.capacityCard}>
          <View style={styles.capacityHeading}>
            <Text style={styles.capacityTitle}>Group Capacity: {members.length} Members</Text>
            <Text style={[styles.validBadge, validSize ? styles.validBadgeOn : styles.validBadgeOff]}>
              {validSize ? 'VALID (3-8)' : 'NEEDS 3-8'}
            </Text>
          </View>
          <View style={styles.capacityTrack}>
            <View style={[styles.capacityFill, { width: `${Math.min(100, (members.length / 8) * 100)}%` }]} />
          </View>
          <View style={styles.capacityLabels}>
            <Text style={styles.capacityLabel}>Min: 3</Text>
            <Text style={styles.capacityLabel}>Current: {members.length}</Text>
            <Text style={styles.capacityLabel}>Max: 8</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <Text style={styles.sectionLabel}>Add Member by Student ID</Text>
          <AppInput
            autoCapitalize="words"
            label="Name"
            onChangeText={setNewMemberName}
            placeholder="Member name"
            value={newMemberName}
          />
          <View style={styles.addRow}>
            <View style={styles.addInputs}>
              <AppInput
                autoCapitalize="characters"
                label="Student ID"
                onChangeText={setNewMemberId}
                placeholder="e.g. IT21000000"
                value={newMemberId}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add member to roster"
              accessibilityState={{ disabled: busy || members.length >= 8 }}
              disabled={busy || members.length >= 8}
              onPress={addMember}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed, (busy || members.length >= 8) && styles.disabled]}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            Names are entered here. Student IDs are not looked up from a campus directory.
          </Text>
          {memberError ? <Text style={styles.inlineError}>{memberError}</Text> : null}
        </View>

        <View style={styles.rosterSection}>
          <Text style={styles.sectionLabel}>Current Roster ({members.length})</Text>
          <View style={styles.rosterCard}>
            {members.map((member) => {
              const isOwner = member.studentId.trim().toUpperCase() === ownerStudentId;
              return (
                <View key={member.studentId} style={styles.editorMemberRow}>
                  <View style={styles.editorMemberCopy}>
                    <Text style={styles.editorMemberName}>
                      {member.name} {isOwner ? '(Lead)' : ''}
                    </Text>
                    <Text style={styles.editorMemberId}>{member.studentId.trim().toUpperCase()}</Text>
                  </View>
                  {!isOwner ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${member.name}`}
                      disabled={busy}
                      onPress={() => removeMember(member.studentId)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeIcon}>×</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.ownerLabel}>Owner</Text>
                  )}
                </View>
              );
            })}
            {!members.length ? <Text style={styles.emptyRoster}>Your profile member will appear here.</Text> : null}
          </View>
        </View>

        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <AppButton loading={busy} onPress={() => void save()} title="Save Group Configuration" />
        <AppButton disabled={busy} onPress={() => router.back()} title="Cancel" variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

export function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [group, setGroup] = useState<SavedGroup | null>(null);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCurrentProfile>> | null>(null);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!groupId) return () => { active = false; };
    const requestedGroupId = groupId;
    async function loadDetails() {
      try {
        const [loadedGroup, loadedProfile] = await Promise.all([
          getGroup(requestedGroupId),
          getCurrentProfile(),
        ]);
        if (!active) return;
        setGroup(loadedGroup);
        setProfile(loadedProfile);
      } catch (failure: unknown) {
        if (active) setError(readableError(failure));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDetails();
    return () => {
      active = false;
    };
  }, [groupId]);

  async function makeDefault() {
    if (!group) return;
    setBusy(true);
    setError('');
    try {
      await setDefaultGroup(group.id);
      setProfile((current) => (current ? { ...current, defaultGroupId: group.id } : current));
    } catch (failure: unknown) {
      setError(readableError(failure));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!group) return;
    Alert.alert(
      'Delete Group?',
      'Deleting this saved group will not delete existing bookings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Group',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            setError('');
            void deleteGroup(group.id)
              .then(() => router.replace('/groups'))
              .catch((failure: unknown) => setError(readableError(failure)))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  }

  if (!groupId) {
    return (
      <SafeAreaView style={styles.detailsState}>
        <Stack.Screen options={{ headerShown: false, title: 'Group details' }} />
        <Text style={styles.error}>A group ID is required to open this screen.</Text>
        <AppButton onPress={() => router.replace('/groups')} title="Return to groups" />
      </SafeAreaView>
    );
  }
  if (loading) {
    return (
      <SafeAreaView style={styles.detailsState}>
        <Stack.Screen options={{ headerShown: false, title: 'Group details' }} />
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>Loading group details...</Text>
      </SafeAreaView>
    );
  }
  if (!group) {
    return (
      <SafeAreaView style={styles.detailsState}>
        <Stack.Screen options={{ headerShown: false, title: 'Group details' }} />
        <Text style={styles.error}>{error || 'This group could not be found or accessed.'}</Text>
        <AppButton onPress={() => router.replace('/groups')} title="Return to groups" />
      </SafeAreaView>
    );
  }

  const isDefault = profile?.defaultGroupId === group.id;
  const memberCount = group.members.length;
  const validSize = memberCount >= 3 && memberCount <= 8;
  const ownerStudentId = profile?.studentId.trim().toUpperCase();

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false, title: 'Group details' }} />
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View style={styles.detailsHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" disabled={busy} onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.detailsHeaderCopy}>
            <Text style={styles.detailsEyebrow}>GROUP MANAGEMENT</Text>
            <Text style={styles.detailsTitle}>Group Details</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit group"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => router.push({ pathname: '/groups/edit', params: { groupId: group.id } })}
            style={styles.detailsEditButton}
          >
            <Text style={styles.detailsEditText}>✎ Edit</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>{group.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.summaryCopy}>
              <View style={styles.titleBadgeRow}>
                <Text numberOfLines={1} style={styles.summaryName}>{group.name}</Text>
                {isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default Group</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.summarySubtitle}>Saved study group</Text>
            </View>
          </View>
          <View style={styles.summaryMetrics}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>MEMBERS</Text>
              <Text style={styles.metricValue}>{memberCount} Active</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CAPACITY</Text>
              <Text style={[styles.metricValue, validSize ? styles.greenText : styles.redText]}>
                {validSize ? 'Rule 3-8 OK' : 'Invalid size'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CREATED</Text>
              <Text style={styles.metricValue}>{createdLabel(group.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsSectionHeading}>
          <View>
            <Text style={styles.detailsSectionTitle}>GROUP ROSTER</Text>
            <Text style={styles.detailsSectionMeta}>{memberCount} students registered</Text>
          </View>
          <Text style={[styles.thresholdBadge, !validSize && styles.validBadgeOff]}>
            {validSize ? 'Meets 3-8 Threshold' : 'Needs 3-8 Members'}
          </Text>
        </View>
        <View style={styles.detailsRosterCard}>
          {group.members.map((member, index) => {
            const memberId = member.studentId.trim().toUpperCase();
            const isOwner = memberId === ownerStudentId;
            return (
              <View key={member.studentId} style={[styles.detailsMemberRow, index === group.members.length - 1 && styles.lastMemberRow]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{memberInitials(member.name)}</Text>
                </View>
                <View style={styles.detailsMemberCopy}>
                  <Text style={styles.detailsMemberName}>
                    {member.name} {isOwner ? <Text style={styles.ownerBadge}>Owner</Text> : null}
                  </Text>
                  <Text style={styles.detailsMemberId}>{memberId}</Text>
                </View>
                <Text style={styles.rosterStatus}>Entered</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>GROUP SETTINGS & ELIGIBILITY</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Group Size</Text>
            <Text style={styles.settingValue}>{memberCount} Members</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allowed Booking Range</Text>
            <Text style={styles.settingValue}>
              3-8 Members {validSize ? <Text style={styles.eligibleBadge}>Eligible</Text> : <Text style={styles.ineligibleBadge}>Not eligible</Text>}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isDefault ? 'This is the default booking group' : 'Set as default booking group'}
            accessibilityState={{ disabled: busy || isDefault }}
            disabled={busy || isDefault}
            onPress={() => void makeDefault()}
            style={styles.settingRow}
          >
            <Text style={styles.settingLabel}>Default Booking Group</Text>
            <Text style={[styles.settingValue, isDefault && styles.greenText]}>
              {isDefault ? '● Enabled' : '○ Set as default'}
            </Text>
          </Pressable>
        </View>

        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <View style={styles.detailsActions}>
          <AppButton
            disabled={busy}
            onPress={() => router.push({ pathname: '/rooms', params: { groupId: group.id } })}
            title="Book a Room with This Group"
          />
          <AppButton disabled={busy} onPress={confirmDelete} title="Delete Group" variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.background, flex: 1 },
  pageContent: { flexGrow: 1, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center' },
  groupsHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: { flex: 1, gap: spacing.xs },
  groupsTitle: { color: colors.primary, fontSize: 22, fontWeight: fontWeight.bold },
  groupsSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  newGroupButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  newGroupText: { color: colors.white, fontSize: 12, fontWeight: fontWeight.bold },
  bookingHint: {
    backgroundColor: '#F7FAFF',
    borderColor: '#DCE8F8',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bookingHintText: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { color: colors.muted, fontSize: fontSize.caption },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: fontWeight.semibold },
  emptyText: { color: colors.muted, fontSize: fontSize.bodySmall, lineHeight: 19, textAlign: 'center' },
  groupCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  cardTopRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  cardTitleArea: { flex: 1, gap: spacing.xs },
  titleBadgeRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groupName: { color: colors.text, flexShrink: 1, fontSize: 16, fontWeight: fontWeight.bold },
  memberCount: { color: colors.success, fontSize: 12, fontWeight: fontWeight.semibold },
  invalidCount: { color: colors.danger },
  editButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  editIcon: { color: colors.muted, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  memberChip: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    maxWidth: '48%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  memberChipText: { color: colors.muted, fontSize: 11 },
  moreMembers: { color: colors.muted, fontSize: 11, paddingVertical: spacing.xs },
  cardDivider: { backgroundColor: colors.border, height: 1, width: '100%' },
  cardBottomRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  createdText: { color: colors.muted, flex: 1, fontSize: 11 },
  bookLink: { justifyContent: 'center', minHeight: 32, paddingHorizontal: spacing.xs },
  bookLinkText: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  presetStatus: { color: colors.muted, fontSize: 12, fontWeight: fontWeight.semibold },
  presetActive: { color: colors.success },
  signOutButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  signOutText: { color: colors.muted, fontSize: 12, fontWeight: fontWeight.semibold },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, fontSize: fontSize.bodySmall, lineHeight: 20, textAlign: 'center' },
  editorHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 34 },
  backIcon: { color: colors.primary, fontSize: 32, fontWeight: '300', lineHeight: 34 },
  editorHeaderCopy: { flex: 1, gap: 2 },
  editorTitle: { color: colors.primary, fontSize: 20, fontWeight: fontWeight.bold },
  editorSubtitle: { color: colors.muted, fontSize: 12 },
  capacityCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  capacityHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  capacityTitle: { color: colors.text, flex: 1, fontSize: 13, fontWeight: fontWeight.bold },
  validBadge: { borderRadius: radius.sm, fontSize: 10, fontWeight: fontWeight.bold, overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  validBadgeOn: { backgroundColor: '#DDF4E9', color: colors.success },
  validBadgeOff: { backgroundColor: '#FCE9E7', color: colors.danger },
  capacityTrack: { backgroundColor: colors.border, borderRadius: 4, height: 7, overflow: 'hidden' },
  capacityFill: { backgroundColor: colors.success, borderRadius: 4, height: 7 },
  capacityLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  capacityLabel: { color: colors.muted, fontSize: 11 },
  addSection: { gap: spacing.sm },
  sectionLabel: { color: colors.text, fontSize: 13, fontWeight: fontWeight.bold },
  addRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  addInputs: { flex: 1 },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: fontWeight.bold },
  helperText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  inlineError: { color: colors.danger, fontSize: 12, lineHeight: 16 },
  rosterSection: { gap: spacing.sm },
  rosterCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  editorMemberRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  editorMemberCopy: { flex: 1, gap: 2 },
  editorMemberName: { color: colors.text, fontSize: 13, fontWeight: fontWeight.semibold },
  editorMemberId: { color: colors.muted, fontSize: 11 },
  ownerLabel: { color: colors.success, fontSize: 11, fontWeight: fontWeight.bold },
  removeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  removeIcon: { color: colors.muted, fontSize: 22, fontWeight: '300' },
  emptyRoster: { color: colors.muted, fontSize: 12, padding: spacing.lg, textAlign: 'center' },
  detailsState: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  detailsHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  detailsHeaderCopy: { flex: 1, gap: 2 },
  detailsEyebrow: { color: colors.muted, fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.6 },
  detailsTitle: { color: colors.primary, fontSize: 20, fontWeight: fontWeight.bold },
  detailsEditButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  detailsEditText: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderTopColor: colors.primary,
    borderTopWidth: 3,
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryTopRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  groupAvatar: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  groupAvatarText: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  summaryCopy: { flex: 1, gap: spacing.xs },
  summaryName: { color: colors.text, flexShrink: 1, fontSize: 16, fontWeight: fontWeight.bold },
  summarySubtitle: { color: colors.muted, fontSize: 12 },
  defaultBadge: {
    backgroundColor: '#DDF4E9',
    borderRadius: 4,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  defaultBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  summaryMetrics: { flexDirection: 'row', gap: spacing.sm },
  metricBox: { backgroundColor: colors.background, borderRadius: radius.sm, flex: 1, gap: spacing.xs, minHeight: 52, padding: spacing.sm },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: fontWeight.bold },
  metricValue: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  greenText: { color: colors.success },
  redText: { color: colors.danger },
  detailsSectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  detailsSectionTitle: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold },
  detailsSectionMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  thresholdBadge: {
    backgroundColor: '#E4F8EF',
    borderRadius: 4,
    color: colors.success,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    maxWidth: 140,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  detailsRosterCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailsMemberRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  lastMemberRow: { borderBottomWidth: 0 },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  memberAvatarText: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  detailsMemberCopy: { flex: 1, gap: 2 },
  detailsMemberName: { color: colors.text, fontSize: 13, fontWeight: fontWeight.bold },
  detailsMemberId: { color: colors.muted, fontSize: 11 },
  ownerBadge: { color: colors.primary, fontSize: 11, fontWeight: fontWeight.bold },
  rosterStatus: { color: colors.muted, fontSize: 11 },
  settingsCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  settingsTitle: { color: colors.primary, fontSize: 12, fontWeight: fontWeight.bold, paddingBottom: spacing.sm, paddingTop: spacing.md },
  settingRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  settingLabel: { color: colors.muted, flex: 1, fontSize: 12 },
  settingValue: { color: colors.text, fontSize: 12, fontWeight: fontWeight.bold, textAlign: 'right' },
  eligibleBadge: { color: colors.success, fontSize: 11, fontWeight: fontWeight.bold },
  ineligibleBadge: { color: colors.danger, fontSize: 11, fontWeight: fontWeight.bold },
  detailsActions: { gap: spacing.md, paddingTop: spacing.xs },
});
