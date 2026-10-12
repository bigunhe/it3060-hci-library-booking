import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/constants/theme';
import { subscribeRoomAvailability, type RoomAvailability } from '@/lib/availability';
import { errorMessage, timeLabel } from '@/features/booking/bookingDisplay';
import { extendBooking } from '@/features/session/sessionOperations';
import { useSessionBooking } from '@/features/session/useSessionBooking';
import { Notice, PreviewNotice, SessionLoading, SessionScreen, SessionUnavailable, s, ui } from '@/features/session/SessionUI';

export default function ExtendScreen() {
  const { booking, bookingId, room, preview, error, loading, now, reload } = useSessionBooking();
  const [minutes, setMinutes] = useState<15 | 30>(15);
  const [availabilityResult, setAvailabilityResult] = useState<{ key: string; data: RoomAvailability | null; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const roomId = booking?.roomId;
  const endMs = booking?.endAt.toMillis();
  const params = { bookingId, ...(preview ? { preview: '1' } : {}) };
  const availabilityKey = `${roomId}_${endMs}`;
  const availability = availabilityResult?.key === availabilityKey ? availabilityResult.data : null;
  const availabilityError = availabilityResult?.key === availabilityKey ? availabilityResult.error : '';
  useEffect(() => {
    if (!roomId || endMs === undefined) return;
    return subscribeRoomAvailability(roomId, Timestamp.fromMillis(endMs), Timestamp.fromMillis(endMs + 60 * 60000),
      (data) => setAvailabilityResult({ key: availabilityKey, data, error: '' }),
      (failure) => setAvailabilityResult({ key: availabilityKey, data: null, error: errorMessage(failure) }));
  }, [roomId, endMs, availabilityKey]);
  const free = !!availability && !availability.overstaying && availability.blockedStarts.length === 0;
  const eligible = !!booking && booking.status === 'active' && booking.extensionMinutes === 0 && now < booking.endAt.toMillis();
  async function extend() {
    if (preview || submitting.current || !eligible || !free || !!availabilityError) return;
    submitting.current = true; setBusy(true); setMessage('');
    try { await extendBooking(bookingId, minutes); router.replace({ pathname: '/session/active', params: { bookingId } }); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <SessionScreen title="Extend Session" subtitle={room?.name} onBack={busy ? undefined : () => router.replace({ pathname: '/session/active', params })}
    footer={booking ? <AppButton title={preview ? 'Return to Session Preview' : `Extend Session by ${minutes} Minutes`} loading={busy} disabled={!preview && (!eligible || !free || !!availabilityError || !!error)} onPress={preview ? () => router.replace({ pathname: '/session/active', params }) : () => void extend()} /> : undefined}>
    <SessionLoading loading={loading} error={error} reload={reload} />
    {preview ? <PreviewNotice /> : null}
    {booking ? <>
      <SessionUnavailable booking={booking} preview={preview} />
      <View style={s.inset}><View style={ui.row}><Text style={ui.muted}>Current slot</Text><Text style={s.value}>{timeLabel(booking.startAt.toMillis())} – {timeLabel(booking.endAt.toMillis())}</Text></View><View style={ui.row}><Text style={ui.muted}>Current remaining</Text><Text style={s.value}>{preview && booking.status !== 'active' ? 'Starts after staff check-in' : `${Math.max(0, Math.ceil((booking.endAt.toMillis() - now) / 60000))} mins`}</Text></View></View>
      {availabilityError ? <Notice text={availabilityError} error /> : !availability ? <View style={s.inset}><ActivityIndicator color={colors.primary} /><Text style={ui.muted}>Checking the entire next hour…</Text></View> : <View style={free ? s.success : s.warning}><Text style={[free ? s.successText : s.warningText, { fontWeight: '700' }]}>{free ? '✓ Next hour is available' : 'Next hour is unavailable'}</Text><Text style={free ? s.successText : s.warningText}>{timeLabel(booking.endAt.toMillis())} – {timeLabel(booking.endAt.toMillis() + 60 * 60000)}</Text><Text style={free ? s.successText : s.warningText}>{free ? 'Room availability is checked again when you submit. Your other bookings must also allow the extension.' : 'A reservation, temporary hold or room overstay blocks extension.'}</Text></View>}
      <Text style={ui.label}>CHOOSE EXTENSION LENGTH</Text>
      <View style={s.columns}>{([15, 30] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: minutes === value, disabled: busy }} disabled={busy} onPress={() => setMinutes(value)} style={[ui.card, ui.flex, minutes === value && ui.selected, minutes === value && { backgroundColor: '#F0F7FF' }]}><Text style={ui.heading}>+{value} Mins {minutes === value ? '✓' : ''}</Text><Text style={ui.body}>New end: {timeLabel(booking.endAt.toMillis() + value * 60000)}</Text><Text style={ui.muted}>{value === 15 ? 'Short extension' : 'Maximum allowed'}</Text></Pressable>)}</View>
      <Notice text={booking.extensionMinutes > 0 ? `Your one extension has already been used (+${booking.extensionMinutes} minutes).` : !preview && now >= booking.endAt.toMillis() ? 'The session has ended. Please hand over the room and check out.' : 'Library fair-use policy: one extension per booking, for 15 or 30 minutes. The entire next 60 minutes must be free.'} />
      {preview ? <Text style={ui.muted}>Choose an option to inspect its end-time preview. No extension is submitted in screen preview mode.</Text> : null}
    </> : null}
    <Notice text={message} error />
  </SessionScreen>;
}
