import Phaser from 'phaser';
import { colorPalette } from './colorPalette';

export const typography = {
  fontFamily: 'Verdana',
  sizes: {
    xs: 13,
    sm: 15,
    md: 18,
    lg: 22,
    xl: 30,
    hero: 42
  },
  textStyles: {
    heroTitle: {
      fontFamily: 'Verdana',
      fontSize: '42px',
      color: colorPalette.textPrimary,
      fontStyle: 'bold'
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    panelTitle: {
      fontFamily: 'Verdana',
      fontSize: '18px',
      color: colorPalette.textAccent,
      fontStyle: 'bold'
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    sectionLabel: {
      fontFamily: 'Verdana',
      fontSize: '15px',
      color: colorPalette.textSecondary,
      fontStyle: 'bold'
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    body: {
      fontFamily: 'Verdana',
      fontSize: '18px',
      color: colorPalette.textPrimary
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    bodyMuted: {
      fontFamily: 'Verdana',
      fontSize: '16px',
      color: colorPalette.textSecondary
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    numeric: {
      fontFamily: 'Verdana',
      fontSize: '24px',
      color: '#fde68a',
      fontStyle: 'bold'
    } satisfies Phaser.Types.GameObjects.Text.TextStyle,
    button: {
      fontFamily: 'Verdana',
      fontSize: '22px',
      color: colorPalette.textDark,
      fontStyle: 'bold'
    } satisfies Phaser.Types.GameObjects.Text.TextStyle
  }
} as const;

export type TypographyTheme = typeof typography;
