import type { Timestamp } from 'firebase/firestore';

export interface GroupMember {
  studentId: string;
  name: string;
}

export interface UserProfile {
  id: string; // Firebase Authentication UID
  name: string;
  studentId: string;
  role: 'student' | 'staff';
}

export interface Room {
  id: string;
  name: string;
  level: number;
  location: string;
  minCapacity: number;
  maxCapacity: number;
  equipment: string[];
  enabled: boolean;
}

export interface SavedGroup {
  id: string;
  ownerId: string;
  name: string;
  members: GroupMember[];
  isDefault: boolean;
  createdAt: Timestamp;
}

export type BookingStatus =
  | 'held'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired';

export interface Booking {
  id: string;
  ownerId: string;
  roomId: string;

  groupName: string;
  members: GroupMember[];
  purpose: string;

  startAt: Timestamp;
  endAt: Timestamp;
  originalEndAt: Timestamp;

  status: BookingStatus;
  holdExpiresAt: Timestamp;
  checkInDeadline: Timestamp;

  checkedInAt: Timestamp | null;
  checkedInBy: string | null;
  checkedOutAt: Timestamp | null;
  extensionMinutes: 0 | 15 | 30;

  createdAt: Timestamp;
}

export interface AuditEvent {
  id: string;
  bookingId: string;
  actorId: string;
  action:
    | 'confirmed'
    | 'checked_in'
    | 'extended'
    | 'checked_out'
    | 'cancelled'
    | 'expired'
    | 'force_released';
  createdAt: Timestamp;
}