import Phaser from 'phaser';
import { AnswerPickup } from '../entities/AnswerPickup';
import { Question } from '../types/Question';

export class AnswerResetSystem {
  private items: AnswerPickup[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly platforms: Phaser.GameObjects.Rectangle[]
  ) {}

  public spawnPendingAnswers(
    question: Question,
    positions: Phaser.Math.Vector2[]
  ): AnswerPickup[] {
    this.clearAnswers();

    question.opcoes.forEach((option, index) => {
      const position = positions[index] ?? positions[positions.length - 1];
      const item = new AnswerPickup(
        this.scene,
        position.x,
        position.y,
        option.id,
        option.texto
      );

      this.platforms.forEach((platform) => {
        this.scene.physics.add.collider(item, platform);
      });

      item.setPending(position.x, position.y);
      this.items.push(item);
    });

    return this.getItems();
  }

  public getItems(): AnswerPickup[] {
    return this.items.filter((item) => item.active);
  }

  public getCollectibleItems(): AnswerPickup[] {
    return this.getItems().filter((item) => item.isCollectible());
  }

  public clearAnswers(): void {
    this.items.forEach((item) => {
      if (item.active) {
        item.destroy();
      }
    });

    this.items = [];
  }
}
