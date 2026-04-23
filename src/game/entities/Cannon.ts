import Phaser from 'phaser';

const CANNON_ZONE_WIDTH = 118;
const CANNON_ZONE_HEIGHT = 86;
const CANNON_SPRITE_SIZE = 116;
// The cannon sprite file includes a large transparent padding below the visible base.
// This compensates that extra area so the visible cannon sits on the ground line.
const CANNON_SPRITE_BOTTOM_OFFSET = 74;
const CANNON_SHADOW_OFFSET_Y = 40;
const CANNON_SHADOW_WIDTH = 76;
const CANNON_SHADOW_HEIGHT = 20;

export class Cannon extends Phaser.GameObjects.Zone {
  declare public body: Phaser.Physics.Arcade.Body;

  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CANNON_ZONE_WIDTH, CANNON_ZONE_HEIGHT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(7);

    this.shadow = scene.add
      .ellipse(
        x,
        y + CANNON_SHADOW_OFFSET_Y,
        CANNON_SHADOW_WIDTH,
        CANNON_SHADOW_HEIGHT,
        0x0f172a,
        0.18
      )
      .setDepth(6);

    const textureKey = scene.textures.exists('cannon') ? 'cannon' : '__WHITE';
    this.sprite = scene.add
      .image(x, y + CANNON_SPRITE_BOTTOM_OFFSET, textureKey)
      .setOrigin(0.5, 1)
      .setDepth(7);

    if (textureKey === 'cannon') {
      this.sprite.setDisplaySize(CANNON_SPRITE_SIZE, CANNON_SPRITE_SIZE);
    } else {
      this.sprite.setDisplaySize(120, 90).setTint(0x6b7280);
    }

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;
    this.body.setSize(this.width, this.height);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.syncVisualPosition, this);
  }

  public playFireAnimation(): void {
    const baseScaleX = this.sprite.scaleX;
    const baseScaleY = this.sprite.scaleY;

    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.shadow);
    this.sprite.setScale(baseScaleX, baseScaleY);
    this.shadow.setScale(1);

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: baseScaleX * 0.93,
      scaleY: baseScaleY * 1.08,
      yoyo: true,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.sprite.active) {
          this.sprite.setScale(baseScaleX, baseScaleY);
        }
      }
    });

    this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 1.08,
      scaleY: 0.9,
      alpha: 0.12,
      yoyo: true,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.shadow.active) {
          this.shadow.setScale(1);
          this.shadow.setAlpha(0.18);
        }
      }
    });
  }

  public override destroy(fromScene?: boolean): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.syncVisualPosition, this);
    this.shadow.destroy();
    this.sprite.destroy();
    super.destroy(fromScene);
  }

  private syncVisualPosition(): void {
    if (!this.active) {
      return;
    }

    if (this.shadow.active) {
      this.shadow.setPosition(this.x, this.y + CANNON_SHADOW_OFFSET_Y);
    }

    if (this.sprite.active) {
      this.sprite.setPosition(this.x, this.y + CANNON_SPRITE_BOTTOM_OFFSET);
    }
  }
}
