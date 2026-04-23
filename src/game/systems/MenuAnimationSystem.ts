import Phaser from 'phaser';
import { menuMotion } from '../ui/theme/menuMotion';

type AnimatedTarget = Phaser.GameObjects.GameObject & {
  alpha: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

type EntranceItem = {
  target: AnimatedTarget;
  delay?: number;
  offsetY?: number;
  scaleFrom?: number;
};

export class MenuAnimationSystem {
  private readonly scene: Phaser.Scene;
  private readonly trackedTweens = new Set<Phaser.Tweens.Tween>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public playEntrance(items: EntranceItem[]): void {
    items.forEach((item, index) => {
      const target = item.target;
      const offsetY = item.offsetY ?? menuMotion.menuPanelSlideDistance;
      const scaleFrom = item.scaleFrom ?? 0.985;
      const delay = item.delay ?? index * menuMotion.menuStaggerDelay;

      target.alpha = 0;
      target.y += offsetY;
      target.scaleX = scaleFrom;
      target.scaleY = scaleFrom;

      const tween = this.scene.tweens.add({
        targets: target,
        alpha: 1,
        y: target.y - offsetY,
        scaleX: 1,
        scaleY: 1,
        ease: 'Cubic.easeOut',
        duration: menuMotion.menuFadeInDuration,
        delay
      });

      this.trackTween(tween);
    });
  }

  public playCascade(
    targets: AnimatedTarget[],
    startDelay: number,
    offsetY = 12
  ): void {
    targets.forEach((target, index) => {
      target.alpha = 0;
      target.y += offsetY;

      const tween = this.scene.tweens.add({
        targets: target,
        alpha: 1,
        y: target.y - offsetY,
        ease: 'Quad.easeOut',
        duration: 280,
        delay: startDelay + index * menuMotion.menuRowCascadeDelay
      });

      this.trackTween(tween);
    });
  }

  public addFloatIdle(target: AnimatedTarget): void {
    const tween = this.scene.tweens.add({
      targets: target,
      y: target.y - menuMotion.menuTitleFloatDistance,
      duration: menuMotion.menuTitleFloatDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.trackTween(tween);
  }

  public async playExit(targets: AnimatedTarget[]): Promise<void> {
    await new Promise<void>((resolve) => {
      const tween = this.scene.tweens.add({
        targets,
        alpha: 0,
        scaleX: menuMotion.menuOutroScale,
        scaleY: menuMotion.menuOutroScale,
        y: '-=10',
        ease: 'Quad.easeIn',
        duration: menuMotion.menuFadeOutDuration,
        onComplete: () => resolve()
      });

      this.trackTween(tween);
    });
  }

  public dispose(): void {
    this.trackedTweens.forEach((tween) => tween.stop());
    this.trackedTweens.clear();
  }

  private trackTween(tween: Phaser.Tweens.Tween): void {
    this.trackedTweens.add(tween);
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, () => {
      this.trackedTweens.delete(tween);
    });
    tween.once(Phaser.Tweens.Events.TWEEN_STOP, () => {
      this.trackedTweens.delete(tween);
    });
  }
}
