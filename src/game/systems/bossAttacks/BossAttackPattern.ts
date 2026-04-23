import Phaser from 'phaser';
import { DifficultySettings } from '../../config/difficultyConfig';
import { Boss } from '../../entities/Boss';
import { BossProjectile } from '../../entities/BossProjectile';
import { DangerZone } from '../../entities/DangerZone';
import { Player } from '../../entities/Player';
import { BattleFlowSystem } from '../BattleFlowSystem';
import { BossMovementSystem } from '../BossMovementSystem';
import { FeedbackSystem } from '../FeedbackSystem';
import { PlayerHealthSystem } from '../PlayerHealthSystem';

export type BossAttackType = 'projectile' | 'danger_zone' | 'smash';

export type BossAttackSystemOptions = {
  arenaWidth: number;
  dangerZoneY: number;
  bossHoverY: number;
  flightLeftLimit: number;
  flightRightLimit: number;
  attackLeftLimit: number;
  attackRightLimit: number;
};

export type SpawnProjectileOptions = {
  origin: Phaser.Math.Vector2;
  target: Phaser.Math.Vector2;
  damage: number;
  speed?: number;
};

export type SpawnDangerZoneOptions = {
  x: number;
  y: number;
  radius: number;
  warningMs: number;
  cleanupDelayMs?: number;
  onActivate?: (zone: DangerZone) => void;
};

export type BossAttackContext = {
  scene: Phaser.Scene;
  boss: Boss;
  player: Player;
  flowSystem: BattleFlowSystem;
  difficulty: DifficultySettings;
  bossMovementSystem: BossMovementSystem;
  feedbackSystem: FeedbackSystem;
  playerHealthSystem: PlayerHealthSystem;
  options: BossAttackSystemOptions;
  randomBetween: (min: number, max: number) => number;
  clampArenaX: (x: number, padding: number) => number;
  clampFlightX: (x: number, padding: number) => number;
  clampAttackTrackX: (x: number, padding: number) => number;
  isPlayerInsideCircle: (area: Phaser.Geom.Circle) => boolean;
  damagePlayer: (amount: number) => void;
  wait: (delayMs: number) => Promise<void>;
  isAttackActive: () => boolean;
  schedule: (delayMs: number, callback: () => void) => Phaser.Time.TimerEvent;
  spawnProjectile: (options: SpawnProjectileOptions) => BossProjectile;
  spawnDangerZone: (options: SpawnDangerZoneOptions) => DangerZone;
};

export interface BossAttackPattern {
  readonly key: BossAttackType;
  readonly weight: number;
  canExecute?(context: BossAttackContext): boolean;
  execute(context: BossAttackContext): Promise<void>;
  update?(context: BossAttackContext): void;
  destroy?(): void;
}
