import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import { Cannon } from '../entities/Cannon';
import { DangerMarker } from '../entities/DangerMarker';
import { Player } from '../entities/Player';

export class FeedbackSystem {
  private hitStopTimer?: Phaser.Time.TimerEvent;
  private hitStopActive = false;

  constructor(private readonly scene: Phaser.Scene) {}

  public playDamageFeedback(player: Player): void {
    player.setTintFill(0xffffff);
    this.scene.cameras.main.shake(150, 0.005);

    this.scene.time.delayedCall(100, () => {
      if (player.active) {
        player.clearTint();
      }
    });
  }

  public playBossHitFeedback(boss: Boss): void {
    const baseScaleX = boss.scaleX;
    const baseScaleY = boss.scaleY;
    boss.setHitFlash(true);
    this.scene.tweens.killTweensOf(boss);
    boss.setScale(baseScaleX, baseScaleY);

    this.scene.tweens.add({
      targets: boss,
      scaleX: baseScaleX * 1.06,
      scaleY: baseScaleY * 1.06,
      yoyo: true,
      duration: 110,
      onComplete: () => {
        if (boss.active) {
          boss.setScale(baseScaleX, baseScaleY);
        }
      }
    });

    this.scene.time.delayedCall(100, () => {
      if (boss.active) {
        boss.setHitFlash(false);
      }
    });
  }

  public playWrongAnswerFeedback(): void {
    this.showFloatingTextAt('ERRO!', '#ef4444', this.scene.scale.width / 2, 228);
  }

  public playCorrectAnswerFeedback(): void {
    this.showFloatingTextAt('ACERTO!', '#22c55e', this.scene.scale.width / 2, 228);
  }

  public playCannonFireFeedback(cannon: Cannon): void {
    cannon.playFireAnimation();
  }

  public playSmashTelegraphFeedback(marker: DangerMarker): void {
    marker.playPulse();
  }

  public playProjectileImpactFeedback(hitPlayer: boolean): void {
    if (hitPlayer) {
      this.scene.cameras.main.shake(110, 0.004);
    }
  }

  public playDangerZoneImpactFeedback(hitPlayer: boolean): void {
    this.scene.cameras.main.shake(hitPlayer ? 140 : 110, hitPlayer ? 0.006 : 0.0035);
  }

  public playSmashImpactFeedback(x: number, y: number): void {
    const flash = this.scene.add
      .rectangle(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height,
        0xffffff,
        0.1
      )
      .setDepth(95);

    const impactRing = this.scene.add
      .circle(x, y, 24, 0xf97316, 0.3)
      .setStrokeStyle(4, 0xfef2f2, 0.9)
      .setDepth(94);

    this.playCameraShakeHeavy();
    this.playHitStopShort(95);
    this.showFloatingTextAt('SMASH!', '#fb923c', x, y - 80);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 140,
      onComplete: () => flash.destroy()
    });

    this.scene.tweens.add({
      targets: impactRing,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => impactRing.destroy()
    });
  }

  public playCameraShakeHeavy(): void {
    this.scene.cameras.main.shake(220, 0.012);
  }

  public playHitStopShort(durationMs = 80): void {
    this.applyHitStop(durationMs);
  }

  public applyHitStop(durationMs = 80): void {
    if (this.hitStopActive) {
      return;
    }

    this.hitStopActive = true;
    this.scene.physics.world.pause();

    this.hitStopTimer?.destroy();
    this.hitStopTimer = this.scene.time.delayedCall(durationMs, () => {
      this.hitStopActive = false;
      this.hitStopTimer = undefined;

      if (!this.scene.sys.isActive()) {
        return;
      }

      this.scene.physics.world.resume();
    });
  }

  public cancelHitStop(): void {
    this.hitStopTimer?.destroy();
    this.hitStopTimer = undefined;
    this.hitStopActive = false;
  }

  private showFloatingTextAt(text: string, color: string, x: number, y: number): void {
    const feedbackText = this.scene.add
      .text(x, y, text, {
        fontFamily: 'Verdana',
        fontSize: '34px',
        color,
        fontStyle: 'bold',
        stroke: '#0f172a',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(70);

    this.scene.tweens.add({
      targets: feedbackText,
      y: y - 50,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => {
        feedbackText.destroy();
      }
    });
  }
}
