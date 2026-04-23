import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';

export class DangerZone extends Phaser.GameObjects.Container {
  private readonly radiusValue: number;
  private readonly aura: Phaser.GameObjects.Arc;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly ripple: Phaser.GameObjects.Arc;
  private readonly emberDots: Phaser.GameObjects.Arc[] = [];
  private warningTween?: Phaser.Tweens.Tween;
  private rippleTween?: Phaser.Tweens.Tween;
  private flickerTween?: Phaser.Tweens.Tween;
  private activationTimer?: Phaser.Time.TimerEvent;
  private flickerTimer?: Phaser.Time.TimerEvent;
  private disposed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number) {
    super(scene, x, y);

    this.radiusValue = radius;
    this.aura = scene.add.circle(0, 0, radius + 16, 0xef4444, 0.08).setScale(0.92);
    this.base = scene.add.circle(0, 0, radius, 0xef4444, 0.24);
    this.ring = scene.add
      .circle(0, 0, radius + 2)
      .setStrokeStyle(4, 0xf87171, 0.72);
    this.ripple = scene.add
      .circle(0, 0, radius - 20)
      .setStrokeStyle(2, 0xfca5a5, 0.46)
      .setScale(0.88);

    this.add([this.aura, this.base, this.ring, this.ripple]);
    this.createEmberDots(scene);

    scene.add.existing(this);
    this.setDepth(6);
    this.setAlpha(1);
  }

  public startWarning(warningMs: number, onActivate: () => void): void {
    if (!this.canRunEffects()) {
      return;
    }

    this.stopAnimationState();
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
    this.applyWarningStyle();

    this.warningTween = this.scene.tweens.add({
      targets: [this.base, this.ring, this.aura],
      scaleX: balanceConfig.dangerZonePulseScale,
      scaleY: balanceConfig.dangerZonePulseScale,
      alpha: { from: 0.92, to: 0.66 },
      yoyo: true,
      repeat: -1,
      duration: balanceConfig.dangerZonePulseDuration,
      ease: 'Sine.easeInOut'
    });

    this.rippleTween = this.scene.tweens.add({
      targets: this.ripple,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: { from: 0.5, to: 0.14 },
      yoyo: true,
      repeat: -1,
      duration: Math.max(180, balanceConfig.dangerZonePulseDuration - 20),
      ease: 'Quad.easeInOut'
    });

    this.flickerTimer = this.scene.time.delayedCall(Math.max(0, warningMs - 260), () => {
      if (!this.canRunEffects()) {
        return;
      }

      this.startFinalFlicker();
    });

    this.activationTimer = this.scene.time.delayedCall(warningMs, () => {
      if (!this.canRunEffects()) {
        return;
      }

      this.stopAnimationState();
      this.applyImpactStyle();
      onActivate();
    });
  }

  public playImpact(durationMs = balanceConfig.dangerZoneImpactDuration): void {
    if (!this.canRunEffects()) {
      return;
    }

    this.applyImpactStyle();

    this.scene.tweens.add({
      targets: [this.aura, this.ripple],
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: durationMs,
      ease: 'Cubic.easeOut'
    });

    this.scene.tweens.add({
      targets: this.ring,
      scaleX: 1.18,
      scaleY: 1.18,
      alpha: 0,
      duration: durationMs,
      ease: 'Quad.easeOut'
    });
  }

  public playDissipate(durationMs = balanceConfig.dangerZoneFadeOutDuration): void {
    if (!this.canRunEffects()) {
      return;
    }

    this.stopAnimationState();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: durationMs,
      ease: 'Sine.easeOut'
    });
  }

  public getArea(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(this.x, this.y, this.radiusValue);
  }

  public getRadius(): number {
    return this.radiusValue;
  }

  public override destroy(fromScene?: boolean): void {
    this.disposed = true;
    this.stopAnimationState();
    super.destroy(fromScene);
  }

  private createEmberDots(scene: Phaser.Scene): void {
    const offsets = [
      new Phaser.Math.Vector2(-this.radiusValue * 0.5, -this.radiusValue * 0.16),
      new Phaser.Math.Vector2(this.radiusValue * 0.4, -this.radiusValue * 0.28),
      new Phaser.Math.Vector2(-this.radiusValue * 0.12, this.radiusValue * 0.38),
      new Phaser.Math.Vector2(this.radiusValue * 0.48, this.radiusValue * 0.16)
    ];

    offsets.forEach((offset) => {
      const dot = scene.add.circle(offset.x, offset.y, 4, 0xfca5a5, 0.44);
      this.emberDots.push(dot);
      this.add(dot);

      scene.tweens.add({
        targets: dot,
        alpha: { from: 0.2, to: 0.62 },
        scaleX: 1.15,
        scaleY: 1.15,
        yoyo: true,
        repeat: -1,
        duration: 260 + Phaser.Math.Between(0, 120),
        ease: 'Sine.easeInOut'
      });
    });
  }

  private applyWarningStyle(): void {
    this.base.setFillStyle(0xef4444, 0.24).setScale(1);
    this.ring.setStrokeStyle(4, 0xf87171, 0.76).setScale(1);
    this.aura.setFillStyle(0xef4444, 0.08).setScale(0.96);
    this.ripple.setStrokeStyle(2, 0xfca5a5, 0.46).setScale(0.9).setAlpha(0.52);
  }

  private applyImpactStyle(): void {
    this.base.setFillStyle(0xf87171, 0.44).setScale(1);
    this.ring.setStrokeStyle(5, 0xfef2f2, 0.96).setScale(1);
    this.aura.setFillStyle(0xef4444, 0.18).setScale(1);
    this.ripple.setStrokeStyle(3, 0xfef2f2, 0.74).setScale(1);
  }

  private startFinalFlicker(): void {
    if (!this.canRunEffects()) {
      return;
    }

    this.flickerTween?.stop();
    this.flickerTween = this.scene.tweens.add({
      targets: this.ring,
      alpha: { from: 0.96, to: 0.46 },
      duration: 70,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private stopAnimationState(): void {
    this.warningTween?.stop();
    this.warningTween = undefined;
    this.rippleTween?.stop();
    this.rippleTween = undefined;
    this.flickerTween?.stop();
    this.flickerTween = undefined;
    this.activationTimer?.destroy();
    this.activationTimer = undefined;
    this.flickerTimer?.destroy();
    this.flickerTimer = undefined;
  }

  private canRunEffects(): boolean {
    return Boolean(
      !this.disposed &&
        this.active &&
        this.scene &&
        this.scene.sys &&
        this.scene.sys.isActive()
    );
  }
}
