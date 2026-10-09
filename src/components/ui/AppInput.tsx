import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '@/constants/theme';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({
  label,
  error,
  style,
  onFocus,
  onBlur,
  accessibilityLabel,
  placeholderTextColor,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={placeholderTextColor ?? colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          focused && styles.focused,
          props.multiline && styles.multiline,
          style,
          error ? styles.invalid : undefined,
        ]}
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  focused: {
    borderColor: colors.primary,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  invalid: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
  },
});