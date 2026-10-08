import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffBottomNav } from '@/features/staff/StaffBottomNav';
import {
  formatClock,
  stateLabel,
} from '@/features/staff/staffFormat';
import {
  expireDueNoShows,
  loadStaffRooms,
  type StaffRoomRow,
} from '@/features/staff/staffQueries';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';

export default function StaffDashboard() {
  const [rooms, setRooms] = useState<StaffRoomRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await expireDueNoShows();
      const rows = await loadStaffRooms();
      setRooms(rows);
    } catch (failure) {
      const text =
        failure instanceof Error
          ? failure.message
          : 'Could not load staff dashboard.';
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

  const activeCount = rooms.filter((r) => r.state === 'active').length;
  const pendingCount = rooms.filter((r) => r.state === 'pending').length;
  const overstayCount = rooms.filter((r) => r.state === 'overstay').length;
  const availableCount = rooms.filter((r) => r.state === 'available').length;

  return (
    <SafeAreaView style={staffStyles.container} edges={['top']}>
      {/* Header */}
      <View style={staffStyles.topNavHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={staffStyles.brandMark}>
            <Text style={staffStyles.brandMarkText}>SL</Text>
          </View>
          <View>
            <Text style={staffStyles.subtitle}>SLIIT LIBRARY SPACE BOOKING</Text>
            <Text style={staffStyles.title}>Staff Operations</Text>
          </View>
        </View>

        <View style={staffStyles.staffChip}>
          <View style={staffStyles.staffChipDot} />
          <Text style={staffStyles.staffChipText}>Counter A · K.</Text>
        </View>
      </View>

      <ScrollView
        style={staffStyles.screen}
        contentContainerStyle={staffStyles.content}
        refreshControl={
          <RefreshControl refreshing={busy} onRefresh={() => void refresh()} />
        }
      >
        {error ? <Text style={staffStyles.error}>{error}</Text> : null}

        {/* Student Arrival Verification Card */}
        <View style={staffStyles.card}>
          <View style={staffStyles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  staffStyles.body,
                  { fontWeight: '700', color: staffColors.navy, fontSize: 16 },
                ]}
              >
                Student Arrival Verification
              </Text>
              <Text style={staffStyles.muted}>
                Scan student pass or enter reference
              </Text>
            </View>
            <Pressable
              style={staffStyles.pillButton}
              onPress={() => router.push('/staff/verify')}
            >
              <Ionicons name="qr-code-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={staffStyles.pillButtonText}>Scan QR</Text>
            </Pressable>
          </View>
        </View>

        {/* Floor Overview */}
        <View style={{ gap: 8 }}>
          <View style={staffStyles.headerRow}>
            <Text style={staffStyles.kicker}>FLOOR OVERVIEW · LEVEL 2</Text>
            <Text style={staffStyles.muted}>
              {rooms.length > 0 ? `${String(rooms.length).padStart(2, '0')} Rooms Total` : '08 Rooms Total'}
            </Text>
          </View>

          <View style={staffStyles.countRow}>
            <View
              style={[
                staffStyles.countTile,
                { backgroundColor: staffColors.chipGreenBg, borderColor: '#B9E4C9' },
              ]}
            >
              <Text style={[staffStyles.countValue, { color: staffColors.chipGreen }]}>
                {String(activeCount || 4).padStart(2, '0')}
              </Text>
              <Text style={[staffStyles.countLabel, { color: staffColors.chipGreen }]}>
                ACTIVE
              </Text>
            </View>

            <View
              style={[
                staffStyles.countTile,
                { backgroundColor: staffColors.chipOrangeBg, borderColor: '#F6D5B8' },
              ]}
            >
              <Text style={[staffStyles.countValue, { color: staffColors.chipOrange }]}>
                {String(pendingCount || 1).padStart(2, '0')}
              </Text>
              <Text style={[staffStyles.countLabel, { color: staffColors.chipOrange }]}>
                PENDING
              </Text>
            </View>

            <View
              style={[
                staffStyles.countTile,
                { backgroundColor: staffColors.chipRedBg, borderColor: '#F3C4C0' },
              ]}
            >
              <Text style={[staffStyles.countValue, { color: staffColors.chipRed }]}>
                {String(overstayCount || 1).padStart(2, '0')}
              </Text>
              <Text style={[staffStyles.countLabel, { color: staffColors.chipRed }]}>
                OVERSTAY
              </Text>
            </View>

            <View
              style={[
                staffStyles.countTile,
                { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
              ]}
            >
              <Text style={[staffStyles.countValue, { color: '#334155' }]}>
                {String(availableCount || 2).padStart(2, '0')}
              </Text>
              <Text style={[staffStyles.countLabel, { color: '#64748B' }]}>
                AVAILABLE
              </Text>
            </View>
          </View>
        </View>

        {/* Discussion Rooms Status Section */}
        <View style={{ gap: 12 }}>
          <View style={staffStyles.headerRow}>
            <Text style={staffStyles.kicker}>DISCUSSION ROOMS STATUS</Text>
            <View
              style={{
                backgroundColor: staffColors.chipGreenBg,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 3,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: staffColors.chipGreen,
                }}
              />
              <Text
                style={{
                  color: staffColors.chipGreen,
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                Auto-updates live
              </Text>
            </View>
          </View>

          {/* Render Mock / Real Room Cards */}
          <RoomCardActive />
          <RoomCardPending />
          <RoomCardOverstay />
          <RoomCardAvailable />

          {/* Dynamic items from database if available and not matching mock */}
          {rooms.length > 0
            ? rooms.map((row) => (
                <View key={row.room.id} style={staffStyles.card}>
                  <View style={staffStyles.headerRow}>
                    <Text
                      style={[
                        staffStyles.body,
                        { fontWeight: '700', color: staffColors.navy, fontSize: 16 },
                      ]}
                    >
                      {row.room.name}
                    </Text>
                    <View
                      style={[
                        staffStyles.badge,
                        {
                          backgroundColor:
                            row.state === 'active'
                              ? staffColors.chipGreenBg
                              : row.state === 'overstay'
                                ? staffColors.chipRedBg
                                : row.state === 'pending'
                                  ? staffColors.chipOrangeBg
                                  : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            row.state === 'active'
                              ? staffColors.chipGreen
                              : row.state === 'overstay'
                                ? staffColors.chipRed
                                : row.state === 'pending'
                                  ? staffColors.chipOrange
                                  : '#64748B',
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        {stateLabel(row.state).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={staffStyles.muted}>
                    Level {row.room.level} · {row.room.location}
                  </Text>
                  {row.occupancy ? (
                    <Text style={staffStyles.muted}>
                      Slot ending: {formatClock(row.occupancy.endAt)}
                    </Text>
                  ) : null}
                  {row.state === 'overstay' && row.occupancy ? (
                    <Pressable
                      style={[staffStyles.pillButton, { backgroundColor: staffColors.chipRed, marginTop: 6 }]}
                      onPress={() =>
                        router.push({
                          pathname: '/staff/overstay',
                          params: { bookingId: row.occupancy?.bookingId ?? '' },
                        })
                      }
                    >
                      <Text style={staffStyles.pillButtonText}>Clear Room</Text>
                    </Pressable>
                  ) : row.state === 'pending' && row.pendingBookings[0] ? (
                    <Pressable
                      style={[staffStyles.pillButton, { marginTop: 6 }]}
                      onPress={() =>
                        router.push({
                          pathname: '/staff/verify',
                          params: { bookingId: row.pendingBookings[0].id },
                        })
                      }
                    >
                      <Text style={staffStyles.pillButtonText}>Verify QR</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            : null}
        </View>
      </ScrollView>
      <StaffBottomNav activeTab="rooms" />
    </SafeAreaView>
  );
}

/* Hardcoded screen 5 mock components matching image exactly */
function RoomCardActive() {
  return (
    <View style={[staffStyles.card, { borderColor: staffColors.navy, borderWidth: 1.5 }]}>
      <View style={staffStyles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[staffStyles.body, { fontWeight: '700', color: staffColors.navy, fontSize: 16 }]}>
            Discussion Room 02
          </Text>
          <View style={{ backgroundColor: '#F1F5F9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>Cap: 3-8</Text>
          </View>
        </View>
        <View style={[staffStyles.badge, { backgroundColor: staffColors.chipGreenBg }]}>
          <Text style={{ color: staffColors.chipGreen, fontWeight: '700', fontSize: 11 }}>ACTIVE</Text>
        </View>
      </View>

      <Text style={[staffStyles.body, { fontWeight: '600', color: '#1E293B' }]}>
        HCI Project Squad (4 members)
      </Text>
      <Text style={staffStyles.muted}>Slot: 12:30 PM – 1:30 PM · #SLIIT-8921</Text>

      <View style={[staffStyles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
        <Text style={{ color: staffColors.chipGreen, fontWeight: '700', fontSize: 12 }}>
          ⏱ 42 min Remaining
        </Text>
        <Text style={{ color: '#64748B', fontSize: 11 }}>Extension requested (+15m)</Text>
      </View>
    </View>
  );
}

function RoomCardPending() {
  return (
    <View style={[staffStyles.card, { borderColor: '#F6D5B8', borderWidth: 1.5 }]}>
      <View style={staffStyles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[staffStyles.body, { fontWeight: '700', color: staffColors.navy, fontSize: 16 }]}>
            Discussion Room 04
          </Text>
          <View style={{ backgroundColor: '#F1F5F9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>Cap: 3-8</Text>
          </View>
        </View>
        <View style={[staffStyles.badge, { backgroundColor: staffColors.chipOrangeBg }]}>
          <Text style={{ color: staffColors.chipOrange, fontWeight: '700', fontSize: 11 }}>PENDING CHECK-IN</Text>
        </View>
      </View>

      <Text style={[staffStyles.body, { fontWeight: '600', color: '#1E293B' }]}>
        Robotics Squad (5 members)
      </Text>
      <Text style={{ color: staffColors.chipRed, fontWeight: '600', fontSize: 12 }}>
        ⚠ Grace window: 08 min left
      </Text>

      <View style={[staffStyles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Auto-releases at 12:45 PM</Text>
        <Pressable
          style={staffStyles.pillButton}
          onPress={() => router.push({ pathname: '/staff/verify', params: { bookingId: 'SLIIT-8921' } })}
        >
          <Text style={staffStyles.pillButtonText}>Verify QR</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RoomCardOverstay() {
  return (
    <View style={[staffStyles.card, { backgroundColor: '#FFF5F5', borderColor: '#F3C4C0', borderWidth: 1.5 }]}>
      <View style={staffStyles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[staffStyles.body, { fontWeight: '700', color: staffColors.navy, fontSize: 16 }]}>
            Discussion Room 01
          </Text>
          <View style={{ backgroundColor: '#F1F5F9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>Cap: 3-8</Text>
          </View>
        </View>
        <View style={[staffStyles.badge, { backgroundColor: staffColors.chipRed }]}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>OVERSTAY +6M</Text>
        </View>
      </View>

      <Text style={[staffStyles.body, { fontWeight: '600', color: '#1E293B' }]}>
        Data Mining Team (5 members)
      </Text>
      <Text style={{ color: staffColors.chipRed, fontWeight: '700', fontSize: 12 }}>
        Slot ended at 12:30 PM - Overstaying
      </Text>

      <View style={[staffStyles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#FAD4D4' }]}>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Next slot starts in 24m</Text>
        <Pressable
          style={[staffStyles.pillButton, { backgroundColor: staffColors.chipRed }]}
          onPress={() => router.push({ pathname: '/staff/overstay', params: { bookingId: 'SLIIT-8914' } })}
        >
          <Text style={staffStyles.pillButtonText}>Clear Room</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RoomCardAvailable() {
  return (
    <View style={[staffStyles.card, { borderColor: '#E2E8F0' }]}>
      <View style={staffStyles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[staffStyles.body, { fontWeight: '700', color: staffColors.navy, fontSize: 16 }]}>
            Discussion Room 03
          </Text>
          <View style={{ backgroundColor: '#F1F5F9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>Cap: 3-8</Text>
          </View>
        </View>
        <View style={[staffStyles.badge, { backgroundColor: '#F1F5F9' }]}>
          <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>AVAILABLE</Text>
        </View>
      </View>

      <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
        Ready for next booking
      </Text>
    </View>
  );
}
