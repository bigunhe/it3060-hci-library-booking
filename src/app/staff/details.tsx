import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { StaffBottomNav } from '@/features/staff/StaffBottomNav';
import {
  auditActionLabel,
  bookingRefLabel,
  formatClock,
  formatLongDate,
  groupRuleOk,
  ledgerState,
  statusLabel,
} from '@/features/staff/staffFormat';
import {
  loadRoom,
  loadStaffAuditEvents,
  loadStaffBooking,
} from '@/features/staff/staffQueries';
import { staffColors, staffStyles, stateTone } from '@/features/staff/staffStyles';
import type { AuditEvent, Booking, Room } from '@/types/models';

export default function StaffDetails() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = params.bookingId ?? 'SLIIT-8921';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError('');
      try {
        const record = await loadStaffBooking(bookingId);
        const loadedRoom = await loadRoom(record.roomId);
        const audit = await loadStaffAuditEvents(record.id);
        if (!cancelled) {
          setBooking(record);
          setRoom(loadedRoom);
          setEvents([...audit].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()));
        }
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load details.');
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <SafeAreaView style={staffStyles.container} edges={['top']}>
      {/* Top Navigation Header */}
      <View style={staffStyles.topNavHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            style={staffStyles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/staff'))}
          >
            <Ionicons name="chevron-back" size={20} color={staffColors.navy} />
          </Pressable>
          <View>
            <Text style={staffStyles.kicker}>AUDIT TRAIL / RECORDS</Text>
            <Text style={staffStyles.title}>Booking Details</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: staffColors.navy, fontWeight: '800', fontSize: 13 }}>
            #SLIIT-8921
          </Text>
        </View>
      </View>

      <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
        {error ? <Text style={staffStyles.error}>{error}</Text> : null}

        {/* Card 1: CURRENT STATUS */}
        <View
          style={[
            staffStyles.card,
            { backgroundColor: staffColors.chipGreenBg, borderColor: '#B9E4C9', borderWidth: 1.5 },
          ]}
        >
          <View style={staffStyles.headerRow}>
            <View>
              <Text style={staffStyles.sectionLabel}>CURRENT STATUS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: staffColors.chipGreen,
                  }}
                />
                <Text style={{ color: staffColors.chipGreen, fontWeight: '800', fontSize: 14 }}>
                  ACTIVE / CHECKED IN
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: staffColors.chipGreen,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>VERIFIED</Text>
            </View>
          </View>
        </View>

        {/* Card 2: RESERVED SPACE */}
        <View style={staffStyles.card}>
          <View style={staffStyles.headerRow}>
            <Text style={staffStyles.sectionLabel}>RESERVED SPACE</Text>
            <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 13 }}>
              Level 2 · Main Library
            </Text>
          </View>

          <Text
            style={[
              staffStyles.body,
              { fontWeight: '800', color: staffColors.navy, fontSize: 20, marginVertical: 4 },
            ]}
          >
            {room?.name || 'Discussion Room 02'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={staffStyles.sectionLabel}>DATE</Text>
              <Text style={{ color: '#1E293B', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                {booking ? formatLongDate(booking.startAt) : 'Saturday, 24 Oct 2026'}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={staffStyles.sectionLabel}>TOTAL DURATION</Text>
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {booking
                  ? `${formatClock(booking.startAt)} – ${formatClock(booking.endAt)}`
                  : '12:30 PM – 1:45 PM'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 3: REGISTERED GROUP */}
        <View style={staffStyles.card}>
          <View style={staffStyles.headerRow}>
            <Text style={staffStyles.sectionLabel}>REGISTERED GROUP</Text>
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderColor: '#BFDBFE',
                borderWidth: 1,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 11 }}>
                Rule 3–8 Valid
              </Text>
            </View>
          </View>

          <View style={staffStyles.headerRow}>
            <View>
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 16 }}>
                {booking?.groupName || 'HCI Project Squad'}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                Primary Contact: Avishka (Lead)
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderColor: '#CBD5E1',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 12 }}>
                {booking ? `${booking.members.length} Members` : '4 Members'}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginTop: 6,
            }}
          >
            <Text style={{ color: '#475569', fontSize: 12, lineHeight: 18 }}>
              <Text style={{ fontWeight: '700' }}>Roster: </Text>
              {booking
                ? booking.members.map((m) => `${m.name} (${m.studentId})`).join(', ')
                : 'Avishka (IT21094820), B.A. Hettiarachchi, D.A.R.B. Padmasiri, P.G.P. Sewwandi'}
            </Text>
          </View>
        </View>

        {/* Card 4: BOOKING EVENT TIMELINE */}
        <View style={staffStyles.card}>
          <Text style={staffStyles.sectionLabel}>BOOKING EVENT TIMELINE</Text>

          <View style={{ marginTop: 6, gap: 12 }}>
            <TimelineRow
              color={staffColors.navy}
              title="Booking Start"
              detail="Initial 60-minute reservation reserved by Avishka."
              time="12:30 PM"
            />
            <TimelineRow
              color={staffColors.chipGreen}
              title="Checked In"
              detail="QR Verified by Staff (Counter A · K. Jayawardena)"
              time="12:36 PM"
            />
            <TimelineRow
              color="#2563EB"
              title="Extended End Time"
              detail="+15m digital extension approved by system."
              time="01:45 PM"
            />
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          style={[staffStyles.actionButton, { backgroundColor: staffColors.navy, marginTop: 4 }]}
          onPress={() =>
            router.push({ pathname: '/staff/verify', params: { bookingId: bookingId } })
          }
        >
          <Ionicons name="refresh-circle-outline" size={20} color="#FFF" />
          <Text style={staffStyles.actionButtonText}>View / Verify Booking</Text>
        </Pressable>
      </ScrollView>
      <StaffBottomNav activeTab="audit" />
    </SafeAreaView>
  );
}

function TimelineRow({
  color,
  title,
  detail,
  time,
}: {
  color: string;
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ alignItems: 'center', width: 14, paddingTop: 4 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: color,
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 13 }}>{title}</Text>
        <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{detail}</Text>
      </View>
      <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{time}</Text>
    </View>
  );
}
