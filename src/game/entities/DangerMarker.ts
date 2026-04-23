import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';

export class DangerMarker extends Phaser.GameObjects.Ellipse {
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number) {
    super(
      scene,
      x,
      y,
      radius * 2,
      radius * 1.08,
      0xef4444,
      balanceConfig.smashTelegraphAlpha
    );

    scene.add.existing(this);

    this.setDepth(20);
    this.setStrokeStyle(3, 0xfca5a5, 0.85);
  }

  public playPulse(): void {
    this.stopPulse();
    this.setScale(1);
    this.setAlpha(balanceConfig.smashTelegraphAlpha);

    this.pulseTween = this.scene.tweens.add({
      targets: this,
      scaleX: balanceConfig.smashTelegraphPulseScale,
      scaleY: balanceConfig.smashTelegraphPulseScale,
      alpha: Math.min(balanceConfig.smashTelegraphAlpha + 0.14, 0.85),
      yoyo: true,
      repeat: -1,
      duration: 180,
      ease: 'Sine.easeInOut'
    });
  }

  public stopPulse(): void {
    this.pulseTween?.stop();
    this.pulseTween = undefined;
  }

  public dispose(): void {
    this.stopPulse();
    this.destroy();
  }
}
