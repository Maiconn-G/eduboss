import Phaser from 'phaser';

export type AnswerItemState = 'pending' | 'dropping' | 'available' | 'carried';

export class AnswerItem extends Phaser.GameObjects.Rectangle {
  declare public body: Phaser.Physics.Arcade.Body;

  public readonly optionId: string;
  public readonly optionText: string;

  private readonly label: Phaser.GameObjects.Text;
  private answerState: AnswerItemState = 'pending';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    optionId: string,
    optionText: string
  ) {
    super(scene, x, y, 120, 48, 0x22c55e);

    this.optionId = optionId;
    this.optionText = optionText;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setStrokeStyle(2, 0x14532d, 1);
    this.setDepth(6);

    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.06);
    this.body.setSize(this.width, this.height);

    this.label = scene.add
      .text(x, y, optionText, {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#052e16',
        align: 'center',
        wordWrap: { width: 102 }
      })
      .setOrigin(0.5)
      .setDepth(7);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.syncLabelPosition, this);
    this.setPending(x, y);
  }

  public getState(): AnswerItemState {
    return this.answerState;
  }

  public isCollectible(): boolean {
    return this.answerState === 'available';
  }

  public isDropping(): boolean {
    return this.answerState === 'dropping';
  }

  public setPending(x: number, y: number): void {
    this.answerState = 'pending';
    this.setPosition(x, y);
    this.setScale(1);
    this.setAlpha(0.96);
    this.setFillStyle(0x86efac, 1);

    this.body.stop();
    this.body.enable = true;
    this.body.moves = false;
    this.body.allowGravity = false;
    this.body.checkCollision.none = true;
    this.body.setImmovable(true);
  }

  public startDrop(velocityX: number, velocityY: number): void {
    this.answerState = 'dropping';
    this.setFillStyle(0x4ade80, 1);
    this.setAlpha(1);

    this.body.enable = true;
    this.body.moves = true;
    this.body.allowGravity = true;
    this.body.checkCollision.none = false;
    this.body.setImmovable(false);
    this.body.setVelocity(velocityX, velocityY);
  }

  public setAvailable(): void {
    if (this.answerState !== 'dropping') {
      return;
    }

    this.answerState = 'available';
    this.setFillStyle(0x22c55e, 1);
  }

  public setCarried(carried: boolean): void {
    if (carried) {
      this.answerState = 'carried';
      this.setFillStyle(0x4ade80, 1);
      this.body.stop();
      this.body.enable = false;
      this.body.allowGravity = false;
      this.body.checkCollision.none = true;
      return;
    }

    this.answerState = 'available';
    this.setFillStyle(0x22c55e, 1);
    this.body.enable = true;
    this.body.allowGravity = true;
    this.body.checkCollision.none = false;
  }

  public hasTouchedSurface(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  public followCarrier(targetX: number, targetY: number): void {
    if (this.answerState !== 'carried') {
      return;
    }

    this.setPosition(targetX, targetY);
  }

  public override destroy(fromScene?: boolean): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.syncLabelPosition, this);
    this.label.destroy();
    super.destroy(fromScene);
  }

  private syncLabelPosition(): void {
    if (!this.active || !this.label.active) {
      return;
    }

    this.label.setPosition(this.x, this.y);
  }
}
