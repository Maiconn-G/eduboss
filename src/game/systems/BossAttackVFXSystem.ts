import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { BossProjectile } from '../entities/BossProjectile';
import { DangerZone } from '../entities/DangerZone';
import { FeedbackSystem } from './FeedbackSystem';

type ProjectileVisual = {
  aura: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  pulseTween?: Phaser.Tweens.Tween;
  lastTrailAt: number;
};

export class BossAttackVFXSystem {
  private readonly projectileVisuals = new Map<BossProjectile, ProjectileVisual>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly feedbackSystem: FeedbackSystem
  ) {}

  public trackProjectile(projectile: BossProjectile): void {
    const aura = this.scene.add
      .circle(projectile.x, projectile.y, 18, 0xf97316, 0.14)
      .setDepth(projectile.depth - 1);
    const glow = this.scene.add
      .circle(projectile.x, projectile.y, 12, 0xfef2f2, 0.22)
      .setDepth(projectile.depth - 1);

    const pulseTween = this.scene.tweens.add({
      targets: [aura, glow],
      scaleX: { from: 0.94, to: 1.08 },
      scaleY: { from: 0.94, to: 1.08 },
      alpha: { from: 0.18, to: 0.28 },
      yoyo: true,
      repeat: -1,
      duration: 120,
      ease: 'Sine.easeInOut'
    });

    this.projectileVisuals.set(projectile, {
      aura,
      glow,
      pulseTween,
      lastTrailAt: 0
    });
  }

  public playProjectileSpawnVFX(origin: Phaser.Math.Vector2, target: Phaser.Math.Vector2): void {
    const direction = target.clone().subtract(origin).normalize();
    const flash = this.scene.add.circle(origin.x, origin.y, 12, 0xfef2f2, 0.46).setDepth(13);
    const ring = this.scene.add
      .circle(origin.x, origin.y, 10)
      .setStrokeStyle(3, 0xfb7185, 0.82)
      .setDepth(13);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 1.45,
      scaleY: 1.45,
      alpha: 0,
      duration: balanceConfig.projectileSpawnVfxDuration,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.7,
      scaleY: 1.7,
      alpha: 0,
      duration: balanceConfig.projectileSpawnVfxDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    for (let index = 0; index < 6; index += 1) {
      const spark = this.scene.add.circle(origin.x, origin.y, 3, 0xfca5a5, 0.85).setDepth(13);
      const spread = direction.clone().rotate(Phaser.Math.FloatBetween(-0.55, 0.55));
      const distance = Phaser.Math.Between(20, 42);

      this.scene.tweens.add({
        targets: spark,
        x: origin.x + spread.x * distance,
        y: origin.y + spread.y * distance,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: balanceConfig.projectileSpawnVfxDuration,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  public playProjectileTrailVFX(projectile: BossProjectile): void {
    const visual = this.projectileVisuals.get(projectile);
    if (!visual) {
      return;
    }

    const now = this.scene.time.now;
    if (now - visual.lastTrailAt < balanceConfig.projectileTrailIntervalMs) {
      return;
    }

    visual.lastTrailAt = now;

    const velocity = projectile.getVelocityVector();
    if (velocity.lengthSq() <= 0.01) {
      return;
    }
    const offset = velocity.normalize().scale(-6);
    const trail = this.scene.add
      .circle(projectile.x + offset.x, projectile.y + offset.y, 6, 0xfb7185, 0.28)
      .setDepth(projectile.depth - 2);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.45,
      scaleY: 0.45,
      x: trail.x - offset.x * 0.6,
      y: trail.y - offset.y * 0.6,
      duration: balanceConfig.projectileTrailLifetime,
      ease: 'Quad.easeOut',
      onComplete: () => trail.destroy()
    });
  }

  public playProjectileImpactVFX(x: number, y: number, hitPlayer: boolean): void {
    const flash = this.scene.add.circle(x, y, 12, 0xfef2f2, 0.4).setDepth(14);
    const ring = this.scene.add.circle(x, y, 10).setStrokeStyle(3, 0xfb7185, 0.88).setDepth(14);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 1.55,
      scaleY: 1.55,
      alpha: 0,
      duration: balanceConfig.projectileImpactVfxDuration,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.1,
      scaleY: 2.1,
      alpha: 0,
      duration: balanceConfig.projectileImpactVfxDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    for (let index = 0; index < 8; index += 1) {
      const spark = this.scene.add.circle(x, y, 3, 0xf97316, 0.84).setDepth(14);
      const angle = Phaser.Math.DegToRad(index * 45 + Phaser.Math.Between(-10, 10));
      const distance = Phaser.Math.Between(16, 42);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.4,
        scaleY: 0.4,
        duration: balanceConfig.projectileImpactVfxDuration,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    this.feedbackSystem.playProjectileImpactFeedback(hitPlayer);
  }

  public playDangerZoneTelegraphVFX(zone: DangerZone): void {
    const ring = this.scene.add
      .circle(zone.x, zone.y, zone.getRadius() + 6)
      .setStrokeStyle(3, 0xfda4af, 0.58)
      .setDepth(zone.depth + 1);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0,
      duration: balanceConfig.dangerZonePulseDuration,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  public playDangerZonePulseVFX(zone: DangerZone): void {
    const halo = this.scene.add
      .circle(zone.x, zone.y, zone.getRadius() + 20, 0xef4444, 0.08)
      .setDepth(zone.depth - 1);

    this.scene.tweens.add({
      targets: halo,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0,
      duration: balanceConfig.dangerZonePulseDuration,
      ease: 'Quad.easeOut',
      onComplete: () => halo.destroy()
    });
  }

  public playDangerZoneImpactVFX(zone: DangerZone, hitPlayer: boolean): void {
    const x = zone.x;
    const y = zone.y;
    const shockwave = this.scene.add
      .circle(x, y, zone.getRadius() * 0.72)
      .setStrokeStyle(4, 0xfef2f2, 0.92)
      .setDepth(zone.depth + 2);
    const flash = this.scene.add
      .circle(x, y, zone.getRadius() * 0.42, 0xf87171, 0.36)
      .setDepth(zone.depth + 1);

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: balanceConfig.dangerZoneImpactDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => shockwave.destroy()
    });

    this.scene.tweens.add({
      targets: flash,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: balanceConfig.dangerZoneImpactDuration,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (let index = 0; index < 10; index += 1) {
      const particle = this.scene.add.circle(x, y, 4, 0xfb7185, 0.76).setDepth(zone.depth + 2);
      const angle = Phaser.Math.DegToRad(index * 36 + Phaser.Math.Between(-8, 8));
      const distance = Phaser.Math.Between(zone.getRadius() * 0.35, zone.getRadius() * 0.82);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.35,
        scaleY: 0.35,
        duration: balanceConfig.dangerZoneImpactDuration,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    this.feedbackSystem.playDangerZoneImpactFeedback(hitPlayer);
  }

  public playDangerZoneDissipateVFX(zone: DangerZone): void {
    const haze = this.scene.add
      .circle(zone.x, zone.y, zone.getRadius() + 8, 0xfda4af, 0.14)
      .setDepth(zone.depth);

    this.scene.tweens.add({
      targets: haze,
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: balanceConfig.dangerZoneFadeOutDuration,
      ease: 'Sine.easeOut',
      onComplete: () => haze.destroy()
    });
  }

  public update(): void {
    for (const [projectile, visual] of this.projectileVisuals.entries()) {
      if (!projectile.active) {
        this.cleanupProjectile(projectile);
        continue;
      }

      visual.aura.setPosition(projectile.x, projectile.y);
      visual.glow.setPosition(projectile.x, projectile.y);
      this.playProjectileTrailVFX(projectile);
    }
  }

  public untrackProjectile(projectile: BossProjectile): void {
    this.cleanupProjectile(projectile);
  }

  public destroy(): void {
    for (const projectile of this.projectileVisuals.keys()) {
      this.cleanupProjectile(projectile);
    }
  }

  private cleanupProjectile(projectile: BossProjectile): void {
    const visual = this.projectileVisuals.get(projectile);
    if (!visual) {
      return;
    }

    visual.pulseTween?.stop();
    visual.aura.destroy();
    visual.glow.destroy();
    this.projectileVisuals.delete(projectile);
  }
}
