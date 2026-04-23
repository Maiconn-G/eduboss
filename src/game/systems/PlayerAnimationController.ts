import Phaser from 'phaser';
import { Player } from '../entities/Player';

export const PLAYER_ANIMATION_KEYS = {
  idle: 'player-idle',
  runLeft: 'player-run-left',
  runRight: 'player-run-right',
  jumpUp: 'player-jump-up',
  jumpApex: 'player-jump-apex',
  jumpDown: 'player-jump-down',
  airLeft: 'player-air-left',
  airRight: 'player-air-right',
  attack: 'player-attack'
} as const;

export class PlayerAnimationController {
  private readonly animationCompleteHandler: (
    animation: Phaser.Animations.Animation
  ) => void;

  constructor(private readonly scene: Phaser.Scene, private readonly player: Player) {
    this.animationCompleteHandler = (animation) => {
      if (animation.key === PLAYER_ANIMATION_KEYS.attack) {
        this.player.stopAttack();
      }
    };

    this.player.on(Phaser.Animations.Events.ANIMATION_COMPLETE, this.animationCompleteHandler);
    this.update();
  }

  public static registerAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists(PLAYER_ANIMATION_KEYS.idle)) {
      return;
    }

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.idle,
      frames: [{ key: 'player', frame: 1 }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.runLeft,
      frames: scene.anims.generateFrameNumbers('player', {
        frames: [3, 4, 5]
      }),
      frameRate: 10,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.runRight,
      frames: scene.anims.generateFrameNumbers('player', {
        frames: [6, 7, 8]
      }),
      frameRate: 10,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.attack,
      frames: scene.anims.generateFrameNumbers('player', {
        frames: [9, 10, 11]
      }),
      frameRate: 14,
      repeat: 0
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.jumpUp,
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.jumpApex,
      frames: [{ key: 'player', frame: 1 }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.jumpDown,
      frames: [{ key: 'player', frame: 2 }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.airLeft,
      frames: [{ key: 'player', frame: 5 }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: PLAYER_ANIMATION_KEYS.airRight,
      frames: [{ key: 'player', frame: 8 }],
      frameRate: 1,
      repeat: -1
    });
  }

  public update(): void {
    const velocityX = this.player.getVelocityX();
    const velocityY = this.player.getVelocityY();
    const isOnGround = this.player.isOnGround();
    const isCarryingAnswer = this.player.isCarryingAnswer();
    const isAttacking = this.player.isAttacking();

    if (isAttacking) {
      if (this.player.anims.currentAnim?.key !== PLAYER_ANIMATION_KEYS.attack) {
        this.player.play(PLAYER_ANIMATION_KEYS.attack, true);
      }
      return;
    }

    if (!isOnGround) {
      this.applyAirAnimation(velocityX, velocityY, isCarryingAnswer);
      return;
    }

    if (Math.abs(velocityX) < 8) {
      this.playStaticFrame(1);
      return;
    }

    if (velocityX < 0) {
      this.player.play(PLAYER_ANIMATION_KEYS.runLeft, true);
      return;
    }

    this.player.play(PLAYER_ANIMATION_KEYS.runRight, true);
  }

  private applyAirAnimation(
    velocityX: number,
    velocityY: number,
    isCarryingAnswer: boolean
  ): void {
    const horizontalThreshold = isCarryingAnswer ? 22 : 12;

    if (velocityX < -horizontalThreshold) {
      this.playStaticFrame(5);
      return;
    }

    if (velocityX > horizontalThreshold) {
      this.playStaticFrame(8);
      return;
    }

    if (velocityY < -20) {
      this.playStaticFrame(0);
      return;
    }

    if (Math.abs(velocityY) <= 20) {
      this.playStaticFrame(1);
      return;
    }

    this.playStaticFrame(2);
  }

  private playStaticFrame(frame: number): void {
    if (this.player.anims.isPlaying) {
      this.player.anims.stop();
    }

    this.player.setFrame(frame);
  }
}
