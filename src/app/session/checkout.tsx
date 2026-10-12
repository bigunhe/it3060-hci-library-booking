import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { errorMessage } from '@/features/booking/bookingDisplay';
import { checkoutBooking } from '@/features/session/sessionOperations';
import { useSessionBooking } from '@/features/session/useSessionBooking';
import { CheckRow, Notice, PreviewNotice, SessionLoading, SessionScreen, SessionUnavailable, TimerCard, ui } from '@/features/session/SessionUI';

const items = ['Whiteboard cleaned & markers capped', 'Display turned off & HDMI cable returned', 'Chairs arranged & personal belongings collected'];
export default function CheckoutScreen() {
  const { booking, bookingId, room, preview, error, loading, now, reload } = useSessionBooking();
  const [checked, setChecked] = useState([false, false, false]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const params = { bookingId, ...(preview ? { preview: '1' } : {}) };
  const available = !!booking && (booking.status === 'active' || preview);
  async function checkout() {
    if (preview || submitting.current || !checked.every(Boolean) || !booking || booking.status !== 'active') return;
    submitting.current = true; setBusy(true); setMessage('');
    try { await checkoutBooking(bookingId); router.replace({ pathname: '/session/completed', params: { bookingId } }); }
    catch (failure) { setMessage(errorMessage(failure)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <SessionScreen title="Handover & Checkout" subtitle={room?.name} onBack={busy ? undefined : () => router.replace({ pathname: '/session/active', params })}
    footer={available ? <><AppButton title={preview ? 'Preview Completion Receipt' : 'Complete Checkout & Release Room'} disabled={!checked.every(Boolean) || busy || !!error} loading={busy} onPress={preview ? () => router.push({ pathname: '/session/completed', params }) : () => void checkout()} /><Text style={ui.muted}>{preview ? 'Preview only — no room is released.' : 'Room availability updates after checkout succeeds.'}</Text></> : undefined}>
    <SessionLoading loading={loading} error={error} reload={reload} />
    {preview ? <PreviewNotice /> : null}
    {booking ? <><SessionUnavailable booking={booking} preview={preview} />{available ? <>
      <TimerCard booking={booking} now={now} preview={preview} />
      <View style={ui.card}><Text style={ui.heading}>Room Handover Checklist</Text><Text style={ui.muted}>Confirm all three items before leaving. If equipment is unavailable, confirm it has been safely accounted for.</Text>{items.map((label, index) => <CheckRow key={label} label={label} checked={checked[index]} onPress={() => { if (!busy) setChecked((values) => values.map((value, i) => i === index ? !value : value)); }} />)}</View>
      <AppButton title={booking.extensionMinutes > 0 ? 'Extension Limit Reached' : preview ? 'Preview Extension Options' : 'Request Session Extension'} variant="secondary" disabled={busy || booking.extensionMinutes > 0 || (!preview && now >= booking.endAt.toMillis())} onPress={() => router.push({ pathname: '/session/extend', params })} />
      <Text style={ui.muted}>You can check out early. A session that reaches zero stays occupied until checkout or staff release.</Text>
    </> : null}</> : null}
    <Notice text={message} error />
  </SessionScreen>;
}
