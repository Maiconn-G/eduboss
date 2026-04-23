import Phaser from 'phaser';
import { uiTheme } from './uiTheme';

export type UiPanelVariant = keyof typeof uiTheme.panels;
export type UiButtonVariant = keyof typeof uiTheme.buttons;
export type UiTextKind =
  | 'heroTitle'
  | 'panelTitle'
  | 'sectionLabel'
  | 'body'
  | 'bodyMuted'
  | 'numeric'
  | 'button';

export function getTextStyle(
  kind: UiTextKind,
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    ...uiTheme.typography.textStyles[kind],
    ...overrides
  };
}

export function drawPanelShadow(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  radius: number = uiTheme.radii.panel,
  alpha: number = uiTheme.shadows.alpha,
  offsetY: number = uiTheme.shadows.offsetY
): void {
  const left = -width / 2;
  const top = -height / 2;

  graphics.clear();
  graphics.fillStyle(uiTheme.colors.shadow, alpha);
  graphics.fillRoundedRect(left, top + offsetY, width, height, radius);
}

export function drawPanelSurface(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  variant: UiPanelVariant,
  radius: number = uiTheme.radii.panel
): void {
  const palette = uiTheme.panels[variant];
  const left = -width / 2;
  const top = -height / 2;

  graphics.clear();
  graphics.fillStyle(palette.fillColor, palette.fillAlpha);
  graphics.lineStyle(uiTheme.borders.standard, palette.borderColor, palette.borderAlpha);
  graphics.fillRoundedRect(left, top, width, height, radius);
  graphics.strokeRoundedRect(left, top, width, height, radius);
}

export function drawButtonSurface(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  variant: UiButtonVariant,
  state: 'normal' | 'hover' | 'pressed' | 'disabled'
): void {
  const palette = uiTheme.buttons[variant];
  const left = -width / 2;
  const top = -height / 2;

  const fillColor =
    state === 'pressed'
      ? palette.pressedColor
      : state === 'hover'
        ? palette.hoverColor
        : state === 'disabled'
          ? palette.disabledColor
          : palette.fillColor;

  const borderColor =
    state === 'disabled'
      ? palette.borderDisabledColor
      : state === 'hover' || state === 'pressed'
        ? palette.borderHoverColor
        : palette.borderColor;

  graphics.clear();
  graphics.fillStyle(fillColor, 1);
  graphics.lineStyle(uiTheme.borders.standard, borderColor, 1);
  graphics.fillRoundedRect(left, top, width, height, uiTheme.radii.button);
  graphics.strokeRoundedRect(left, top, width, height, uiTheme.radii.button);
}
