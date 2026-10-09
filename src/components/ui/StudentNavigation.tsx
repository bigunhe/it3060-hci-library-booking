import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

const tabs = [
  { title: 'Rooms', route: '/rooms' },
  { title: 'My Passes', route: '/passes' },
  { title: 'Groups', route: '/groups' },
] as const;

// Parent must account for the bottom safe area; BookingScreen already does.
export function StudentNavigation({ active }: { active: 'Rooms' | 'My Passes' | 'Groups' }) {
  return <View style={styles.bar}>{tabs.map((tab) => (
    <Pressable key={tab.route} accessibilityRole="tab" accessibilityState={{ selected: active === tab.title }}
      onPress={() => { if (active !== tab.title) router.replace(tab.route); }} style={styles.tab}>
      <View style={[styles.indicator, active === tab.title && styles.selected]} />
      <Text style={[styles.text, active === tab.title && styles.activeText]}>{tab.title}</Text>
    </Pressable>
  ))}</View>;
}
const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 8 },
  indicator: { width: 24, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  selected: { backgroundColor: colors.primary },
  text: { fontSize: 12, color: colors.muted },
  activeText: { fontWeight: '600', color: colors.primary },
});
