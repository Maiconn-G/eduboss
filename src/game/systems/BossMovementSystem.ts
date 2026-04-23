import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { Boss } from '../entities/Boss';

export class BossMovementSystem {
  private readonly defaultX: number;
  private patrolEnabled = false;
  private patrolDirection = 1;
  private activeTween?: Phaser.Tweens.Tween;
  private activeDelay?: Phaser.Time.TimerEvent;
  private motionResolver?: (completed: boolean) => void;
  private disposed = false;

  constructor(private readonly scene: Phaser.Scene, private readonly boss: Boss) {
    this.defaultX = boss.x;
  }

  public startPatrol(): void {
    if (this.patrolEnabled || !this.canControlBoss()) {
      return;
    }

    this.patrolEnabled = true;
    this.schedulePatrolStep();
  }

  public stopPatrol(): void {
    this.patrolEnabled = false;
    this.clearMotion(true, false);
    if (this.canControlBoss()) {
      this.boss.playIdle();
    }
  }

  public pausePatrol(): boolean {
    const wasPatrolling = this.patrolEnabled;
    this.patrolEnabled = false;
    this.clearMotion(true, false);
    return wasPatrolling;
  }

  public resumePatrol(shouldResume: boolean): void {
    if (shouldResume) {
      this.startPatrol();
    }
  }

  public interruptMotion(): void {
    this.clearMotion(true, false);
  }

  public dispose(): void {
    this.disposed = true;
    this.patrolEnabled = false;
    this.clearMotion(true, false);
  }

  public async moveTo(position: Phaser.Math.Vector2, speed: number): Promise<boolean> {
    if (!this.canControlBoss()) {
      return false;
    }

    this.clearMotion(true, false);

    const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, position.x, position.y);
    if (distance <= 2) {
      this.boss.setPosition(position.x, position.y);
      if (!this.patrolEnabled && this.canControlBoss()) {
        this.boss.playIdle();
      }

      return true;
    }

    this.updateFacing(position.x);
    this.boss.playFly();

    const completed = await new Promise<boolean>((resolve) => {
      this.motionResolver = resolve;
      this.activeTween = this.scene.tweens.add({
        targets: this.boss,
        x: position.x,
        y: position.y,
        duration: Math.max(120, (distance / speed) * 1000),
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.activeTween = undefined;
          const done = this.motionResolver;
          this.motionResolver = undefined;
          done?.(true);
        }
      });
    });

    if (!completed || !this.canControlBoss()) {
      return false;
    }

    if (!this.patrolEnabled) {
      this.boss.playIdle();
    }

    return true;
  }

  public moveToOverDuration(
    position: Phaser.Math.Vector2,
    durationMs: number
  ): Promise<boolean> {
    if (!this.canControlBoss()) {
      return Promise.resolve(false);
    }

    this.clearMotion(true, false);

    const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, position.x, position.y);
    if (distance <= 2) {
      this.boss.setPosition(position.x, position.y);
      if (!this.patrolEnabled && this.canControlBoss()) {
        this.boss.playIdle();
      }

      return Promise.resolve(true);
    }

    this.updateFacing(position.x);
    this.boss.playFly();

    return new Promise<boolean>((resolve) => {
      this.motionResolver = resolve;
      this.activeTween = this.scene.tweens.add({
        targets: this.boss,
        x: position.x,
        y: position.y,
        duration: Math.max(120, durationMs),
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.activeTween = undefined;
          const done = this.motionResolver;
          this.motionResolver = undefined;
          done?.(true);
        }
      });
    }).then((completed) => {
      if (completed && !this.patrolEnabled && this.canControlBoss()) {
        this.boss.playIdle();
      }

      return completed;
    });
  }

  public moveToX(
    targetX: number,
    speed: number = balanceConfig.bossMoveSpeed
  ): Promise<boolean> {
    return this.moveTo(
      new Phaser.Math.Vector2(targetX, balanceConfig.bossHoverY),
      speed
    );
  }

  public returnToHover(targetX: number = this.defaultX): Promise<boolean> {
    return this.moveTo(
      new Phaser.Math.Vector2(targetX, balanceConfig.bossHoverY),
      balanceConfig.bossMoveSpeed
    );
  }

  private schedulePatrolStep(): void {
    if (!this.patrolEnabled || !this.canControlBoss()) {
      return;
    }

    const targetX =
      this.patrolDirection > 0
        ? balanceConfig.bossFlightRightLimit
        : balanceConfig.bossFlightLeftLimit;

    void this.moveToX(targetX).then((completed) => {
      if (!completed || !this.patrolEnabled) {
        return;
      }

      if (!this.canControlBoss()) {
        return;
      }

      this.boss.playIdle();
      this.patrolDirection *= -1;
      this.activeDelay = this.scene.time.delayedCall(220, () => {
        this.activeDelay = undefined;
        this.schedulePatrolStep();
      });
    });
  }

  private clearMotion(resolvePending: boolean, completed: boolean): void {
    this.activeTween?.stop();
    this.activeTween = undefined;
    this.activeDelay?.destroy();
    this.activeDelay = undefined;

    if (resolvePending && this.motionResolver) {
      const done = this.motionResolver;
      this.motionResolver = undefined;
      done(completed);
    }
  }

  private updateFacing(targetX: number): void {
    if (!this.canControlBoss()) {
      return;
    }

    const direction = targetX - this.boss.x;
    this.boss.setFacingDirection(direction);
  }

  private canControlBoss(): boolean {
    return Boolean(
      !this.disposed &&
        this.boss.active &&
        this.scene &&
        this.scene.sys &&
        this.scene.sys.isActive()
    );
  }
}
