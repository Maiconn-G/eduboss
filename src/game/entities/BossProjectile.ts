import Phaser from 'phaser';

export class BossProjectile extends Phaser.GameObjects.Arc {
  declare public body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 10, 0, 360, false, 0xfb7185, 1);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(12);
    this.setStrokeStyle(2, 0xffedd5, 0.95);

    this.body.setAllowGravity(false);
    this.body.setCircle(10);
  }

  public launch(origin: Phaser.Math.Vector2, target: Phaser.Math.Vector2, speed = 280): void {
    this.setPosition(origin.x, origin.y);

    const direction = target.clone().subtract(origin);
    if (direction.lengthSq() === 0) {
      direction.set(1, 0);
    }

    direction.normalize().scale(speed);
    this.body.setVelocity(direction.x, direction.y);
  }

  public getVelocityVector(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.body.velocity.x, this.body.velocity.y);
  }

  public isOutOfBounds(width: number, height: number): boolean {
    const margin = 64;
    return (
      this.x < -margin ||
      this.x > width + margin ||
      this.y < -margin ||
      this.y > height + margin
    );
  }
}
