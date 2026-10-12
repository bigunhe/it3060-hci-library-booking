import { useRef, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppButton } from '@/components/ui/AppButton';
import { auth } from '@/lib/firebase';
import { errorMessage } from '@/features/booking/bookingDisplay';
import type { Booking, Room } from '@/types/models';
import { StaffBottomNav } from './StaffBottomNav';
import { staffColors, staffStyles, stateTone } from './staffStyles';
import { formatClock, formatLongDate, groupRuleOk } from './staffFormat';

export function StaffScreen({ title, subtitle, tab, children, footer, back = false }: {
  title: string; subtitle?: string; tab: 'rooms' | 'scanner' | 'audit'; children: ReactNode; footer?: ReactNode; back?: boolean;
}) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const exiting = useRef(false);
  async function logout() {
    if (exiting.current) return;
    exiting.current = true; setBusy(true); setError('');
    try { await signOut(auth); router.replace('/login'); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { exiting.current = false; setBusy(false); }
  }
  return <SafeAreaView style={staffStyles.container}>
    <View style={staffStyles.topNavHeader}>
      {back ? <Pressable accessibilityRole="button" accessibilityLabel="Back to staff dashboard" onPress={() => router.replace('/staff')} style={staffStyles.backButton}><Ionicons name="chevron-back" size={20} color={staffColors.navy} /></Pressable> : <View style={staffStyles.brandMark}><Text style={staffStyles.brandMarkText}>SL</Text></View>}
      <View style={{ flex: 1, paddingHorizontal: 10 }}><Text style={staffStyles.kicker}>{subtitle ?? 'SLIIT LIBRARY SPACE BOOKING'}</Text><Text style={staffStyles.title}>{title}</Text></View>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void logout()} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: staffColors.navy, fontWeight: '600', fontSize: 12 }}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={staffStyles.content}>{error ? <StaffNotice text={error} error /> : null}{children}</ScrollView>
    {footer ? <View style={styles.footer}>{footer}</View> : null}
    <StaffBottomNav activeTab={tab} />
  </SafeAreaView>;
}
export function StaffNotice({ text, error = false }: { text: string; error?: boolean }) {
  return text ? <View style={[styles.notice, error && { borderColor: staffColors.chipRed, backgroundColor: staffColors.chipRedBg }]}><Text accessibilityLiveRegion="polite" style={[staffStyles.body, error && { color: staffColors.chipRed }]}>{text}</Text></View> : null;
}
export function StaffLoading({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  return <>{loading ? <View style={styles.loading}><ActivityIndicator color={staffColors.navy} /><Text style={staffStyles.muted}>Loading live records…</Text></View> : null}{error ? <><StaffNotice text={error} error /><AppButton title="Retry" variant="secondary" onPress={retry} /></> : null}</>;
}
export function StaffBadge({ label, state }: { label: string; state: string }) {
  const tone = stateTone(state);
  return <View style={[staffStyles.badge, { backgroundColor: tone.badgeBg }]}><Text style={{ fontSize: 10, fontWeight: '700', color: tone.badgeText }}>{label.toUpperCase()}</Text></View>;
}
export function StaffBookingCard({ booking, room, roster = false }: { booking: Booking; room: Room | null; roster?: boolean }) {
  return <View style={staffStyles.card}>
    <Text style={staffStyles.sectionLabel}>ASSIGNED SPACE</Text><Text style={styles.heading}>{room?.name ?? booking.roomId}</Text>
    {room ? <Text style={staffStyles.muted}>Level {room.level} · {room.location}</Text> : null}
    <View style={styles.line} />
    <Text style={staffStyles.sectionLabel}>DATE & TIME WINDOW</Text><Text style={staffStyles.body}>{formatLongDate(booking.startAt)}</Text><Text style={styles.value}>{formatClock(booking.startAt)} – {formatClock(booking.endAt)}</Text>
    <Text style={staffStyles.sectionLabel}>STUDENT GROUP</Text><View style={staffStyles.headerRow}><Text style={[styles.value, { flex: 1 }]}>{booking.groupName || 'Group setup incomplete'}</Text><StaffBadge state={groupRuleOk(booking.members.length) ? 'active' : 'overstay'} label={`${booking.members.length} members`} /></View>
    {roster ? booking.members.map((member, index) => <View key={`${member.studentId}_${index}`} style={styles.inset}><Text style={staffStyles.body}>{member.name}</Text><Text style={staffStyles.muted}>{member.studentId}</Text></View>) : null}
    {booking.purpose ? <Text style={staffStyles.muted}>Purpose: {booking.purpose}</Text> : null}
    <Text selectable style={styles.reference}>Full reference: {booking.id}</Text>
  </View>;
}
export const styles = StyleSheet.create({
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderColor: staffColors.borderLight, backgroundColor: '#FFFFFF' },
  heading: { fontSize: 18, fontWeight: '700', color: staffColors.navy },
  value: { fontSize: 14, fontWeight: '600', color: staffColors.navy, lineHeight: 21 },
  inset: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, gap: 5, borderWidth: 1, borderColor: staffColors.borderLight },
  notice: { borderWidth: 1, borderColor: staffColors.borderLight, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12 },
  line: { height: 1, backgroundColor: staffColors.borderLight, marginVertical: 4 },
  reference: { color: staffColors.textMuted, fontSize: 11, lineHeight: 18 },
  loading: { alignItems: 'center', gap: 10, padding: 20 },
});
