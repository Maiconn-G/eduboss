import Phaser from 'phaser';
import { uiTheme } from './theme/uiTheme';

export type UiBadgeVariant =
  | 'primary'
  | 'muted'
  | 'collected'
  | 'submitted'
  | 'correct'
  | 'wrong';

type BadgePalette = {
  outer: number;
  outerAlpha: number;
  inner: number;
  innerAlpha: number;
  stroke: number;
  text: string;
};

const badgePalettes: Record<UiBadgeVariant, BadgePalette> = {
  primary: {
    outer: uiTheme.colors.brandSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.brand,
    innerAlpha: 1,
    stroke: uiTheme.colors.brandHover,
    text: '#eff6ff'
  },
  muted: {
    outer: uiTheme.colors.neutralSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.neutral,
    innerAlpha: 1,
    stroke: uiTheme.colors.borderSoft,
    text: uiTheme.colors.textPrimary
  },
  collected: {
    outer: uiTheme.colors.brandSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.brand,
    innerAlpha: 1,
    stroke: uiTheme.colors.brandHover,
    text: '#eff6ff'
  },
  submitted: {
    outer: uiTheme.colors.warningSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.warning,
    innerAlpha: 1,
    stroke: 0xfcd34d,
    text: '#fff7ed'
  },
  correct: {
    outer: uiTheme.colors.successSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.success,
    innerAlpha: 1,
    stroke: 0x4ade80,
    text: '#f0fdf4'
  },
  wrong: {
    outer: uiTheme.colors.dangerSoft,
    outerAlpha: 1,
    inner: uiTheme.colors.danger,
    innerAlpha: 1,
    stroke: 0xf87171,
    text: '#fff1f2'
  }
};

export class UiBadge extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly outerRing: Phaser.GameObjects.Arc;
  private readonly innerCore: Phaser.GameObjects.Arc;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly radius: number;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, radius = 16) {
    super(scene, x, y);

    this.radius = radius;
    this.shadow = scene.add.ellipse(0, radius + 4, radius * 1.6, radius * 0.72, uiTheme.colors.shadow, 0.12);
    this.outerRing = scene.add
      .circle(0, 0, radius, uiTheme.colors.brandSoft, 1)
      .setStrokeStyle(2, uiTheme.colors.brandHover, 1);
    this.innerCore = scene.add.circle(0, 0, radius - 5, uiTheme.colors.brand, 1);
    this.labelText = scene.add
      .text(0, 0, label.toUpperCase(), {
        fontFamily: uiTheme.typography.fontFamily,
        fontSize: `${Math.max(14, radius)}px`,
        color: '#eff6ff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add([this.shadow, this.outerRing, this.innerCore, this.labelText]);
    scene.add.existing(this);
    this.setVariant('primary');
  }

  public setVariant(variant: UiBadgeVariant): void {
    const palette = badgePalettes[variant];
    this.outerRing.setFillStyle(palette.outer, palette.outerAlpha);
    this.outerRing.setStrokeStyle(2, palette.stroke, 1);
    this.innerCore.setFillStyle(palette.inner, palette.innerAlpha);
    this.labelText.setColor(palette.text);
  }

  public setShadowAlpha(alpha: number): void {
    this.shadow.setAlpha(alpha);
  }

  public getRadius(): number {
    return this.radius;
  }
}
