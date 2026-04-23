export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 40
} as const;

export type SpacingScale = typeof spacing;
