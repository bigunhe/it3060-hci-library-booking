import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

export const staffStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.primary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  body: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  muted: {
    color: colors.muted,
    fontSize: fontSize.bodySmall,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.bodySmall,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

export function badgeColor(state: string): string {
  if (state === 'overstay' || state === 'expired' || state === 'cancelled') {
    return colors.danger;
  }
  if (state === 'active' || state === 'checked_in' || state === 'available') {
    return colors.success;
  }
  if (state === 'pending' || state === 'confirmed') {
    return colors.accent;
  }
  return colors.muted;
}
