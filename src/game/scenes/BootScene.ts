import Phaser from 'phaser';
import playerSpriteSheetUrl from '../../../assets/images/player.png';
import { BossAnimationController } from '../systems/BossAnimationController';
import { PlayerAnimationController } from '../systems/PlayerAnimationController';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    if (!this.textures.exists('player-source') && !this.textures.exists('player')) {
      this.load.image('player-source', playerSpriteSheetUrl);
    }

    BossAnimationController.preload(this);
  }

  public create(): void {
    this.preparePlayerSpriteSheet();
    PlayerAnimationController.registerAnimations(this);
    BossAnimationController.registerAnimations(this);
    this.scene.start('LobbyScene');
  }

  private preparePlayerSpriteSheet(): void {
    if (this.textures.exists('player')) {
      return;
    }

    const sourceTexture = this.textures.get('player-source');
    const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement;
    const frameWidth = Math.floor(sourceImage.width / 3);
    const frameHeight = Math.floor(sourceImage.height / 4);

    this.textures.addSpriteSheet('player', sourceImage, {
      frameWidth,
      frameHeight,
      endFrame: 11
    });
  }
}
