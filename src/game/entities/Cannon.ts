import Phaser from 'phaser';

export class Cannon extends Phaser.GameObjects.Rectangle {
  declare public body: Phaser.Physics.Arcade.Body;

  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 120, 90, 0x6b7280);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setStrokeStyle(3, 0x1f2937, 1);
    this.setDepth(7);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;
    this.body.setSize(this.width, this.height);

    this.label = scene.add
      .text(x, y, 'CANHAO', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#f9fafb',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(8);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.syncLabelPosition, this);
  }

  public playFireAnimation(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 0.9,
      yoyo: true,
      duration: 120
    });
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
