import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { PlayerAnimationController } from '../systems/PlayerAnimationController';
import { AnswerPickup } from './AnswerPickup';

type PlayerKeys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  collect: Phaser.Input.Keyboard.Key;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare public body: Phaser.Physics.Arcade.Body;

  private readonly animationController: PlayerAnimationController;

  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: PlayerKeys;
  private carriedAnswer?: AnswerPickup;
  private controlsEnabled = true;
  private attacking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 1);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(10);
    this.setDisplaySize(80, 80);

    this.body.setCollideWorldBounds(true);
    this.body.setSize(36, 62);
    this.body.setOffset(30, 26);
    this.body.setMaxVelocity(balanceConfig.playerSpeed, balanceConfig.gravity * 2);

    this.cursors = scene.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.keys = scene.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      collect: Phaser.Input.Keyboard.KeyCodes.E
    }) as PlayerKeys;

    this.animationController = new PlayerAnimationController(scene, this);
  }

  public update(): void {
    if (!this.controlsEnabled) {
      this.body.setVelocityX(0);
      this.syncCarriedAnswer();
      this.animationController.update();
      return;
    }

    const moveLeft = this.cursors.left.isDown || this.keys.left.isDown;
    const moveRight = this.cursors.right.isDown || this.keys.right.isDown;

    if (moveLeft) {
      this.body.setVelocityX(-balanceConfig.playerSpeed);
    } else if (moveRight) {
      this.body.setVelocityX(balanceConfig.playerSpeed);
    } else {
      this.body.setVelocityX(0);
    }

    const isJumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jump);

    if (isJumpPressed && (this.body.blocked.down || this.body.touching.down)) {
      this.body.setVelocityY(-balanceConfig.jumpForce);
    }

    this.syncCarriedAnswer();
    this.animationController.update();
  }

  public consumeCollectIntent(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.collect);
  }

  public pickupAnswer(answer: AnswerPickup): boolean {
    if (this.carriedAnswer) {
      return false;
    }

    this.carriedAnswer = answer;
    answer.setCarried(true);
    this.syncCarriedAnswer();
    this.animationController.update();
    return true;
  }

  public hasCarriedAnswer(): boolean {
    return Boolean(this.carriedAnswer);
  }

  public isCarryingAnswer(): boolean {
    return Boolean(this.carriedAnswer);
  }

  public consumeCarriedAnswer(): AnswerPickup | undefined {
    const answer = this.carriedAnswer;
    this.carriedAnswer = undefined;
    this.animationController.update();
    return answer;
  }

  public clearCarriedAnswer(): void {
    if (this.carriedAnswer?.active) {
      this.carriedAnswer.destroy();
    }

    this.carriedAnswer = undefined;
    this.animationController.update();
  }

  public setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;

    if (!enabled) {
      this.body.setVelocityX(0);
    }
  }

  public startAttack(): void {
    this.attacking = true;
    this.animationController.update();
  }

  public stopAttack(): void {
    this.attacking = false;
    this.animationController.update();
  }

  public isAttacking(): boolean {
    return this.attacking;
  }

  public isOnGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  public getVelocityX(): number {
    return this.body.velocity.x;
  }

  public getVelocityY(): number {
    return this.body.velocity.y;
  }

  public getCenterPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }

  private syncCarriedAnswer(): void {
    if (!this.carriedAnswer || !this.carriedAnswer.active) {
      this.carriedAnswer = undefined;
      return;
    }

    this.carriedAnswer.followCarrier(this.x, this.y - this.displayHeight * 0.8);
  }
}
