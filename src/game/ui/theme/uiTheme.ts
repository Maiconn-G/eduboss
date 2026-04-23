import { colorPalette } from './colorPalette';
import { componentTokens } from './componentTokens';
import { spacing } from './spacing';
import { typography } from './typography';

export const uiTheme = {
  colors: colorPalette,
  spacing,
  typography,
  radii: componentTokens.radii,
  borders: componentTokens.borders,
  shadows: componentTokens.shadows,
  panel: componentTokens.panel,
  button: componentTokens.button,
  progressBar: componentTokens.progressBar,
  difficulty: {
    containerWidth: 676,
    containerHeight: 146,
    cardWidth: 196,
    cardHeight: 78,
    cardGap: 16,
    compactContainerWidth: 326,
    compactContainerHeight: 126,
    compactCardWidth: 96,
    compactCardHeight: 58,
    compactCardGap: 10,
    sidebarContainerWidth: 184,
    sidebarContainerHeight: 416,
    sidebarCardWidth: 152,
    sidebarCardHeight: 86,
    sidebarCardGap: 16,
    hoverScale: 1.02,
    pressedScale: 0.98,
    selectedScale: 1.035,
    selectedBadgeRadius: 14,
    accentEasy: colorPalette.success,
    accentNormal: colorPalette.brand,
    accentHard: colorPalette.warning
  },
  panels: {
    hud: {
      fillColor: colorPalette.surfaceDark,
      fillAlpha: 0.92,
      accentColor: colorPalette.surfaceDarkRaised,
      borderColor: colorPalette.borderSoft,
      borderAlpha: 0.95
    },
    speech: {
      fillColor: colorPalette.surfaceDark,
      fillAlpha: 0.97,
      accentColor: colorPalette.surfaceDarkRaised,
      borderColor: colorPalette.borderSoft,
      borderAlpha: 0.95
    },
    light: {
      fillColor: colorPalette.surfaceLight,
      fillAlpha: 0.96,
      accentColor: colorPalette.surfaceLightMuted,
      borderColor: colorPalette.borderMuted,
      borderAlpha: 0.88
    },
    modal: {
      fillColor: colorPalette.surfaceDark,
      fillAlpha: 0.96,
      accentColor: colorPalette.surfaceDarkRaised,
      borderColor: colorPalette.borderSoft,
      borderAlpha: 0.96
    }
  },
  buttons: {
    primary: {
      fillColor: colorPalette.brandSoft,
      hoverColor: 0xbfdbfe,
      pressedColor: 0x93c5fd,
      disabledColor: 0xcbd5e1,
      borderColor: colorPalette.brand,
      borderHoverColor: 0x1d4ed8,
      borderDisabledColor: 0x94a3b8,
      textColor: colorPalette.textDark
    },
    secondary: {
      fillColor: 0xeff6ff,
      hoverColor: 0xdbeafe,
      pressedColor: 0xbfdbfe,
      disabledColor: 0xe2e8f0,
      borderColor: colorPalette.borderMuted,
      borderHoverColor: colorPalette.brand,
      borderDisabledColor: 0x94a3b8,
      textColor: colorPalette.textDark
    }
  }
} as const;

export type UiTheme = typeof uiTheme;
