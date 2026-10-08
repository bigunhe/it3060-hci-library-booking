import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { StaffBottomNav } from '@/features/staff/StaffBottomNav';
import {
  bookingRefLabel,
  elapsedMinutes,
  formatClock,
  formatNowClock,
} from '@/features/staff/staffFormat';
import { forceReleaseBooking } from '@/features/staff/staffOperations';
import { loadRoom, loadStaffBooking, loadStaffRooms } from '@/features/staff/staffQueries';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';
import type { Booking, Room } from '@/types/models';

export default function StaffOverstay() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId ?? 'SLIIT-8914';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [nextLabel, setNextLabel] = useState('Mobile Computing Group (5)');
  const [nextSlot, setNextSlot] = useState('2:30 PM Slot');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError('');
      try {
        const record = await loadStaffBooking(bookingId);
        const loadedRoom = await loadRoom(record.roomId);
        const rooms = await loadStaffRooms();
        const row = rooms.find((item) => item.room.id === record.roomId);
        if (!cancelled) {
          setBooking(record);
          setRoom(loadedRoom);
          if (row?.nextBooking) {
            setNextLabel(`${row.nextBooking.groupName || 'Next group'} (${row.nextBooking.members.length})`);
            setNextSlot(`${formatClock(row.nextBooking.startAt)} Slot`);
          }
        }
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load this booking.');
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    if (params.bookingId) {
      void load();
    } else {
      setBusy(false);
    }
    return () => {
      cancelled = true;
    };
  }, [bookingId, params.bookingId]);

  function confirmRelease() {
    Alert.alert(
      'Confirm physical clearance',
      'Release this room only after the group has left. This completes the booking and frees the locks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release room',
          style: 'destructive',
          onPress: () => {
            void release();
          },
        },
      ]
    );
  }

  async function release() {
    setBusy(true);
    setError('');
    try {
      if (params.bookingId) {
        await forceReleaseBooking(bookingId);
      }
      router.replace({ pathname: '/staff/details', params: { bookingId } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Staff release failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={staffStyles.container} edges={['top']}>
      {/* Top Header */}
      <View style={staffStyles.topNavHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            style={staffStyles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/staff'))}
          >
            <Ionicons name="chevron-back" size={20} color={staffColors.navy} />
          </Pressable>
          <View>
            <Text style={staffStyles.kicker}>OPERATIONAL EXCEPTION</Text>
            <Text style={staffStyles.title}>Resolve Overstay</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#FFF5F5',
            borderColor: '#F3C4C0',
            borderWidth: 1,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: staffColors.chipRed, fontWeight: '800', fontSize: 12 }}>
            ROOM 01
          </Text>
        </View>
      </View>

      <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
        {error ? <Text style={staffStyles.error}>{error}</Text> : null}

        {/* OVERSTAY DETECTED BANNER */}
        <View
          style={[
            staffStyles.card,
            { backgroundColor: '#FFF5F5', borderColor: '#F3C4C0', borderWidth: 1.5 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="time-outline" size={22} color={staffColors.chipRed} />
            <Text style={{ color: staffColors.chipRed, fontWeight: '800', fontSize: 14 }}>
              OVERSTAY DETECTED  +8 MIN
            </Text>
          </View>
          <Text style={{ color: staffColors.chipRed, fontSize: 12, marginTop: 2 }}>
            The reservation has exceeded its allocated time and requires room clearance.
          </Text>
        </View>

        {/* TARGET SPACE CARD */}
        <View style={staffStyles.card}>
          <View style={staffStyles.headerRow}>
            <Text style={staffStyles.sectionLabel}>TARGET SPACE</Text>
            <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 13 }}>
              {booking ? bookingRefLabel(booking.id) : '#SLIIT-8914'}
            </Text>
          </View>

          <Text
            style={[
              staffStyles.body,
              { fontWeight: '800', color: staffColors.navy, fontSize: 20 },
            ]}
          >
            {room?.name || 'Discussion Room 01'}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 12 }}>
            Level 2 · Main Library (Occupied)
          </Text>

          {/* 4 Fields Grid Box */}
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginTop: 6,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={staffStyles.sectionLabel}>BOOKED UNTIL</Text>
                <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  {booking ? formatClock(booking.endAt) : '2:00 PM'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={staffStyles.sectionLabel}>CURRENT TIME</Text>
                <Text style={{ color: staffColors.chipRed, fontWeight: '800', fontSize: 14, marginTop: 2 }}>
                  2:08 PM
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={staffStyles.sectionLabel}>OCCUPYING GROUP</Text>
                <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  {booking?.groupName || 'Data Mining Team'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={staffStyles.sectionLabel}>MEMBERS</Text>
                <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  {booking ? `${booking.members.length} Members` : '4 Members'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* NEXT SCHEDULED ARRIVAL CARD */}
        <View style={staffStyles.card}>
          <Text style={staffStyles.sectionLabel}>NEXT SCHEDULED ARRIVAL</Text>

          <View style={[staffStyles.headerRow, { marginTop: 4 }]}>
            <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 15 }}>
              {nextLabel}
            </Text>
            <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14 }}>
              {nextSlot}
            </Text>
          </View>

          <Text style={{ color: staffColors.chipGreen, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            Releasing this room resets its status to <Text style={{ fontWeight: '700' }}>Available / Cleaning Required</Text> and notifies the desk staff.
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        <Pressable
          style={[
            staffStyles.actionButton,
            { backgroundColor: staffColors.chipRed, marginTop: 8 },
          ]}
          onPress={confirmRelease}
        >
          <Ionicons name="trash-outline" size={18} color="#FFF" />
          <Text style={staffStyles.actionButtonText}>
            {busy ? 'Working…' : 'Confirm Room Release'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            staffStyles.actionButton,
            { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
          ]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/staff'))}
        >
          <Text style={[staffStyles.actionButtonText, { color: staffColors.navy }]}>
            Keep Booking Active
          </Text>
        </Pressable>
      </ScrollView>
      <StaffBottomNav activeTab="rooms" />
    </SafeAreaView>
  );
}
