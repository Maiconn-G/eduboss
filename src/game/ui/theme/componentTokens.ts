export const componentTokens = {
  radii: {
    panel: 22,
    button: 24,
    badge: 16,
    card: 18,
    progressBar: 14,
    modal: 28
  },
  borders: {
    standard: 2,
    subtle: 1
  },
  shadows: {
    offsetY: 6,
    alpha: 0.18
  },
  panel: {
    paddingX: 18,
    paddingY: 14
  },
  button: {
    paddingX: 24,
    paddingY: 16,
    hoverScale: 1.03,
    pressedScale: 0.98
  },
  progressBar: {
    shellPadding: 8,
    height: 22
  }
} as const;

export type ComponentTokens = typeof componentTokens;
