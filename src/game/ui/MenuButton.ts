import Phaser from 'phaser';
import { UiButton } from './UiButton';
import { menuMotion } from './theme/menuMotion';
import { uiTheme } from './theme/uiTheme';

export class MenuButton extends UiButton {
  private readonly pulseRing: Phaser.GameObjects.Graphics;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void) {
    super(scene, x, y, {
      label,
      width: 286,
      height: 72,
      depth: 30,
      variant: 'primary',
      hoverScale: menuMotion.menuButtonHoverScale,
      pressedScale: menuMotion.menuButtonPressedScale,
      onClick
    });

    this.pulseRing = scene.add.graphics();
    this.addAt(this.pulseRing, 0);
    this.redrawPulseRing();
  }

  public startPrimaryPulse(): void {
    this.stopPrimaryPulse();

    this.pulseTween = this.scene.tweens.add({
      targets: this.pulseRing,
      alpha: { from: 0.3, to: 0.08 },
      scaleX: { from: 1, to: menuMotion.menuButtonPulseScale },
      scaleY: { from: 1, to: menuMotion.menuButtonPulseScale },
      duration: menuMotion.menuButtonPulseDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public stopPrimaryPulse(): void {
    this.pulseTween?.stop();
    this.pulseTween = undefined;
    this.pulseRing.setAlpha(0.18);
    this.pulseRing.setScale(1);
  }

  public override destroy(fromScene?: boolean): void {
    this.stopPrimaryPulse();
    super.destroy(fromScene);
  }

  private redrawPulseRing(): void {
    const width = this.getButtonWidth() + 16;
    const height = this.getButtonHeight() + 12;
    const left = -width / 2;
    const top = -height / 2;

    this.pulseRing.clear();
    this.pulseRing.fillStyle(uiTheme.colors.brand, 0.14);
    this.pulseRing.lineStyle(2, uiTheme.colors.brandHover, 0.32);
    this.pulseRing.fillRoundedRect(left, top, width, height, uiTheme.radii.button + 4);
    this.pulseRing.strokeRoundedRect(left, top, width, height, uiTheme.radii.button + 4);
    this.pulseRing.setAlpha(0.18);
  }
}
