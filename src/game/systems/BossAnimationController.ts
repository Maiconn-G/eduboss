import Phaser from 'phaser';
import {
  bossAnimationConfig,
  bossAnimationDefinitions,
  BossAnimationState
} from '../config/bossAnimationConfig';
import { Boss } from '../entities/Boss';

export class BossAnimationController {
  private locked = false;
  private defeated = false;
  private movementState: 'idle' | 'fly' = 'idle';
  private disposed = false;

  constructor(private readonly scene: Phaser.Scene, private readonly boss: Boss) {}

  public static preload(scene: Phaser.Scene): void {
    bossAnimationDefinitions.forEach((definition) => {
      if (scene.textures.exists(definition.textureKey)) {
        return;
      }

      scene.load.spritesheet(definition.textureKey, definition.assetPath, {
        frameWidth: definition.frameWidth,
        frameHeight: definition.frameHeight,
        endFrame: definition.endFrame
      });
    });
  }

  public static registerAnimations(scene: Phaser.Scene): void {
    bossAnimationDefinitions.forEach((definition) => {
      if (scene.anims.exists(definition.animationKey)) {
        return;
      }

      scene.anims.create({
        key: definition.animationKey,
        frames: scene.anims.generateFrameNumbers(definition.textureKey, {
          start: definition.startFrame,
          end: definition.endFrame
        }),
        frameRate: definition.frameRate,
        repeat: definition.repeat
      });
    });
  }

  public playIdle(): void {
    this.setMovementState(false);
  }

  public playFly(): void {
    this.setMovementState(true);
  }

  public setMovementState(isMoving: boolean): void {
    this.movementState = isMoving ? 'fly' : 'idle';

    if (this.locked || this.defeated || !this.canAnimate()) {
      return;
    }

    this.playLoop(this.movementState === 'fly' ? 'fly' : 'idle');
  }

  public playHit(): Promise<void> {
    if (this.defeated || !this.canAnimate()) {
      return Promise.resolve();
    }

    return this.playOneShot('hit', true);
  }

  public playDie(): Promise<void> {
    if (this.defeated || !this.canAnimate()) {
      return Promise.resolve();
    }

    this.defeated = true;
    return this.playOneShot('die', false);
  }

  public playSmashStart(): Promise<void> {
    if (this.defeated || !this.canAnimate()) {
      return Promise.resolve();
    }

    return this.playOneShot('smashStart', false);
  }

  public playSmashLoop(): void {
    if (this.defeated || !this.canAnimate()) {
      return;
    }

    this.locked = true;
    this.playLoop('smashLoop');
  }

  public playSmashEnd(): Promise<void> {
    if (this.defeated || !this.canAnimate()) {
      return Promise.resolve();
    }

    return this.playOneShot('smashEnd', true);
  }

  public dispose(): void {
    this.disposed = true;
    this.locked = false;
  }

  private playLoop(state: BossAnimationState): void {
    if (!this.canAnimate()) {
      return;
    }

    const definition = bossAnimationConfig[state];
    const animState = this.boss.anims;

    if (animState?.currentAnim?.key === definition.animationKey && animState.isPlaying) {
      return;
    }

    this.boss.play(definition.animationKey, true);
  }

  private playOneShot(state: BossAnimationState, unlockAfter: boolean): Promise<void> {
    if (!this.canAnimate()) {
      return Promise.resolve();
    }

    const definition = bossAnimationConfig[state];
    this.locked = true;

    return new Promise((resolve) => {
      const completeEvent = `${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${definition.animationKey}`;
      const handleComplete = (): void => handleFinish(false);
      const handleStop = (): void => handleFinish(true);

      const handleFinish = (interrupted: boolean): void => {
        this.boss.off(completeEvent, handleComplete);
        this.boss.off(Phaser.Animations.Events.ANIMATION_STOP, handleStop);

        if (unlockAfter || interrupted) {
          this.locked = false;
          if (this.canAnimate()) {
            this.setMovementState(this.movementState === 'fly');
          }
        }

        resolve();
      };

      this.boss.once(completeEvent, handleComplete);
      this.boss.once(Phaser.Animations.Events.ANIMATION_STOP, handleStop);

      this.boss.play(definition.animationKey, true);
    });
  }

  private canAnimate(): boolean {
    return Boolean(
      !this.disposed &&
        this.boss.active &&
        this.boss.scene &&
        this.boss.scene.sys &&
        this.boss.scene.sys.isActive() &&
        this.boss.anims
    );
  }
}
