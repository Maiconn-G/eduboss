import { balanceConfig } from './balanceConfig';
import { DifficultyMode } from '../types/DifficultyMode';

export type DifficultySettings = {
  mode: DifficultyMode;
  label: string;
  description: string;
  playerMaxHealth: number;
  scorePenalty: number;
  preAttackWaveCount: number;
  preAttackWaveInterval: number;
  normalAttackIntervalMin: number;
  normalAttackIntervalMax: number;
  attackGlobalCooldownMs: number;
  projectileCooldownMs: number;
  dangerZoneCooldownMs: number;
  smashCooldownMs: number;
  projectileDamage: number;
  projectileSpeed: number;
  dangerZoneDamage: number;
  dangerZoneWarningMs: number;
  smashTelegraphDurationMs: number;
  smashImpactRadius: number;
  smashDamage: number;
  smashTrackingTolerance: number;
  smashFallSpeed: number;
  answerDropMinXVelocity: number;
  answerDropMaxXVelocity: number;
  answerDropInitialYVelocity: number;
};

export const DEFAULT_DIFFICULTY_MODE: DifficultyMode = 'easy';

const sharedAttackValues = {
  projectileDamage: balanceConfig.projectileDamage,
  dangerZoneDamage: balanceConfig.dangerZoneDamage,
  smashImpactRadius: balanceConfig.smashImpactRadius,
  smashDamage: balanceConfig.smashDamage,
  smashTrackingTolerance: balanceConfig.smashTrackingTolerance
} as const;

export const difficultyConfig: Record<DifficultyMode, DifficultySettings> = {
  easy: {
    mode: 'easy',
    label: 'Facil',
    description: 'Ritmo tranquilo',
    playerMaxHealth: 3,
    scorePenalty: 5,
    preAttackWaveCount: 2,
    preAttackWaveInterval: 1400,
    normalAttackIntervalMin: 2500,
    normalAttackIntervalMax: 4000,
    attackGlobalCooldownMs: 650,
    projectileCooldownMs: 2200,
    dangerZoneCooldownMs: 3200,
    smashCooldownMs: 9000,
    projectileSpeed: 280,
    dangerZoneWarningMs: 1200,
    smashTelegraphDurationMs: 700,
    smashFallSpeed: 980,
    answerDropMinXVelocity: -120,
    answerDropMaxXVelocity: 120,
    answerDropInitialYVelocity: -340,
    ...sharedAttackValues
  },
  normal: {
    mode: 'normal',
    label: 'Normal',
    description: 'Desafio equilibrado',
    playerMaxHealth: 3,
    scorePenalty: 7,
    preAttackWaveCount: 3,
    preAttackWaveInterval: 1100,
    normalAttackIntervalMin: 1800,
    normalAttackIntervalMax: 3000,
    attackGlobalCooldownMs: 500,
    projectileCooldownMs: 1700,
    dangerZoneCooldownMs: 2500,
    smashCooldownMs: 7000,
    projectileSpeed: 320,
    dangerZoneWarningMs: 900,
    smashTelegraphDurationMs: 600,
    smashFallSpeed: 1100,
    answerDropMinXVelocity: -180,
    answerDropMaxXVelocity: 180,
    answerDropInitialYVelocity: -370,
    ...sharedAttackValues
  },
  hard: {
    mode: 'hard',
    label: 'Dificil',
    description: 'Pressao intensa',
    playerMaxHealth: 2,
    scorePenalty: 10,
    preAttackWaveCount: 4,
    preAttackWaveInterval: 900,
    normalAttackIntervalMin: 1300,
    normalAttackIntervalMax: 2200,
    attackGlobalCooldownMs: 380,
    projectileCooldownMs: 1300,
    dangerZoneCooldownMs: 1800,
    smashCooldownMs: 5500,
    projectileSpeed: 360,
    dangerZoneWarningMs: 700,
    smashTelegraphDurationMs: 500,
    smashFallSpeed: 1220,
    answerDropMinXVelocity: -240,
    answerDropMaxXVelocity: 240,
    answerDropInitialYVelocity: -410,
    ...sharedAttackValues
  }
};

export function getDifficultySettings(mode: DifficultyMode): DifficultySettings {
  return difficultyConfig[mode];
}
