import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import {
  colomboDateKey,
  formatColombo,
  todayColomboKey,
} from '@/features/staff/staffFormat';
import { loadStaffAuditEvents } from '@/features/staff/staffQueries';
import { staffStyles } from '@/features/staff/staffStyles';
import type { AuditEvent } from '@/types/models';

const ACTIONS = [
  'all',
  'confirmed',
  'checked_in',
  'extended',
  'checked_out',
  'cancelled',
  'expired',
  'force_released',
] as const;

type DateFilter = 'all' | 'today';

export default function StaffAudit() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [actionFilter, setActionFilter] = useState<(typeof ACTIONS)[number]>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError('');
      try {
        const records = await loadStaffAuditEvents(params.bookingId);
        if (!cancelled) setEvents(records);
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not load audit events.');
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.bookingId]);

  const visible = useMemo(() => {
    const today = todayColomboKey();
    return events.filter((event) => {
      const actionOk = actionFilter === 'all' || event.action === actionFilter;
      const dateOk =
        dateFilter === 'all' || colomboDateKey(event.createdAt) === today;
      return actionOk && dateOk;
    });
  }, [events, actionFilter, dateFilter]);

  return (
    <ScrollView style={staffStyles.screen} contentContainerStyle={staffStyles.content}>
      <Text style={staffStyles.title}>Audit log</Text>
      {params.bookingId ? (
        <Text style={staffStyles.muted}>Booking {params.bookingId}</Text>
      ) : (
        <Text style={staffStyles.muted}>Staff-visible action history. Records are not deleted.</Text>
      )}
      {busy ? <Text style={staffStyles.muted}>Loading...</Text> : null}
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      <Text style={staffStyles.body}>Date</Text>
      <View style={staffStyles.filterRow}>
        {(['all', 'today'] as const).map((value) => (
          <Pressable key={value} onPress={() => setDateFilter(value)}>
            <Text style={{ color: dateFilter === value ? colors.accent : colors.primary }}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={staffStyles.body}>Status / action</Text>
      <View style={staffStyles.filterRow}>
        {ACTIONS.map((value) => (
          <Pressable key={value} onPress={() => setActionFilter(value)}>
            <Text style={{ color: actionFilter === value ? colors.accent : colors.primary }}>
              {value.replaceAll('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      {visible.map((event) => (
        <View key={event.id} style={staffStyles.card}>
          <Text style={staffStyles.body}>{event.action.replaceAll('_', ' ')}</Text>
          <Text style={staffStyles.muted}>{formatColombo(event.createdAt)}</Text>
          <Text style={staffStyles.muted}>Booking: {event.bookingId}</Text>
          <Text style={staffStyles.muted}>Actor: {event.actorId}</Text>
        </View>
      ))}
      {!busy && visible.length === 0 ? (
        <Text style={staffStyles.muted}>No audit events match these filters.</Text>
      ) : null}
    </ScrollView>
  );
}
