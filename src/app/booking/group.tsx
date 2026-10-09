import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { colors } from '@/constants/theme';
import { useBookingDraft } from '@/features/booking/BookingDraft';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { errorMessage, timeLabel, useClock } from '@/features/booking/bookingDisplay';
import { useBookingDetails } from '@/features/booking/useBookingDetails';
import { cancelBookingHold } from '@/lib/cancelBookingHold';
import { auth, db } from '@/lib/firebase';
import type { GroupMember, SavedGroup, UserProfile } from '@/types/models';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, getDocFromServer, getDocsFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function GroupConfiguration() {
  const { bookingId = '', groupId = '' } = useLocalSearchParams<{ bookingId?: string; groupId?: string }>();
  const { booking, room, error: loadError, reload } = useBookingDetails(bookingId);
  const { draft, setDraft } = useBookingDraft();
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [owner, setOwner] = useState<GroupMember | null>(null);
  const [groupName, setGroupName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [chosen, setChosen] = useState('');
  const [memberName, setMemberName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [picker, setPicker] = useState(false);
  const [ready, setReady] = useState(false);
  const [dataError, setDataError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const now = useClock();
  // Keep initial draft stable while fetching saved groups. Review writes it once.
  const [initialDraft] = useState(() => draft?.bookingId === bookingId ? draft : null);
  useEffect(() => {
    let stopped = false;
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Sign in before configuring your group.');
      const [profileDoc, groupDocs] = await Promise.all([
        getDocFromServer(doc(db, 'users', uid)),
        getDocsFromServer(query(collection(db, 'groups'), where('ownerId', '==', uid))),
      ]);
      if (!profileDoc.exists()) throw new Error('Your student profile is missing. Ask the leader to add users/{your UID} or complete your profile in the login flow.');
      const profile = profileDoc.data() as UserProfile;
      if (!profile.name || !profile.studentId) throw new Error('Your profile needs a name and student ID.');
      const lead = { name: profile.name, studentId: profile.studentId.trim().toUpperCase() };
      const list = groupDocs.docs.map((item) => ({ ...item.data(), id: item.id }) as SavedGroup);
      const preset = list.find((group) => group.id === (groupId || profile.defaultGroupId));
      if (stopped) return;
      setOwner(lead); setGroups(list);
      if (initialDraft) { setGroupName(initialDraft.groupName); setPurpose(initialDraft.purpose); setMembers(initialDraft.members); }
      else if (preset) { setChosen(preset.id); setGroupName(preset.name); setMembers(preset.members); }
      else { setGroupName(''); setMembers([lead]); }
      if (groupId && !preset) setMessage('The selected saved group was not found. Enter a booking group below.');
      setReady(true);
    }
    void load().catch((failure: unknown) => { if (!stopped) setDataError(errorMessage(failure)); });
    return () => { stopped = true; };
  }, [groupId, initialDraft, retry]);
  const expired = !!booking && (booking.status !== 'held' || booking.holdExpiresAt.toMillis() <= now || booking.startAt.toMillis() <= now);
  const validSize = members.length >= Math.max(3, room?.minCapacity ?? 3) && members.length <= Math.min(8, room?.maxCapacity ?? 8);
  function chooseGroup(group: SavedGroup) {
    setChosen(group.id); setGroupName(group.name); setMembers(group.members); setPicker(false); setMessage('');
  }
  function newGroup() {
    setChosen(''); setGroupName(''); setMembers(owner ? [owner] : []); setPicker(false);
    setMessage('This group is for this reservation only. Manage reusable groups in the Groups tab.');
  }
  function addMember() {
    const id = studentId.trim().toUpperCase();
    const name = memberName.trim();
    if (!id || !name) { setMessage('Enter both the member name and student ID.'); return; }
    if (members.length >= 8) { setMessage('Maximum 8 members.'); return; }
    if (members.some((member) => member.studentId.trim().toUpperCase() === id)) { setMessage('That student ID is already in the roster.'); return; }
    setMembers([...members, { name, studentId: id }]); setMemberName(''); setStudentId(''); setMessage('');
  }
  function review() {
    if (!groupName.trim()) { setMessage('Enter a group name.'); return; }
    if (!validSize) { setMessage('Your group must have 3–8 members and fit this room.'); return; }
    if (members.some((member) => !member.name.trim() || !member.studentId.trim())) { setMessage('Each member needs a name and student ID.'); return; }
    const ids = members.map((member) => member.studentId.trim().toUpperCase());
    if (new Set(ids).size !== ids.length) { setMessage('Remove duplicate student IDs.'); return; }
    if (!owner || !ids.includes(owner.studentId)) { setMessage('Include yourself in the group roster.'); return; }
    setDraft({ bookingId, groupName: groupName.trim(), purpose: purpose.trim(), members });
    router.push({ pathname: '/booking/review', params: { bookingId } });
  }
  async function cancel() {
    setBusy(true); setMessage('');
    try { await cancelBookingHold(bookingId); setDraft(null); router.replace('/rooms'); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <BookingScreen title="Group Configuration" subtitle="Step 2 of 3" onBack={busy ? undefined : () => {
    if (booking?.status === 'held') void cancel(); else router.replace('/rooms');
  }} footer={<>

<AppButton
  title="Review Reservation"
  onPress={review}
  disabled={
    !ready ||
    !room ||
    expired ||
    !!loadError ||
    !!dataError ||
    !validSize
  }
  loading={busy}
/>    <AppButton title="Cancel & Release Slot" variant="secondary" disabled={!booking || booking.status !== 'held'} loading={busy} onPress={() => void cancel()} />
  </>}>
    {loadError || dataError ? <><Notice text={loadError || dataError} error /><AppButton title="Retry" variant="secondary" onPress={() => { reload(); setReady(false); setDataError(''); setRetry((value) => value + 1); }} /></> : !booking || !room || !ready ? <ActivityIndicator color={colors.primary} /> : <>
      <View style={ui.notice}><Text style={ui.heading}>{room.name}</Text><Text style={ui.body}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text></View>
      {expired ? <><Notice text="This hold is no longer available. Return to rooms and select a slot again." error /><AppButton title="Return to Rooms" onPress={() => router.replace('/rooms')} /></> : <>
        <View style={ui.row}><Text style={ui.heading}>Select Saved Group</Text><Pressable onPress={newGroup} accessibilityRole="button" style={ui.chip}><Text style={ui.link}>+ New Group</Text></Pressable></View>
        <Pressable accessibilityRole="button" onPress={() => setPicker(!picker)} style={ui.card}><Text style={ui.body}>{groups.find((group) => group.id === chosen)?.name || 'Choose a saved group'} ▾</Text></Pressable>
        {picker ? <View style={ui.card}>{groups.length ? groups.map((group) => <AppButton key={group.id} title={`${group.name} (${group.members.length} members)`} variant="secondary" onPress={() => chooseGroup(group)} />) : <Text style={ui.muted}>No saved groups yet. Enter your booking group below.</Text>}</View> : null}
        <AppInput label="Group name" value={groupName} onChangeText={setGroupName} editable={!busy} maxLength={80} />
        <View style={ui.card}>
          <View style={ui.row}><Text style={ui.heading}>Group Roster ({members.length}/8)</Text><Text style={{ color: validSize ? colors.success : colors.accent }}>{validSize ? 'VALID' : '3–8 required'}</Text></View>
          {members.map((member, index) => <View key={`${member.studentId}:${index}`} style={[ui.notice, ui.row]}><View style={ui.flex}><Text style={ui.body}>{index + 1}. {member.name}{member.studentId.trim().toUpperCase() === owner?.studentId ? ' (You · Lead)' : ''}</Text><Text style={ui.muted}>{member.studentId}</Text></View>{member.studentId.trim().toUpperCase() !== owner?.studentId ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${member.name}`} disabled={busy} onPress={() => setMembers(members.filter((_, position) => position !== index))} style={ui.back}><Text style={{ color: colors.danger }}>✕</Text></Pressable> : null}</View>)}
          <Text style={ui.muted}>Editing this roster does not change your saved group.</Text>
        </View>
        <AppInput label="Member name" value={memberName} onChangeText={setMemberName} editable={!busy} />
        <AppInput label="Student ID" value={studentId} onChangeText={setStudentId} autoCapitalize="characters" autoCorrect={false} editable={!busy} />
        <AppButton title="Add Member" variant="secondary"  onPress={addMember} disabled={busy || members.length >= 8} />
        <AppInput label="Study Purpose (Optional)" value={purpose} onChangeText={setPurpose} editable={!busy} maxLength={300} />
      </>}
    </>}
    <Notice text={message} error />
  </BookingScreen>;
}
