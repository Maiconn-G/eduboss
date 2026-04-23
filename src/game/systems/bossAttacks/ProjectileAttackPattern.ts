import { BossAttackContext, BossAttackPattern } from './BossAttackPattern';

export class ProjectileAttackPattern implements BossAttackPattern {
  public readonly key = 'projectile';
  public readonly weight = 3;

  public async execute(context: BossAttackContext): Promise<void> {
    context.spawnProjectile({
      origin: context.boss.getAttackOrigin(),
      target: context.player.getCenterPosition(),
      damage: context.difficulty.projectileDamage,
      speed: context.difficulty.projectileSpeed
    });
  }
}
