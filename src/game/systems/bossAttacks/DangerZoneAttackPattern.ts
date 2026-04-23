import { BossAttackContext, BossAttackPattern } from './BossAttackPattern';

export class DangerZoneAttackPattern implements BossAttackPattern {
  public readonly key = 'danger_zone';
  public readonly weight = 2;

  public async execute(context: BossAttackContext): Promise<void> {
    const centerX = context.clampArenaX(
      context.player.x + context.randomBetween(-140, 140),
      100
    );

    context.spawnDangerZone({
      x: centerX,
      y: context.options.dangerZoneY,
      radius: 68,
      warningMs: context.difficulty.dangerZoneWarningMs,
      cleanupDelayMs: 180,
      onActivate: (zone) => {
        if (!context.flowSystem.canTakeDamage()) {
          return;
        }

        if (context.isPlayerInsideCircle(zone.getArea())) {
          context.damagePlayer(context.difficulty.dangerZoneDamage);
        }
      }
    });
  }
}
