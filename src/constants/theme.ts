// Source: Milestone 2 report, Appendix pages 24–25.

export const colors = {
  primary: '#0B2545',
  accent: '#F15A24',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  success: '#16A34A',
  danger: '#DC2626',
};

export const fontSize = {
  title: 24,
  section: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 14,
  countdown: 48,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Implementation choices: not specified numerically in the report.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};