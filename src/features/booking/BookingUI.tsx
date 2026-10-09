import { colors, fontSize, radius } from '@/constants/theme';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function BookingScreen({ title, subtitle, children, footer, onBack, headerRight, }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; onBack?: () => void; headerRight?: ReactNode;
}) {
  return (
    <SafeAreaView style={ui.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={ui.header}>
        {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={ui.back}><Text style={ui.backText}>‹</Text></Pressable> : null}
        <View style={ui.flex}><Text style={ui.title}>{title}</Text>{subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}</View>
        {headerRight}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView>
      {footer ? <View style={ui.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}
export function goBack() {
  if (router.canGoBack()) router.back(); else router.replace('/rooms');
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  if (!text) return null;
  return <View style={[ui.notice, error && ui.errorBox]}><Text accessibilityLiveRegion="polite" style={[ui.body, error && { color: colors.danger }]}>{text}</Text></View>;
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 32, color: colors.primary },
  flex: { flex: 1 },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.primary },
  heading: { fontSize: fontSize.section, fontWeight: '600', color: colors.primary },
  body: { fontSize: fontSize.bodySmall, color: colors.text, lineHeight: 21 },
  muted: { fontSize: fontSize.caption, color: colors.muted, lineHeight: 19 },
  label: { fontSize: fontSize.caption, fontWeight: '600', color: colors.muted, letterSpacing: 0.6 },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 10, backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { padding: 16, gap: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  notice: { padding: 12, gap: 6, borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  errorBox: { borderColor: colors.danger },
  chip: { minHeight: 44, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.white },
  success: { color: colors.success, fontSize: 12, fontWeight: '600' },
  warning: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
});
