import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, spacing } from '@/constants/theme';

export const staffColors = {
  page: '#F4F6F9',
  navy: '#0B1F4B',
  navySoft: '#162A5A',
  chipGreenBg: '#E8F8EE',
  chipGreen: '#067647',
  chipOrangeBg: '#FFF4E6',
  chipOrange: '#C45C26',
  chipRedBg: '#FDECEC',
  chipRed: '#B42318',
  chipNavyBg: '#E8EEF7',
  scanNavy: '#0C1B3A',
  borderLight: '#E5E9F0',
  textMuted: '#64748B',
};

export const staffStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staffColors.page,
  },
  screen: {
    flex: 1,
    backgroundColor: staffColors.page,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 24,
    gap: spacing.md,
  },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: staffColors.navy,
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: staffColors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  muted: {
    color: staffColors.textMuted,
    fontSize: fontSize.bodySmall,
  },
  error: {
    color: staffColors.chipRed,
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: staffColors.borderLight,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: staffColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: 14,
  },
  kicker: {
    color: staffColors.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  staffChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderColor: staffColors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  staffChipText: {
    color: staffColors.navy,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: staffColors.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  countTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  countValue: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staffColors.navy,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 34,
  },
  pillButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.bodySmall,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: staffColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
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

export function stateTone(state: string) {
  if (state === 'overstay') {
    return {
      border: '#F3C4C0',
      badgeBg: staffColors.chipRedBg,
      badgeText: staffColors.chipRed,
      accent: staffColors.chipRed,
    };
  }
  if (state === 'pending') {
    return {
      border: '#F6D5B8',
      badgeBg: staffColors.chipOrangeBg,
      badgeText: staffColors.chipOrange,
      accent: staffColors.chipOrange,
    };
  }
  if (state === 'active') {
    return {
      border: '#B9E4C9',
      badgeBg: staffColors.chipGreenBg,
      badgeText: staffColors.chipGreen,
      accent: staffColors.chipGreen,
    };
  }
  if (state === 'completed') {
    return {
      border: staffColors.borderLight,
      badgeBg: '#F1F5F9',
      badgeText: '#64748B',
      accent: '#64748B',
    };
  }
  return {
    border: staffColors.borderLight,
    badgeBg: staffColors.chipNavyBg,
    badgeText: staffColors.navy,
    accent: staffColors.navy,
  };
}
