import Phaser from 'phaser';
import { bossDefaultAnimation } from '../config/bossAnimationConfig';
import { BossAnimationController } from '../systems/BossAnimationController';

export class Boss extends Phaser.GameObjects.Sprite {
  private readonly baseScale = 3.1;
  public readonly maxHP: number;
  public currentHP: number;
  public readonly animationController: BossAnimationController;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHP: number) {
    super(scene, x, y, bossDefaultAnimation.textureKey, bossDefaultAnimation.startFrame);

    this.maxHP = maxHP;
    this.currentHP = maxHP;

    scene.add.existing(this);

    this.setDepth(8);
    this.setScale(this.baseScale);

    this.animationController = new BossAnimationController(scene, this);
    this.animationController.playIdle();
  }

  public setFacingDirection(direction: number): void {
    if (Math.abs(direction) < 0.01) {
      return;
    }

    this.setFlipX(direction > 0);
  }

  public getBaseScale(): number {
    return this.baseScale;
  }

  public getAttackOrigin(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y + this.displayHeight * 0.2);
  }

  public getSmashImpactY(groundY: number): number {
    return groundY - this.displayHeight * 0.38;
  }

  public takeDamage(amount = 1): number {
    this.currentHP = Math.max(0, this.currentHP - amount);
    return this.currentHP;
  }

  public setHitFlash(active: boolean): void {
    if (active) {
      this.setTintFill(0xffd4d4);
      return;
    }

    this.clearTint();
  }

  public playIdle(): void {
    this.animationController.playIdle();
  }

  public playFly(): void {
    this.animationController.playFly();
  }

  public playHitAnimation(): Promise<void> {
    return this.animationController.playHit();
  }

  public playDeathAnimation(): Promise<void> {
    return this.animationController.playDie();
  }

  public playSmashStartAnimation(): Promise<void> {
    return this.animationController.playSmashStart();
  }

  public playSmashLoopAnimation(): void {
    this.animationController.playSmashLoop();
  }

  public playSmashEndAnimation(): Promise<void> {
    return this.animationController.playSmashEnd();
  }

  public isDefeated(): boolean {
    return this.currentHP <= 0;
  }

  public override destroy(fromScene?: boolean): void {
    this.animationController.dispose();
    super.destroy(fromScene);
  }
}
