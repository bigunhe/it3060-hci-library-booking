import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { StudentNavigation } from '@/components/ui/StudentNavigation';
import { colors, radius } from '@/constants/theme';
import { BookingScreen, Notice, ui } from '@/features/booking/BookingUI';
import { dateLabel, localDate, timeLabel } from '@/features/booking/bookingDisplay';
import type { Booking, BookingStatus, Room } from '@/types/models';
import { bookingReference, countdown } from './sessionDisplay';

export { Notice, ui };
export function SessionScreen({ title, subtitle, children, footer, onBack, headerRight }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
  onBack?: () => void; headerRight?: ReactNode;
}) {
  return <BookingScreen title={title} subtitle={subtitle} onBack={onBack} headerRight={headerRight}
    footer={<>{footer}<StudentNavigation active="My Passes" /></>}>{children}</BookingScreen>;
}
export function SessionLoading({ loading, error, reload }: { loading: boolean; error: string; reload: () => void }) {
  return <>{loading ? <View style={s.loading}><ActivityIndicator color={colors.primary} /><Text style={ui.muted}>Loading your reservation…</Text></View> : null}
    {error ? <><Notice text={error} error /><AppButton title="Retry" variant="secondary" onPress={reload} /></> : null}</>;
}
export function PreviewNotice() {
  return <Notice text="SCREEN PREVIEW · Your reservation stays unchanged. Staff must check you in before real session actions are available." />;
}
export function StatusBadge({ status }: { status: BookingStatus }) {
  const tone = status === 'active' || status === 'completed' ? colors.success :
    status === 'cancelled' || status === 'expired' ? colors.danger : colors.primary;
  return <View style={[s.badge, { borderColor: tone }]}><Text style={[s.badgeText, { color: tone }]}>{status === 'confirmed' ? 'CONFIRMED' : status.toUpperCase()}</Text></View>;
}
export function BookingSummary({ booking, room, compact = false }: { booking: Booking; room: Room | null; compact?: boolean }) {
  return <View style={ui.card}>
    <View style={ui.row}><Text style={ui.label}>SPACE & ROSTER</Text><Text selectable style={s.reference}>{bookingReference(booking.id)}</Text></View>
    <Text style={ui.heading}>{room?.name ?? booking.roomId}</Text>
    <Text style={ui.muted}>{room ? `Level ${room.level} · ${room.location}` : 'Loading room details…'}</Text>
    <View style={s.inset}>
      <View style={s.columns}><View style={ui.flex}><Text style={ui.label}>SCHEDULED DATE</Text><Text style={s.value}>{dateLabel(localDate(booking.startAt.toMillis()))}</Text></View>
        <View style={ui.flex}><Text style={ui.label}>TIME SLOT</Text><Text style={s.value}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text></View></View>
      <View style={s.columns}><View style={ui.flex}><Text style={ui.label}>STUDENT GROUP</Text><Text style={s.value}>{booking.groupName || 'Study group'}</Text></View>
        <View style={ui.flex}><Text style={ui.label}>GROUP ROSTER</Text><Text style={s.value}>{booking.members.length} members</Text></View></View>
    </View>
    {!compact && booking.purpose ? <Text style={ui.muted}>Purpose: {booking.purpose}</Text> : null}
  </View>;
}
export function TimerCard({ booking, now, preview = false }: { booking: Booking; now: number; preview?: boolean }) {
  const duration = booking.endAt.toMillis() - booking.startAt.toMillis();
  const remaining = preview && booking.status !== 'active' ? duration : booking.endAt.toMillis() - now;
  const overdue = remaining <= 0;
  const soon = !overdue && remaining <= 5 * 60000;
  const tone = overdue ? colors.danger : soon ? colors.accent : colors.primary;
  const progress = Math.max(0, Math.min(1, remaining / duration));
  return <View style={[ui.card, s.timerCard, (soon || overdue) && { borderColor: tone, backgroundColor: '#FFF8F0' }]}>
    <Text style={[ui.label, { color: tone }]}>{preview ? 'COUNTDOWN PREVIEW' : overdue ? 'SESSION OVERDUE' : soon ? 'SESSION ENDING SOON' : 'TIME REMAINING'}</Text>
    <Text accessibilityLiveRegion={soon || overdue ? 'polite' : 'none'} style={[s.timer, { color: tone }]}>{countdown(remaining)}</Text>
    <Text style={ui.muted}>Minutes : Seconds</Text>
    <View style={s.track}><View style={[s.fill, { width: `${progress * 100}%`, backgroundColor: tone }]} /></View>
    <Text style={ui.body}>Scheduled end: {timeLabel(booking.endAt.toMillis())}</Text>
    {overdue && !preview ? <Text style={[ui.muted, { color: colors.danger }]}>Please hand over the room and check out. The room stays occupied until it is released.</Text> : null}
  </View>;
}
export function SessionUnavailable({ booking, preview = false }: { booking: Booking; preview?: boolean }) {
  if (preview || booking.status === 'active') return null;
  return <><Notice text={booking.status === 'confirmed' ? 'Your reservation is confirmed. Present your pass at the counter; staff check-in starts your session.' : `This reservation is ${booking.status}. Session actions are unavailable.`} />
    <AppButton title={booking.status === 'completed' ? 'View Receipt' : 'View Access Pass'} variant="secondary" onPress={() => router.replace({ pathname: booking.status === 'completed' ? '/session/completed' : '/session/pass', params: { bookingId: booking.id } })} /></>;
}
export function CheckRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={s.checkRow}>
    <View style={[s.checkbox, checked && { backgroundColor: colors.primary }]}><Text style={s.checkmark}>{checked ? '✓' : ''}</Text></View>
    <Text style={[ui.body, ui.flex]}>{label}</Text>
  </Pressable>;
}
export const s = StyleSheet.create({
  loading: { padding: 30, gap: 12, alignItems: 'center' },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  reference: { fontSize: 11, color: colors.muted, fontWeight: '600', fontFamily: 'monospace', maxWidth: 120 },
  inset: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 14 },
  columns: { flexDirection: 'row', gap: 14 },
  value: { color: colors.primary, fontSize: 13, fontWeight: '600', lineHeight: 20, marginTop: 4 },
  timerCard: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  timer: { fontSize: 56, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginVertical: 10 },
  fill: { height: 6, borderRadius: 3 },
  checkRow: { minHeight: 52, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: radius.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: colors.white, fontWeight: '700' },
  warning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: radius.md, padding: 14, gap: 6 },
  warningText: { color: '#92400E', fontSize: 13, lineHeight: 20 },
  success: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: radius.md, padding: 14, gap: 6 },
  successText: { color: '#047857', fontSize: 13, lineHeight: 20 },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  circle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
});
