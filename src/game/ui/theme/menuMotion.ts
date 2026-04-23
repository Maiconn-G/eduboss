export const menuMotion = {
  menuFadeInDuration: 420,
  menuFadeOutDuration: 220,
  menuPanelSlideDistance: 20,
  menuButtonHoverScale: 1.035,
  menuButtonPressedScale: 0.97,
  menuButtonPulseScale: 1.018,
  menuButtonPulseDuration: 1450,
  menuTitleFloatDistance: 5,
  menuTitleFloatDuration: 2600,
  menuStaggerDelay: 80,
  menuRowCascadeDelay: 48,
  menuOutroScale: 0.985
} as const;

export type MenuMotionConfig = typeof menuMotion;
