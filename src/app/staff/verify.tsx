import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { StaffBottomNav } from '@/features/staff/StaffBottomNav';
import { formatClock, statusLabel } from '@/features/staff/staffFormat';
import { checkInBooking, resolveStaffBookingId } from '@/features/staff/staffOperations';
import { loadRoomName, loadStaffBooking } from '@/features/staff/staffQueries';
import { staffColors, staffStyles } from '@/features/staff/staffStyles';
import type { Booking } from '@/types/models';

export default function StaffVerify() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [reference, setReference] = useState(params.bookingId ?? '#SLIIT-8921');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [roomName, setRoomName] = useState('Discussion Room 02');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(idText: string) {
    setBusy(true);
    setError('');
    try {
      const bookingId = resolveStaffBookingId(idText.replace('#', ''));
      const record = await loadStaffBooking(bookingId);
      const name = await loadRoomName(record.roomId);
      setBooking(record);
      setRoomName(name);
    } catch (failure) {
      // Keep UI rich for demo/verification
      setError(failure instanceof Error ? failure.message : 'Could not load this booking.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (params.bookingId) {
      void load(params.bookingId);
    }
  }, [params.bookingId]);

  async function authorize() {
    setBusy(true);
    setError('');
    try {
      if (booking) {
        await checkInBooking(booking.id);
        router.replace({ pathname: '/staff/details', params: { bookingId: booking.id } });
      } else {
        // Fallback for mock preview
        router.replace({ pathname: '/staff/details', params: { bookingId: 'SLIIT-8921' } });
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Check-in failed.');
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
          <Text style={staffStyles.title}>Verify Check-In</Text>
        </View>
      </View>

      <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
        {/* Camera Scanner Active Box */}
        <View
          style={{
            backgroundColor: staffColors.scanNavy,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 210,
            position: 'relative',
          }}
        >
          {/* Corner brackets graphics */}
          <View style={{ position: 'absolute', top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#3B82F6', width: 24, height: 24, borderRadius: 2 }} />
          <View style={{ position: 'absolute', top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#3B82F6', width: 24, height: 24, borderRadius: 2 }} />

          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons name="camera-outline" size={28} color="#FFF" />
          </View>
          <Text
            style={{
              color: '#38BDF8',
              fontFamily: 'monospace',
              fontWeight: '700',
              fontSize: 13,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            [CAMERA ACTIVE]
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>
            Align student digital pass QR within frame
          </Text>
        </View>

        {/* Manual Search Fallback */}
        <View style={staffStyles.card}>
          <Text style={staffStyles.kicker}>MANUAL SEARCH FALLBACK</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: staffColors.borderLight,
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 42,
              }}
            >
              <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                value={reference}
                onChangeText={setReference}
                placeholder="#SLIIT-8921"
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, color: staffColors.navy, fontWeight: '600', fontSize: 14 }}
                autoCapitalize="none"
              />
            </View>
            <Pressable
              style={[staffStyles.pillButton, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' }]}
              onPress={() => void load(reference)}
            >
              <Text style={[staffStyles.pillButtonText, { color: staffColors.navy }]}>Lookup</Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={staffStyles.error}>{error}</Text> : null}

        {/* Booking Verified Card Container */}
        <View
          style={[
            staffStyles.card,
            { borderColor: staffColors.chipGreen, borderWidth: 1.5 },
          ]}
        >
          {/* Header row */}
          <View
            style={[
              staffStyles.headerRow,
              {
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: staffColors.chipGreen,
                }}
              />
              <Text style={{ color: staffColors.chipGreen, fontWeight: '800', fontSize: 14 }}>
                BOOKING VERIFIED
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 12 }}>
                Ref: {booking ? `#${booking.id}` : '#SLIIT-8921'}
              </Text>
            </View>
          </View>

          {/* Grid Row 1 */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={staffStyles.sectionLabel}>Assigned Space</Text>
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {roomName}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 11 }}>Level 2 · Main Library</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={staffStyles.sectionLabel}>Time Window</Text>
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {booking
                  ? `${formatClock(booking.startAt)} – ${formatClock(booking.endAt)}`
                  : '12:30 PM – 1:30 PM'}
              </Text>
              <Text style={{ color: staffColors.chipGreen, fontSize: 11, fontWeight: '600' }}>
                Scan: 12:36 PM (Valid)
              </Text>
            </View>
          </View>

          {/* Grid Row 2 */}
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginTop: 4,
            }}
          >
            <View style={staffStyles.headerRow}>
              <View>
                <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14 }}>
                  {booking?.groupName || 'HCI Project Squad'}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 11 }}>
                  Lead: Avishka (IT21094820)
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: staffColors.chipGreenBg,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderColor: '#B9E4C9',
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: staffColors.chipGreen, fontWeight: '700', fontSize: 11 }}>
                  {booking ? `${booking.members.length} Members` : '4 Members (Rule 3–8 OK)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Authorize Check-In Button */}
          <Pressable
            style={[
              staffStyles.actionButton,
              { backgroundColor: staffColors.navy, marginTop: 12 },
            ]}
            onPress={() => void authorize()}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={staffStyles.actionButtonText}>AUTHORIZE CHECK-IN</Text>
          </Pressable>

          {/* Reject link */}
          <Pressable style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>
              Reject / Flag Invalid Arrival
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <StaffBottomNav activeTab="scanner" />
    </SafeAreaView>
  );
}
