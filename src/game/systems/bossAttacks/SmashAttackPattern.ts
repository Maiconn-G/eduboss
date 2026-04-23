import { SmashAttackSystem } from '../SmashAttackSystem';
import { BossAttackContext, BossAttackPattern } from './BossAttackPattern';

export class SmashAttackPattern implements BossAttackPattern {
  public readonly key = 'smash';
  public readonly weight = 1;

  constructor(private readonly smashAttackSystem: SmashAttackSystem) {}

  public canExecute(context: BossAttackContext): boolean {
    return context.flowSystem.canBossAttack() && !this.smashAttackSystem.isRunning();
  }

  public execute(context: BossAttackContext): Promise<void> {
    return this.smashAttackSystem.start({
      player: context.player,
      impactY: context.options.dangerZoneY,
      canContinue: context.isAttackActive,
      damagePlayer: context.damagePlayer,
      clampImpactX: (x) =>
        context.clampAttackTrackX(
          x,
          context.difficulty.smashImpactRadius + context.difficulty.smashTrackingTolerance
        )
    });
  }

  public destroy(): void {
    this.smashAttackSystem.cancel();
  }
}
