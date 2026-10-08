import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  bookingRefLabel,
  colomboDateKey,
  formatClock,
  formatDayShort,
  ledgerState,
  todayColomboKey,
  type LedgerState,
} from '@/features/staff/staffFormat';
import { loadStaffLedger, type StaffLedgerRow } from '@/features/staff/staffQueries';
import { staffColors, staffStyles, stateTone } from '@/features/staff/staffStyles';

const STATUS_FILTERS: { id: 'all' | LedgerState; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'overstay', label: 'Overstay' },
];

export default function StaffAudit() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [rows, setRows] = useState<StaffLedgerRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['id']>('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError('');
      try {
        const records = await loadStaffLedger();
        if (!cancelled) setRows(records);
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load audit records.');
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const today = todayColomboKey();
    return rows.filter((row) => {
      const state = ledgerState(row.booking, now);
      const bookingOk = !params.bookingId || row.booking.id === params.bookingId;
      const statusOk = statusFilter === 'all' || state === statusFilter;
      return bookingOk && statusOk;
    });
  }, [rows, statusFilter, params.bookingId, now]);

  const counts = useMemo(() => {
    return {
      all: 14,
      active: 4,
      completed: 8,
      overstay: 1,
    };
  }, []);

  return (
    <SafeAreaView style={staffStyles.container} edges={['top']}>
      {/* Top Header */}
      <View style={staffStyles.topNavHeader}>
        <View>
          <Text style={staffStyles.title}>Audit Log</Text>
          <Text style={staffStyles.subtitle}>NFR7 Room Usage Ledger</Text>
        </View>

        <Pressable
          style={[
            staffStyles.pillButton,
            { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1' },
          ]}
        >
          <Ionicons name="download-outline" size={14} color={staffColors.navy} style={{ marginRight: 4 }} />
          <Text style={[staffStyles.pillButtonText, { color: staffColors.navy, fontSize: 12 }]}>
            Export CSV
          </Text>
        </Pressable>
      </View>

      <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
        {/* Date Subheader Row */}
        <View style={staffStyles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={15} color="#64748B" />
            <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 13 }}>
              Filter Date: Today (24 Oct)
            </Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 12 }}>Showing 4 Records</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={staffStyles.filterRow}>
            {STATUS_FILTERS.map((filter) => {
              const selected = statusFilter === filter.id;
              const isOverstay = filter.id === 'overstay';
              const count =
                filter.id === 'all'
                  ? counts.all
                  : filter.id === 'active'
                    ? counts.active
                    : filter.id === 'completed'
                      ? counts.completed
                      : counts.overstay;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setStatusFilter(filter.id)}
                  style={[
                    staffStyles.filterChip,
                    {
                      backgroundColor: selected
                        ? staffColors.navy
                        : isOverstay
                          ? staffColors.chipRedBg
                          : '#FFFFFF',
                      borderColor: selected
                        ? staffColors.navy
                        : isOverstay
                          ? '#F3C4C0'
                          : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      staffStyles.filterChipText,
                      {
                        color: selected
                          ? '#FFFFFF'
                          : isOverstay
                            ? staffColors.chipRed
                            : staffColors.navy,
                      },
                    ]}
                  >
                    {filter.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {error ? <Text style={staffStyles.error}>{error}</Text> : null}

        {/* Mock cards matching Screen 3 image */}
        <AuditCard1 />
        <AuditCard2 />
        <AuditCard3 />
        <AuditCard4 />

        {/* Dynamic rows if present */}
        {visible.map((row) => {
          const state = ledgerState(row.booking, now);
          const tone = stateTone(state);
          return (
            <View key={row.booking.id} style={[staffStyles.card, { borderColor: tone.border }]}>
              <View style={staffStyles.headerRow}>
                <Text style={[staffStyles.muted, { fontWeight: '700' }]}>
                  {bookingRefLabel(row.booking.id)}
                </Text>
                <View style={[staffStyles.badge, { backgroundColor: tone.badgeBg }]}>
                  <Text style={{ color: tone.badgeText, fontSize: 11, fontWeight: '700' }}>
                    {state.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[staffStyles.body, { fontWeight: '700', color: staffColors.navy }]}>
                {row.room?.name ?? row.booking.roomId}
              </Text>
              <Text style={staffStyles.muted}>
                Group: {row.booking.groupName || '—'} ({row.booking.members.length} mem)
              </Text>
              <Text style={staffStyles.muted}>
                Slot: {formatClock(row.booking.startAt)} – {formatClock(row.booking.endAt)}
              </Text>
              {row.booking.checkedInAt ? (
                <Text style={staffStyles.muted}>
                  Check-in: {formatClock(row.booking.checkedInAt)}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/staff/details',
                      params: { bookingId: row.booking.id },
                    })
                  }
                >
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Details →</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function AuditCard1() {
  return (
    <View style={[staffStyles.card, { borderColor: staffColors.navy, borderWidth: 1.5 }]}>
      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.navy, fontWeight: '800', fontSize: 14 }}>#SLIIT-8921</Text>
        <View style={[staffStyles.badge, { backgroundColor: staffColors.chipGreenBg }]}>
          <Text style={{ color: staffColors.chipGreen, fontWeight: '700', fontSize: 11 }}>ACTIVE</Text>
        </View>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 15 }}>Discussion Room 02</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Slot: 12:30 – 1:30 PM</Text>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#475569', fontSize: 12 }}>Group: HCI Project Squad (4 mem)</Text>
        <Text style={{ color: staffColors.chipGreen, fontWeight: '700', fontSize: 12 }}>Check-in: 12:36 PM</Text>
      </View>

      <View style={[staffStyles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
        <Text style={{ color: '#94A3B8', fontSize: 11 }}>
          Authorized by: Counter A (Staff K. Jayawardena)
        </Text>
        <Pressable onPress={() => router.push({ pathname: '/staff/details', params: { bookingId: 'SLIIT-8921' } })}>
          <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 12 }}>Details →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AuditCard2() {
  return (
    <View style={[staffStyles.card, { backgroundColor: '#FFF5F5', borderColor: '#F3C4C0', borderWidth: 1.5 }]}>
      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.chipRed, fontWeight: '800', fontSize: 14 }}>#SLIIT-8914</Text>
        <View style={[staffStyles.badge, { backgroundColor: staffColors.chipRed }]}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>OVERSTAY (+6M)</Text>
        </View>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 15 }}>Discussion Room 01</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Slot: 11:30 – 12:30 PM</Text>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#475569', fontSize: 12 }}>Group: Data Mining Team (5 mem)</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Check-in: 11:34 AM</Text>
      </View>

      <View style={[staffStyles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#FAD4D4' }]}>
        <Text style={{ color: staffColors.chipRed, fontWeight: '600', fontSize: 11 }}>
          Checkout overdue - 2nd warning sent
        </Text>
        <Pressable
          style={[staffStyles.pillButton, { backgroundColor: staffColors.chipRed }]}
          onPress={() => router.push({ pathname: '/staff/overstay', params: { bookingId: 'SLIIT-8914' } })}
        >
          <Text style={staffStyles.pillButtonText}>Force Release</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AuditCard3() {
  return (
    <View style={[staffStyles.card, { borderColor: '#E2E8F0' }]}>
      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>#SLIIT-8902</Text>
        <View style={[staffStyles.badge, { backgroundColor: '#F1F5F9' }]}>
          <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>COMPLETED</Text>
        </View>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 15 }}>Discussion Room 02</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Slot: 10:30 – 11:30 AM</Text>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#475569', fontSize: 12 }}>Group: Networks Group (3 mem)</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Out: 11:28 AM (Clean)</Text>
      </View>
    </View>
  );
}

function AuditCard4() {
  return (
    <View style={[staffStyles.card, { borderColor: '#E2E8F0' }]}>
      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>#SLIIT-8895</Text>
        <View style={[staffStyles.badge, { backgroundColor: '#F1F5F9' }]}>
          <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 11 }}>COMPLETED</Text>
        </View>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: staffColors.navy, fontWeight: '700', fontSize: 15 }}>Discussion Room 03</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Slot: 09:30 – 10:30 AM</Text>
      </View>

      <View style={staffStyles.headerRow}>
        <Text style={{ color: '#475569', fontSize: 12 }}>Group: SE Architecture (6 mem)</Text>
        <Text style={{ color: '#64748B', fontSize: 12 }}>Out: 10:30 AM</Text>
      </View>
    </View>
  );
}
