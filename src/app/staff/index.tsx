import { useFocusEffect, router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/constants/ui/AppButton';
import { AppInput } from '@/constants/ui/AppInput';
import { colors } from '@/constants/theme';
import { formatColombo, stateLabel } from '@/features/staff/staffFormat';
import {
  expireDueNoShows,
  loadStaffRooms,
  type StaffRoomRow,
} from '@/features/staff/staffQueries';
import { resolveStaffBookingId } from '@/features/staff/staffOperations';
import { badgeColor, staffStyles } from '@/features/staff/staffStyles';
import { auth } from '@/lib/firebase';

export default function StaffDashboard() {
  const [rooms, setRooms] = useState<StaffRoomRow[]>([]);
  const [lookup, setLookup] = useState('');
  const [message, setMessage] = useState('Loading staff dashboard...');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [denied, setDenied] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const cleanupNotes = await expireDueNoShows();
      const rows = await loadStaffRooms();
      setRooms(rows);
      setDenied(false);
      setMessage(
        cleanupNotes.length
          ? cleanupNotes.join('\n')
          : 'Room states are live Firestore data. Lookup does not check in automatically.'
      );
    } catch (failure) {
      const text =
        failure instanceof Error ? failure.message : 'Could not load the staff dashboard.';
      setDenied(text.includes('Students cannot') || text.includes('Staff access'));
      setError(text);
      setRooms([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  function openLookup() {
    setError('');
    try {
      const bookingId = resolveStaffBookingId(lookup);
      router.push({ pathname: '/staff/verify', params: { bookingId } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Invalid booking reference.');
    }
  }

  async function leave() {
    await signOut(auth);
    router.replace('/');
  }

  return (
    <ScrollView
      style={staffStyles.screen}
      contentContainerStyle={staffStyles.content}
      refreshControl={
        <RefreshControl refreshing={busy} onRefresh={() => void refresh()} />
      }
    >
      <Text style={staffStyles.title}>Staff operations</Text>
      <Text style={staffStyles.muted}>{message}</Text>
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      {denied ? (
        <AppButton title="Leave" onPress={() => void leave()} />
      ) : (
        <>
          <AppInput
            label="Booking reference or pass QR text"
            value={lookup}
            onChangeText={setLookup}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="20-character ID or SLIIT-LIBRARY:1:..."
          />
          <AppButton title="Look up reservation" onPress={openLookup} disabled={busy} />
          <Text style={staffStyles.muted}>
            Camera scanning needs a leader-approved Expo camera package. Manual
            lookup and pasted QR text use the same booking record.
          </Text>
          <AppButton
            title="Open audit log"
            variant="secondary"
            onPress={() => router.push('/staff/audit')}
          />

          {rooms.map((row) => (
            <View key={row.room.id} style={staffStyles.card}>
              <Text
                style={[staffStyles.badge, { backgroundColor: badgeColor(row.state) }]}
              >
                {stateLabel(row.state)}
              </Text>
              <Text style={staffStyles.body}>{row.room.name}</Text>
              <Text style={staffStyles.muted}>
                Level {row.room.level} · {row.room.location}
              </Text>
              {row.occupancy ? (
                <Text style={staffStyles.muted}>
                  Occupied until {formatColombo(row.occupancy.endAt)}
                </Text>
              ) : null}
              {row.pendingBookings.map((booking) => (
                <Text key={booking.id} style={staffStyles.muted}>
                  Pending {booking.id} · {formatColombo(booking.startAt)}
                </Text>
              ))}
              {row.state === 'overstay' && row.occupancy ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/staff/overstay',
                      params: { bookingId: row.occupancy?.bookingId ?? '' },
                    })
                  }
                >
                  <Text style={{ color: colors.danger }}>Resolve overstay</Text>
                </Pressable>
              ) : null}
              {row.state === 'active' && row.occupancy ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/staff/details',
                      params: { bookingId: row.occupancy?.bookingId ?? '' },
                    })
                  }
                >
                  <Text style={{ color: colors.primary }}>View active booking</Text>
                </Pressable>
              ) : null}
              {row.state === 'pending' && row.pendingBookings[0] ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/staff/verify',
                      params: { bookingId: row.pendingBookings[0].id },
                    })
                  }
                >
                  <Text style={{ color: colors.primary }}>Verify pending pass</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <AppButton title="Sign out" variant="secondary" onPress={() => void leave()} />
        </>
      )}
    </ScrollView>
  );
}
