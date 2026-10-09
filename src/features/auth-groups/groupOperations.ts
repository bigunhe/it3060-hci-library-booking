import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { GroupMember, SavedGroup, UserProfile } from '@/types/models';

export type ProfileInput = {
  name: string;
  studentId: string;
};

type StoredProfile = Omit<UserProfile, 'id'>;

type StoredGroup = Omit<SavedGroup, 'id' | 'createdAt'> & {
  createdAt: Timestamp;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to continue.');
  return user;
}

function normalizeProfile(input: ProfileInput) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const studentId = typeof input?.studentId === 'string'
    ? input.studentId.trim().toUpperCase()
    : '';
  if (!name) throw new Error('Enter your name.');
  if (!studentId) throw new Error('Enter your student ID.');
  return { name, studentId };
}

function normalizeMembers(members: GroupMember[]) {
  if (!Array.isArray(members) || members.length < 3 || members.length > 8) {
    throw new Error('A saved group must contain 3 to 8 members.');
  }

  const normalized = members.map((member) => {
    const name = isNonEmptyString(member?.name) ? member.name.trim() : '';
    const studentId = isNonEmptyString(member?.studentId)
      ? member.studentId.trim().toUpperCase()
      : '';
    if (!name || !studentId) {
      throw new Error('Every member needs a name and student ID.');
    }
    return { name, studentId };
  });

  if (new Set(normalized.map((member) => member.studentId)).size !== normalized.length) {
    throw new Error('Student IDs must be unique.');
  }
  return normalized;
}

async function readCurrentProfile(): Promise<StoredProfile & { id: string }> {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  if (!snapshot.exists()) throw new Error('Complete your profile before managing groups.');
  const data = snapshot.data();
  if (
    !isNonEmptyString(data.name)
    || !isNonEmptyString(data.studentId)
    || (data.role !== 'student' && data.role !== 'staff')
    || (data.defaultGroupId !== null && !isNonEmptyString(data.defaultGroupId))
  ) {
    throw new Error('Your profile is incomplete. Please complete it before managing groups.');
  }
  return {
    id: snapshot.id,
    name: data.name.trim(),
    studentId: data.studentId.trim(),
    role: data.role,
    defaultGroupId: data.defaultGroupId,
  };
}

function normalizeGroupId(groupId: string) {
  if (!isNonEmptyString(groupId)) throw new Error('A group ID is required.');
  return groupId.trim();
}

export async function createStudentProfile(input: ProfileInput): Promise<void> {
  const user = requireUser();
  const profile = normalizeProfile(input);
  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    role: 'student',
    defaultGroupId: null,
  });
}

export async function completeStudentProfile(input: ProfileInput): Promise<void> {
  const user = requireUser();
  const profile = normalizeProfile(input);
  const profileRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(profileRef);
  if (!snapshot.exists()) {
    await setDoc(profileRef, {
      ...profile,
      role: 'student',
      defaultGroupId: null,
    });
    return;
  }

  await updateDoc(profileRef, profile);
}

export async function getCurrentProfile() {
  return readCurrentProfile();
}

export async function listGroups(): Promise<SavedGroup[]> {
  const user = requireUser();
  const groupsQuery = query(
    collection(db, 'groups'),
    where('ownerId', '==', user.uid),
  );
  const snapshot = await getDocs(groupsQuery);
  return snapshot.docs.map((group) => ({
    id: group.id,
    ...(group.data() as StoredGroup),
  }));
}

export async function getGroup(groupId: string): Promise<SavedGroup> {
  const user = requireUser();
  const normalizedGroupId = normalizeGroupId(groupId);
  const snapshot = await getDoc(doc(db, 'groups', normalizedGroupId));
  if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) {
    throw new Error('This group is not available.');
  }
  const data = snapshot.data();
  if (
    !isNonEmptyString(data.name)
    || !Array.isArray(data.members)
    || data.members.length < 3
    || data.members.length > 8
    || !data.createdAt
  ) {
    throw new Error('This saved group has invalid data.');
  }
  return { id: snapshot.id, ...(data as StoredGroup) };
}

function validateOwnerRoster(profile: StoredProfile & { id: string }, members: GroupMember[]) {
  const normalizedMembers = normalizeMembers(members);
  if (!normalizedMembers.some((member) => member.studentId === profile.studentId.trim().toUpperCase())) {
    throw new Error('Your student ID must be included in the roster.');
  }
  return normalizedMembers;
}

export async function createGroup(name: string, members: GroupMember[]): Promise<string> {
  const user = requireUser();
  const profile = await readCurrentProfile();
  const groupName = name.trim();
  if (!groupName) throw new Error('Enter a group name.');
  const normalizedMembers = validateOwnerRoster(profile, members);
  const reference = await addDoc(collection(db, 'groups'), {
    ownerId: user.uid,
    name: groupName,
    members: normalizedMembers,
    createdAt: serverTimestamp(),
  });
  return reference.id;
}

export async function updateGroup(groupId: string, name: string, members: GroupMember[]): Promise<void> {
  const normalizedGroupId = normalizeGroupId(groupId);
  const profile = await readCurrentProfile();
  const group = await getGroup(normalizedGroupId);
  const groupName = isNonEmptyString(name) ? name.trim() : '';
  if (!groupName) throw new Error('Enter a group name.');
  const normalizedMembers = validateOwnerRoster(profile, members);
  await updateDoc(doc(db, 'groups', group.id), {
    name: groupName,
    members: normalizedMembers,
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const user = requireUser();
  const normalizedGroupId = normalizeGroupId(groupId);
  const groupRef = doc(db, 'groups', normalizedGroupId);
  const profileRef = doc(db, 'users', user.uid);
  await runTransaction(db, async (transaction) => {
    const [groupSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(groupRef),
      transaction.get(profileRef),
    ]);
    if (!groupSnapshot.exists() || groupSnapshot.data().ownerId !== user.uid) {
      throw new Error('This group is not available.');
    }
    if (!profileSnapshot.exists()) throw new Error('Complete your profile first.');
    if (profileSnapshot.data().defaultGroupId === normalizedGroupId) {
      transaction.update(profileRef, { defaultGroupId: null });
    }
    transaction.delete(groupRef);
  });
}

export async function setDefaultGroup(groupId: string): Promise<void> {
  const user = requireUser();
  const normalizedGroupId = normalizeGroupId(groupId);
  const groupRef = doc(db, 'groups', normalizedGroupId);
  const profileRef = doc(db, 'users', user.uid);
  await runTransaction(db, async (transaction) => {
    const [groupSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(groupRef),
      transaction.get(profileRef),
    ]);
    if (!groupSnapshot.exists() || groupSnapshot.data().ownerId !== user.uid) {
      throw new Error('You can only select one of your own groups.');
    }
    if (!profileSnapshot.exists()) throw new Error('Complete your profile first.');
    transaction.update(profileRef, { defaultGroupId: normalizedGroupId });
  });
}

export function readableError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/invalid-credential') return 'The email or password is incorrect.';
  if (code === 'auth/email-already-in-use') return 'That email is already registered.';
  if (code === 'auth/weak-password') return 'Use a stronger password.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
