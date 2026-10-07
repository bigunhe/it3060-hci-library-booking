import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
}

const backgrounds: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
};

const labels: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  danger: colors.white,
};

export function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: AppButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.button,
        { backgroundColor: backgrounds[variant], opacity: inactive ? 0.5 : 1 },
        variant === 'secondary' ? styles.secondaryBorder : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labels[variant]} />
      ) : (
        <Text style={[styles.label, { color: labels[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
