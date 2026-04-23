import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { DifficultySettings } from '../config/difficultyConfig';
import { Boss } from '../entities/Boss';
import { DangerMarker } from '../entities/DangerMarker';
import { Player } from '../entities/Player';
import { BossMovementSystem } from './BossMovementSystem';
import { FeedbackSystem } from './FeedbackSystem';

export type SmashAttackState =
  | 'idle'
  | 'tracking'
  | 'telegraph'
  | 'windup'
  | 'falling'
  | 'impact'
  | 'recovery'
  | 'return_to_hover'
  | 'finished';

export type SmashAttackStartParams = {
  player: Player;
  impactY: number;
  canContinue: () => boolean;
  damagePlayer: (amount: number) => void;
  clampImpactX?: (x: number) => number;
};

type ManagedWait = {
  event: Phaser.Time.TimerEvent;
  resolve: (completed: boolean) => void;
};

export class SmashAttackSystem {
  private state: SmashAttackState = 'idle';
  private running = false;
  private executionToken = 0;
  private activeMarker?: DangerMarker;
  private pendingWaits = new Set<ManagedWait>();
  private cancellationResolvers = new Set<() => void>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boss: Boss,
    private readonly bossMovementSystem: BossMovementSystem,
    private readonly feedbackSystem: FeedbackSystem,
    private readonly difficulty: Pick<
      DifficultySettings,
      | 'smashTelegraphDurationMs'
      | 'smashImpactRadius'
      | 'smashDamage'
      | 'smashFallSpeed'
      | 'smashTrackingTolerance'
    >
  ) {}

  public getState(): SmashAttackState {
    return this.state;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public async start(params: SmashAttackStartParams): Promise<void> {
    this.cancel();

    this.running = true;
    this.executionToken += 1;
    const token = this.executionToken;
    const returnX = this.boss.x;
    const shouldResumePatrol = this.bossMovementSystem.pausePatrol();

    try {
      if (!this.canProceed(token, params.canContinue)) {
        return;
      }

      const targetX = params.clampImpactX
        ? params.clampImpactX(params.player.x)
        : params.player.x;

      this.transitionTo('tracking');
      const tracked = await this.awaitTask(
        this.bossMovementSystem.moveToX(targetX, balanceConfig.smashTrackSpeed),
        token
      );
      if (!tracked || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('telegraph');
      this.boss.playFly();
      this.activeMarker = new DangerMarker(
        this.scene,
        targetX,
        params.impactY,
        this.difficulty.smashImpactRadius
      );
      this.feedbackSystem.playSmashTelegraphFeedback(this.activeMarker);

      const telegraphFinished = await this.waitFor(this.difficulty.smashTelegraphDurationMs, token);
      if (!telegraphFinished || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('windup');
      const windupStarted = await this.awaitTask(this.boss.playSmashStartAnimation(), token);
      if (!windupStarted || !this.canProceed(token, params.canContinue)) {
        return;
      }

      const windupFinished = await this.waitFor(balanceConfig.smashWindupDurationMs, token);
      if (!windupFinished || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('falling');
      this.boss.playSmashLoopAnimation();
      const fell = await this.awaitTask(
        this.bossMovementSystem.moveTo(
          new Phaser.Math.Vector2(targetX, this.boss.getSmashImpactY(params.impactY)),
          this.difficulty.smashFallSpeed
        ),
        token
      );
      if (!fell || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('impact');
      this.clearMarker();
      this.feedbackSystem.playSmashImpactFeedback(targetX, params.impactY);
      this.applyImpactDamage(params.player, targetX, params.damagePlayer);

      const impactFinished = await this.awaitTask(this.boss.playSmashEndAnimation(), token);
      if (!impactFinished || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('recovery');
      const recovered = await this.waitFor(balanceConfig.smashRecoveryDurationMs, token);
      if (!recovered || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('return_to_hover');
      this.boss.playFly();
      const returned = await this.awaitTask(
        this.bossMovementSystem.moveToOverDuration(
          new Phaser.Math.Vector2(returnX, balanceConfig.bossHoverY),
          balanceConfig.smashReturnDurationMs
        ),
        token
      );
      if (!returned || !this.canProceed(token, params.canContinue)) {
        return;
      }

      this.transitionTo('finished');
      this.bossMovementSystem.resumePatrol(shouldResumePatrol && params.canContinue());
      this.boss.playIdle();
    } finally {
      if (token === this.executionToken) {
        this.running = false;
        if (this.state !== 'finished') {
          this.state = 'idle';
        }
      }

      this.clearMarker();
    }
  }

  public cancel(): void {
    if (!this.running && !this.activeMarker) {
      return;
    }

    this.executionToken += 1;
    this.running = false;
    this.state = 'finished';

    this.pendingWaits.forEach(({ event, resolve }) => {
      event.destroy();
      resolve(false);
    });
    this.pendingWaits.clear();

    this.cancellationResolvers.forEach((resolve) => resolve());
    this.cancellationResolvers.clear();

    this.clearMarker();
    this.bossMovementSystem.interruptMotion();
  }

  private applyImpactDamage(
    player: Player,
    impactX: number,
    damagePlayer: (amount: number) => void
  ): void {
    const distanceX = Math.abs(player.x - impactX);
    if (distanceX <= this.difficulty.smashImpactRadius) {
      damagePlayer(this.difficulty.smashDamage);
    }
  }

  private transitionTo(nextState: SmashAttackState): void {
    this.state = nextState;
  }

  private canProceed(token: number, canContinue: () => boolean): boolean {
    return token === this.executionToken && !this.boss.isDefeated() && canContinue();
  }

  private waitFor(delayMs: number, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;

      const complete = (completed: boolean): void => {
        if (settled) {
          return;
        }

        settled = true;
        this.cancellationResolvers.delete(cancel);
        resolve(completed && token === this.executionToken);
      };

      const managedWait: ManagedWait = {
        event: this.scene.time.delayedCall(delayMs, () => {
          this.pendingWaits.delete(managedWait);
          complete(true);
        }),
        resolve: complete
      };

      const cancel = (): void => {
        managedWait.event.destroy();
        this.pendingWaits.delete(managedWait);
        complete(false);
      };

      this.pendingWaits.add(managedWait);
      this.cancellationResolvers.add(cancel);
    });
  }

  private awaitTask(task: Promise<unknown>, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (completed: boolean): void => {
        if (settled) {
          return;
        }

        settled = true;
        this.cancellationResolvers.delete(cancel);
        resolve(completed && token === this.executionToken);
      };

      const cancel = (): void => {
        finish(false);
      };

      this.cancellationResolvers.add(cancel);

      task
        .then(() => finish(true))
        .catch(() => finish(false));
    });
  }

  private clearMarker(): void {
    this.activeMarker?.dispose();
    this.activeMarker = undefined;
  }
}
