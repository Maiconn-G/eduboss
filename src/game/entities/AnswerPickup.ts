import Phaser from 'phaser';
import { UiBadge } from '../ui/UiBadge';

export type AnswerPickupState =
  | 'pending'
  | 'dropping'
  | 'available'
  | 'carried'
  | 'submitted'
  | 'correct'
  | 'wrong';

export class AnswerPickup extends Phaser.GameObjects.Container {
  declare public body: Phaser.Physics.Arcade.Body;

  public readonly optionId: string;
  public readonly optionText: string;
  public readonly label: string;

  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly bodyShadow: Phaser.GameObjects.Graphics;
  private readonly pinBody: Phaser.GameObjects.Graphics;
  private readonly topShine: Phaser.GameObjects.Graphics;
  private readonly badge: UiBadge;
  private pickupState: AnswerPickupState = 'pending';
  private settled = false;
  private idleTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    optionId: string,
    optionText: string
  ) {
    super(scene, x, y);

    this.optionId = optionId;
    this.optionText = optionText;
    this.label = optionId.toUpperCase();

    this.shadow = scene.add.ellipse(0, 32, 38, 12, 0x0f172a, 0.08);
    this.bodyShadow = scene.add.graphics();
    this.pinBody = scene.add.graphics();
    this.topShine = scene.add.graphics();
    this.badge = new UiBadge(scene, 0, -4, this.label, 18);

    this.add([this.shadow, this.bodyShadow, this.pinBody, this.topShine, this.badge]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(11);
    this.body.setCollideWorldBounds(true);
    this.body.setSize(38, 54);
    this.body.setOffset(-19, -26);
    this.body.setBounce(0.08, 0.04);
    this.body.setDamping(true);
    this.body.setDrag(0.018, 0);

    this.redrawBody(0xfefefe, 0xdbeafe, 0.9);
    this.setPending(x, y);
  }

  public getState(): AnswerPickupState {
    return this.pickupState;
  }

  public isCollectible(): boolean {
    return this.pickupState === 'available';
  }

  public isDropping(): boolean {
    return this.pickupState === 'dropping';
  }

  public isSettled(): boolean {
    return this.settled;
  }

  public setPending(x: number, y: number): void {
    this.stopIdleTween();
    this.pickupState = 'pending';
    this.settled = false;
    this.setPosition(x, y);
    this.setScale(0.88);
    this.setAlpha(0);
    this.shadow.setAlpha(0);
    this.badge.setVariant('primary');
    this.redrawBody(0xffffff, 0xdbeafe, 0.92);

    this.body.stop();
    this.body.enable = true;
    this.body.moves = false;
    this.body.allowGravity = false;
    this.body.checkCollision.none = true;
    this.body.setImmovable(true);
  }

  public startDrop(velocityX: number, velocityY: number): void {
    this.stopIdleTween();
    this.pickupState = 'dropping';
    this.settled = false;
    this.setAlpha(1);
    this.shadow.setAlpha(0.12);
    this.badge.setVariant('primary');
    this.redrawBody(0xffffff, 0xcfe3ff, 0.96);

    this.body.enable = true;
    this.body.moves = true;
    this.body.allowGravity = true;
    this.body.checkCollision.none = false;
    this.body.setImmovable(false);
    this.body.setBounce(0.05, 0.03);
    this.body.setDrag(0.012, 0);
    this.body.setVelocity(velocityX, velocityY);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 140,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  public setAvailable(): void {
    if (this.pickupState !== 'dropping') {
      return;
    }

    this.stopIdleTween();
    this.pickupState = 'available';
    this.settled = true;
    this.badge.setVariant('correct');
    this.redrawBody(0xffffff, 0xdcfce7, 1);
    this.body.setBounce(0.01, 0);
    this.body.setDrag(0.12, 0);

    if (Math.abs(this.body.velocity.x) < 36) {
      this.body.setVelocityX(0);
    }

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 120,
      yoyo: true
    });

    this.startIdleTween();
  }

  public settleMotion(): void {
    if (this.pickupState !== 'available') {
      return;
    }

    if (Math.abs(this.body.velocity.x) < 10 && Math.abs(this.body.velocity.y) < 12) {
      this.body.setVelocity(0, 0);
      this.body.setDrag(0.18, 0);
    }
  }

  public setCarried(carried: boolean): void {
    this.stopIdleTween();

    if (carried) {
      this.pickupState = 'carried';
      this.settled = false;
      this.badge.setVariant('submitted');
      this.redrawBody(0xfffbeb, 0xfef3c7, 1);
      this.shadow.setAlpha(0.07);
      this.body.stop();
      this.body.enable = false;
      this.body.allowGravity = false;
      this.body.checkCollision.none = true;

      this.scene.tweens.add({
        targets: this,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
        yoyo: true
      });
      return;
    }

    this.pickupState = 'available';
    this.badge.setVariant('correct');
    this.redrawBody(0xffffff, 0xdcfce7, 1);
    this.body.enable = true;
    this.body.allowGravity = true;
    this.body.checkCollision.none = false;
    this.startIdleTween();
  }

  public hasTouchedSurface(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  public followCarrier(targetX: number, targetY: number): void {
    if (this.pickupState !== 'carried') {
      return;
    }

    this.setPosition(targetX, targetY);
  }

  public override destroy(fromScene?: boolean): void {
    this.stopIdleTween();
    super.destroy(fromScene);
  }

  private redrawBody(fillColor: number, accentColor: number, alpha: number): void {
    this.bodyShadow.clear();
    this.bodyShadow.fillStyle(0x0f172a, 0.08);
    this.bodyShadow.fillEllipse(0, 4, 54, 48);
    this.bodyShadow.fillTriangle(-10, 20, 10, 20, 0, 38);

    this.pinBody.clear();
    this.pinBody.fillStyle(fillColor, alpha);
    this.pinBody.lineStyle(2, 0x94a3b8, 0.24);
    this.pinBody.fillEllipse(0, 0, 56, 52);
    this.pinBody.strokeEllipse(0, 0, 56, 52);
    this.pinBody.fillStyle(fillColor, alpha);
    this.pinBody.fillTriangle(-11, 20, 11, 20, 0, 38);
    this.pinBody.lineStyle(2, 0x94a3b8, 0.24);
    this.pinBody.strokeTriangle(-11, 20, 11, 20, 0, 38);

    this.pinBody.lineStyle(0, 0x000000, 0);
    this.pinBody.fillStyle(accentColor, 0.18);
    this.pinBody.fillEllipse(0, -4, 48, 42);

    this.topShine.clear();
    this.topShine.fillStyle(0xffffff, 0.48);
    this.topShine.fillEllipse(-4, -10, 22, 10);
  }

  private startIdleTween(): void {
    if (this.idleTween || this.pickupState !== 'available') {
      return;
    }

    this.idleTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private stopIdleTween(): void {
    this.idleTween?.stop();
    this.idleTween = undefined;
  }
}
