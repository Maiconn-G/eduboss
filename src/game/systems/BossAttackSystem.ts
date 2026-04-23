import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { DifficultySettings } from '../config/difficultyConfig';
import { Boss } from '../entities/Boss';
import { BossProjectile } from '../entities/BossProjectile';
import { DangerZone } from '../entities/DangerZone';
import { Player } from '../entities/Player';
import { BattleState } from '../types/BattleState';
import { BATTLE_FLOW_EVENTS, BattleFlowSystem } from './BattleFlowSystem';
import { BossAttackVFXSystem } from './BossAttackVFXSystem';
import { BossMovementSystem } from './BossMovementSystem';
import { FeedbackSystem } from './FeedbackSystem';
import { PlayerHealthSystem } from './PlayerHealthSystem';
import { SmashAttackSystem } from './SmashAttackSystem';
import { DangerZoneAttackPattern } from './bossAttacks/DangerZoneAttackPattern';
import {
  BossAttackContext,
  BossAttackPattern,
  BossAttackSystemOptions,
  BossAttackType,
  SpawnDangerZoneOptions,
  SpawnProjectileOptions
} from './bossAttacks/BossAttackPattern';
import { ProjectileAttackPattern } from './bossAttacks/ProjectileAttackPattern';
import { SmashAttackPattern } from './bossAttacks/SmashAttackPattern';

export const BOSS_ATTACK_EVENTS = {
  attackStarted: 'boss-attack-started',
  attackFinished: 'boss-attack-finished',
  attackCancelled: 'boss-attack-cancelled'
} as const;

type AttackMode = 'idle' | 'paused' | 'pre_wave' | 'normal';
type AttackSelectionMode = 'pre_wave' | 'normal';

type AttackDefinition = {
  key: BossAttackType;
  pattern: BossAttackPattern;
  cooldownMs: number;
};

type ManagedWait = {
  timer: Phaser.Time.TimerEvent;
  resolve: (active: boolean) => void;
};

export class BossAttackSystem {
  public readonly events = new Phaser.Events.EventEmitter();

  private attackTimer?: Phaser.Time.TimerEvent;
  private readonly projectiles: BossProjectile[] = [];
  private readonly dangerZones: DangerZone[] = [];
  private readonly attackDefinitions: AttackDefinition[];
  private readonly smashAttackSystem: SmashAttackSystem;
  private readonly attackVFXSystem: BossAttackVFXSystem;
  private readonly cooldownByAttack = new Map<BossAttackType, number>();
  private readonly attackHistory: BossAttackType[] = [];
  private readonly phaseChangedHandler: (state: BattleState) => void;
  private readonly pendingWaits = new Set<ManagedWait>();

  private mode: AttackMode = 'idle';
  private runToken = 0;
  private currentAttackToken = 0;
  private currentAttackKey?: BossAttackType;
  private globalCooldownUntil = 0;
  private disposed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boss: Boss,
    private readonly player: Player,
    private readonly flowSystem: BattleFlowSystem,
    private readonly playerHealthSystem: PlayerHealthSystem,
    private readonly feedbackSystem: FeedbackSystem,
    private readonly bossMovementSystem: BossMovementSystem,
    private readonly difficulty: DifficultySettings,
    private readonly options: BossAttackSystemOptions,
    attackPatterns?: BossAttackPattern[]
  ) {
    this.attackVFXSystem = new BossAttackVFXSystem(scene, feedbackSystem);
    this.smashAttackSystem = new SmashAttackSystem(
      scene,
      boss,
      bossMovementSystem,
      feedbackSystem,
      difficulty
    );

    const resolvedPatterns =
      attackPatterns ??
      [
        new ProjectileAttackPattern(),
        new DangerZoneAttackPattern(),
        new SmashAttackPattern(this.smashAttackSystem)
      ];

    this.attackDefinitions = resolvedPatterns.map((pattern) => ({
      key: pattern.key,
      pattern,
      cooldownMs: this.getAttackCooldown(pattern.key)
    }));

    this.phaseChangedHandler = (state) => {
      this.onPhaseChanged(state);
    };
    this.flowSystem.events.on(BATTLE_FLOW_EVENTS.stateChanged, this.phaseChangedHandler);
  }

  public start(): void {
    this.onPhaseChanged(this.flowSystem.getState());
  }

  public async startPreAnswerWave(): Promise<void> {
    this.pause();

    if (!this.canRunPreWave()) {
      return;
    }

    this.mode = 'pre_wave';
    const waveToken = ++this.runToken;

    for (let index = 0; index < this.difficulty.preAttackWaveCount; index += 1) {
      if (!this.isWaveActive(waveToken, 'pre_answer_attack_wave')) {
        break;
      }

      const executed = await this.tryExecuteSelectedAttack('pre_wave', waveToken);
      if (!executed && this.isWaveActive(waveToken, 'pre_answer_attack_wave')) {
        const retryDelay = Math.max(180, this.getNextReadyDelay('pre_wave'));
        const stillWaiting = await this.wait(retryDelay, waveToken);
        if (!stillWaiting) {
          break;
        }
        index -= 1;
        continue;
      }

      if (
        index < this.difficulty.preAttackWaveCount - 1 &&
        this.isWaveActive(waveToken, 'pre_answer_attack_wave')
      ) {
        const interAttackDelay = Math.max(
          this.difficulty.preAttackWaveInterval,
          this.getGlobalCooldownRemaining()
        );
        const stillWaiting = await this.wait(interAttackDelay, waveToken);
        if (!stillWaiting) {
          break;
        }
      }
    }

    if (this.isWaveActive(waveToken, 'pre_answer_attack_wave')) {
      this.mode = 'paused';
      this.bossMovementSystem.stopPatrol();
    }
  }

  public startNormalPressure(): void {
    if (!this.canRunNormalPressure()) {
      return;
    }

    if (this.mode === 'normal') {
      return;
    }

    this.clearScheduledAttack();
    this.mode = 'normal';
    this.runToken += 1;
    const token = this.runToken;
    this.bossMovementSystem.startPatrol();
    this.scheduleNextNormalAttack(token);
  }

  public pause(): void {
    this.clearScheduledAttack();
    this.clearPendingWaits();
    this.cancelCurrentAttack();
    this.mode = 'paused';
    this.bossMovementSystem.stopPatrol();
  }

  public resume(): void {
    if (this.flowSystem.getState() === 'question_active') {
      this.startNormalPressure();
    }
  }

  public stopAllAttacks(): void {
    this.clearScheduledAttack();
    this.clearPendingWaits();
    this.cancelCurrentAttack();
    this.mode = 'idle';
    this.runToken += 1;
    this.bossMovementSystem.stopPatrol();
    this.clearHazards();
  }

  public cancelCurrentAttack(): void {
    if (!this.currentAttackKey) {
      this.smashAttackSystem.cancel();
      return;
    }

    const cancelledAttack = this.currentAttackKey;
    this.currentAttackKey = undefined;
    this.currentAttackToken += 1;
    this.smashAttackSystem.cancel();
    this.events.emit(BOSS_ATTACK_EVENTS.attackCancelled, cancelledAttack);
  }

  public onPhaseChanged(state: BattleState): void {
    if (this.disposed) {
      return;
    }

    switch (state) {
      case 'intro':
      case 'boss_speaking':
      case 'answer_drop':
      case 'answer_feedback':
        this.pause();
        break;
      case 'pre_answer_attack_wave':
        this.pause();
        break;
      case 'question_active':
        this.resume();
        break;
      case 'victory':
      case 'defeat':
        this.stopAllAttacks();
        break;
      default:
        break;
    }
  }

  public update(): void {
    this.cleanupProjectiles();
    this.attackVFXSystem.update();
    const context = this.createContext(this.runToken, this.currentAttackToken);

    this.attackDefinitions.forEach(({ pattern }) => {
      pattern.update?.(context);
    });
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.stopAllAttacks();
    this.flowSystem.events.off(BATTLE_FLOW_EVENTS.stateChanged, this.phaseChangedHandler);

    this.attackDefinitions.forEach(({ pattern }) => {
      pattern.destroy?.();
    });
    this.attackVFXSystem.destroy();
  }

  public destroy(): void {
    this.dispose();
  }

  private scheduleNextNormalAttack(token: number): void {
    if (!this.isWaveActive(token, 'question_active') || this.mode !== 'normal') {
      return;
    }

    const randomDelay = Phaser.Math.Between(
      this.difficulty.normalAttackIntervalMin,
      this.difficulty.normalAttackIntervalMax
    );
    const delay = Math.max(randomDelay, this.getGlobalCooldownRemaining());

    this.attackTimer = this.scene.time.delayedCall(delay, async () => {
      this.attackTimer = undefined;

      if (!this.isWaveActive(token, 'question_active') || this.mode !== 'normal') {
        return;
      }

      const executed = await this.tryExecuteSelectedAttack('normal', token);
      if (!this.isWaveActive(token, 'question_active') || this.mode !== 'normal') {
        return;
      }

      if (!executed) {
        const retryDelay = Math.max(180, this.getNextReadyDelay('normal'));
        this.attackTimer = this.scene.time.delayedCall(retryDelay, () => {
          this.attackTimer = undefined;
          this.scheduleNextNormalAttack(token);
        });
        return;
      }

      this.scheduleNextNormalAttack(token);
    });
  }

  private async tryExecuteSelectedAttack(
    mode: AttackSelectionMode,
    runToken: number
  ): Promise<boolean> {
    const selectedAttack = this.selectAttack(mode, runToken);
    if (!selectedAttack) {
      return false;
    }

    return this.executeAttack(selectedAttack, runToken);
  }

  private selectAttack(
    mode: AttackSelectionMode,
    runToken: number
  ): AttackDefinition | undefined {
    const context = this.createContext(runToken, this.currentAttackToken);
    const readyDefinitions = this.attackDefinitions.filter((definition) => {
      if (this.getWeightForMode(definition.key, mode) <= 0) {
        return false;
      }

      if (this.getAttackCooldownRemaining(definition.key) > 0) {
        return false;
      }

      return definition.pattern.canExecute?.(context) ?? true;
    });

    if (readyDefinitions.length === 0) {
      return undefined;
    }

    const nonRepeatingDefinitions = readyDefinitions.filter((definition) => {
      return !this.wouldRepeatTooMuch(definition.key);
    });

    return this.pickWeightedAttack(nonRepeatingDefinitions.length > 0 ? nonRepeatingDefinitions : readyDefinitions, mode);
  }

  private pickWeightedAttack(
    definitions: AttackDefinition[],
    mode: AttackSelectionMode
  ): AttackDefinition {
    const totalWeight = definitions.reduce((sum, definition) => {
      return sum + this.getWeightForMode(definition.key, mode);
    }, 0);

    let threshold = Phaser.Math.FloatBetween(0, totalWeight);

    for (const definition of definitions) {
      threshold -= this.getWeightForMode(definition.key, mode);
      if (threshold <= 0) {
        return definition;
      }
    }

    return definitions[definitions.length - 1];
  }

  private async executeAttack(definition: AttackDefinition, runToken: number): Promise<boolean> {
    if (!this.isWaveActive(runToken, this.flowSystem.getState())) {
      return false;
    }

    const attackToken = ++this.currentAttackToken;
    this.currentAttackKey = definition.key;

    const wasPatrolling = this.bossMovementSystem.pausePatrol();
    this.events.emit(BOSS_ATTACK_EVENTS.attackStarted, definition.key);

    try {
      await definition.pattern.execute(this.createContext(runToken, attackToken));

      if (!this.isAttackStillCurrent(runToken, attackToken)) {
        return false;
      }

      this.registerAttackCompletion(definition.key, definition.cooldownMs);
      this.events.emit(BOSS_ATTACK_EVENTS.attackFinished, definition.key);
      return true;
    } finally {
      if (this.currentAttackToken === attackToken && this.currentAttackKey === definition.key) {
        this.currentAttackKey = undefined;
      }

      if (
        wasPatrolling &&
        this.mode === 'normal' &&
        this.flowSystem.getState() === 'question_active' &&
        !this.currentAttackKey
      ) {
        this.bossMovementSystem.startPatrol();
      }
    }
  }

  private registerAttackCompletion(attackKey: BossAttackType, cooldownMs: number): void {
    const now = this.scene.time.now;
    this.globalCooldownUntil = now + this.difficulty.attackGlobalCooldownMs;
    this.cooldownByAttack.set(attackKey, now + cooldownMs);
    this.attackHistory.push(attackKey);

    while (this.attackHistory.length > balanceConfig.attackHistorySize) {
      this.attackHistory.shift();
    }
  }

  private wouldRepeatTooMuch(attackKey: BossAttackType): boolean {
    let repeatedCount = 0;

    for (let index = this.attackHistory.length - 1; index >= 0; index -= 1) {
      if (this.attackHistory[index] !== attackKey) {
        break;
      }

      repeatedCount += 1;
    }

    return repeatedCount >= balanceConfig.maxRepeatedAttackCount;
  }

  private getWeightForMode(
    attackKey: BossAttackType,
    mode: AttackSelectionMode
  ): number {
    const baseWeights: Record<BossAttackType, number> = {
      projectile: balanceConfig.projectileWeight,
      danger_zone: balanceConfig.dangerZoneWeight,
      smash: balanceConfig.smashWeight
    };

    if (mode === 'normal') {
      return baseWeights[attackKey];
    }

    if (attackKey === 'projectile') {
      return Math.max(1, baseWeights[attackKey] - 1);
    }

    if (attackKey === 'danger_zone') {
      return baseWeights[attackKey] + 1;
    }

    return baseWeights[attackKey] + 2;
  }

  private getAttackCooldown(attackKey: BossAttackType): number {
    switch (attackKey) {
      case 'projectile':
        return this.difficulty.projectileCooldownMs;
      case 'danger_zone':
        return this.difficulty.dangerZoneCooldownMs;
      case 'smash':
        return this.difficulty.smashCooldownMs;
      default:
        return this.difficulty.attackGlobalCooldownMs;
    }
  }

  private getGlobalCooldownRemaining(): number {
    return Math.max(0, this.globalCooldownUntil - this.scene.time.now);
  }

  private getAttackCooldownRemaining(attackKey: BossAttackType): number {
    const cooldownUntil = this.cooldownByAttack.get(attackKey) ?? 0;
    return Math.max(0, cooldownUntil - this.scene.time.now, this.getGlobalCooldownRemaining());
  }

  private getNextReadyDelay(mode: AttackSelectionMode): number {
    const candidates = this.attackDefinitions.filter((definition) => {
      return this.getWeightForMode(definition.key, mode) > 0;
    });

    if (candidates.length === 0) {
      return this.difficulty.attackGlobalCooldownMs;
    }

    return Math.min(
      ...candidates.map((definition) => {
        return Math.max(80, this.getAttackCooldownRemaining(definition.key));
      })
    );
  }

  private createContext(runToken: number, attackToken: number): BossAttackContext {
    return {
      scene: this.scene,
      boss: this.boss,
      player: this.player,
      flowSystem: this.flowSystem,
      difficulty: this.difficulty,
      bossMovementSystem: this.bossMovementSystem,
      feedbackSystem: this.feedbackSystem,
      playerHealthSystem: this.playerHealthSystem,
      options: this.options,
      randomBetween: (min, max) => Phaser.Math.Between(min, max),
      clampArenaX: (x, padding) =>
        Phaser.Math.Clamp(x, padding, this.options.arenaWidth - padding),
      clampFlightX: (x, padding) =>
        Phaser.Math.Clamp(x, this.options.flightLeftLimit + padding, this.options.flightRightLimit - padding),
      clampAttackTrackX: (x, padding) =>
        Phaser.Math.Clamp(x, this.options.attackLeftLimit + padding, this.options.attackRightLimit - padding),
      isPlayerInsideCircle: (area) =>
        Phaser.Geom.Intersects.CircleToRectangle(area, this.player.getBounds()),
      damagePlayer: (amount) => this.handlePlayerHit(amount),
      wait: (delayMs) => this.wait(delayMs, runToken).then(() => undefined),
      isAttackActive: () => this.isAttackStillCurrent(runToken, attackToken),
      schedule: (delayMs, callback) => this.scene.time.delayedCall(delayMs, callback),
      spawnProjectile: (spawnOptions) => this.spawnProjectile(spawnOptions),
      spawnDangerZone: (spawnOptions) => this.spawnDangerZone(spawnOptions)
    };
  }

  private spawnProjectile(options: SpawnProjectileOptions): BossProjectile {
    const projectile = new BossProjectile(this.scene, options.origin.x, options.origin.y);
    projectile.launch(options.origin, options.target, options.speed);
    this.attackVFXSystem.playProjectileSpawnVFX(options.origin, options.target);
    this.attackVFXSystem.trackProjectile(projectile);
    this.projectiles.push(projectile);

    this.scene.physics.add.overlap(
      projectile,
      this.player,
      () => {
        this.handlePlayerHit(options.damage);
        this.removeProjectile(projectile, true);
      },
      undefined,
      this
    );

    return projectile;
  }

  private spawnDangerZone(options: SpawnDangerZoneOptions): DangerZone {
    const zone = new DangerZone(this.scene, options.x, options.y, options.radius);
    this.dangerZones.push(zone);
    this.attackVFXSystem.playDangerZoneTelegraphVFX(zone);
    this.scene.time.delayedCall(Math.max(140, options.warningMs * 0.55), () => {
      if (!zone.active) {
        return;
      }

      this.attackVFXSystem.playDangerZonePulseVFX(zone);
    });

    zone.startWarning(options.warningMs, () => {
      let hitPlayer = false;
      options.onActivate?.(zone);
      if (this.flowSystem.canTakeDamage()) {
        hitPlayer = Phaser.Geom.Intersects.CircleToRectangle(zone.getArea(), this.player.getBounds());
      }

      zone.playImpact();
      this.attackVFXSystem.playDangerZoneImpactVFX(zone, hitPlayer);

      this.scene.time.delayedCall(options.cleanupDelayMs ?? 0, () => {
        if (!zone.active) {
          return;
        }

        zone.playDissipate();
        this.attackVFXSystem.playDangerZoneDissipateVFX(zone);
        this.scene.time.delayedCall(balanceConfig.dangerZoneFadeOutDuration, () => {
          this.removeDangerZone(zone);
        });
      });
    });

    return zone;
  }

  private cleanupProjectiles(): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];

      if (
        !projectile.active ||
        projectile.isOutOfBounds(this.options.arenaWidth, this.scene.scale.height)
      ) {
        if (projectile.active) {
          this.attackVFXSystem.playProjectileImpactVFX(projectile.x, projectile.y, false);
        }
        this.attackVFXSystem.untrackProjectile(projectile);
        projectile.destroy();
        this.projectiles.splice(index, 1);
      }
    }
  }

  private clearHazards(): void {
    this.projectiles.forEach((projectile) => {
      this.attackVFXSystem.untrackProjectile(projectile);
      projectile.destroy();
    });
    this.dangerZones.forEach((zone) => zone.destroy());
    this.projectiles.length = 0;
    this.dangerZones.length = 0;
  }

  private handlePlayerHit(amount: number): void {
    if (!this.flowSystem.canTakeDamage()) {
      return;
    }

    this.playerHealthSystem.takeDamage(amount);
  }

  private removeProjectile(projectile: BossProjectile, hitPlayer: boolean): void {
    const index = this.projectiles.indexOf(projectile);
    if (index >= 0) {
      this.projectiles.splice(index, 1);
    }

    if (projectile.active) {
      this.attackVFXSystem.playProjectileImpactVFX(projectile.x, projectile.y, hitPlayer);
      this.attackVFXSystem.untrackProjectile(projectile);
      projectile.destroy();
    }
  }

  private removeDangerZone(zone: DangerZone): void {
    const index = this.dangerZones.indexOf(zone);
    if (index >= 0) {
      this.dangerZones.splice(index, 1);
    }

    if (zone.active) {
      zone.destroy();
    }
  }

  private canRunPreWave(): boolean {
    return !this.flowSystem.isTerminal() && this.flowSystem.getState() === 'pre_answer_attack_wave';
  }

  private canRunNormalPressure(): boolean {
    return !this.flowSystem.isTerminal() && this.flowSystem.getState() === 'question_active';
  }

  private isWaveActive(token: number, expectedState: BattleState): boolean {
    return (
      token === this.runToken &&
      !this.flowSystem.isTerminal() &&
      this.flowSystem.getState() === expectedState &&
      this.flowSystem.canBossAttack()
    );
  }

  private isAttackStillCurrent(runToken: number, attackToken: number): boolean {
    return (
      runToken === this.runToken &&
      attackToken === this.currentAttackToken &&
      !this.flowSystem.isTerminal() &&
      this.flowSystem.canBossAttack()
    );
  }

  private wait(delayMs: number, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      const managedWait: ManagedWait = {
        timer: this.scene.time.delayedCall(delayMs, () => {
          this.pendingWaits.delete(managedWait);
          resolve(token === this.runToken);
        }),
        resolve
      };

      this.pendingWaits.add(managedWait);
    });
  }

  private clearScheduledAttack(): void {
    this.attackTimer?.destroy();
    this.attackTimer = undefined;
  }

  private clearPendingWaits(): void {
    this.pendingWaits.forEach((managedWait) => {
      managedWait.timer.destroy();
      managedWait.resolve(false);
    });
    this.pendingWaits.clear();
  }
}
