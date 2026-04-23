import Phaser from 'phaser';
import { DifficultySettings } from '../config/difficultyConfig';
import { AnswerPickup } from '../entities/AnswerPickup';

export class AnswerDropSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly difficulty: Pick<
      DifficultySettings,
      'answerDropMinXVelocity' | 'answerDropMaxXVelocity' | 'answerDropInitialYVelocity'
    >
  ) {}

  public async launchAnswers(items: AnswerPickup[]): Promise<void> {
    items.forEach((item, index) => {
      const velocityX = Phaser.Math.Between(
        this.difficulty.answerDropMinXVelocity,
        this.difficulty.answerDropMaxXVelocity
      );
      const velocityY =
        this.difficulty.answerDropInitialYVelocity + Phaser.Math.Between(-60, 40);

      this.scene.time.delayedCall(index * 35, () => {
        if (!item.active) {
          return;
        }

        item.startDrop(velocityX, velocityY);
      });
    });

    await this.wait(420 + items.length * 35);
  }

  public update(items: AnswerPickup[]): void {
    items.forEach((item) => {
      if (item.isDropping() && item.hasTouchedSurface()) {
        item.setAvailable();
      }

      if (item.isCollectible()) {
        item.settleMotion();
      }
    });

    this.separateSettledPickups(items);
  }

  private wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(delayMs, () => resolve());
    });
  }

  private separateSettledPickups(items: AnswerPickup[]): void {
    const settledItems = items.filter((item) => item.isCollectible() && item.isSettled());

    for (let index = 0; index < settledItems.length; index += 1) {
      for (let inner = index + 1; inner < settledItems.length; inner += 1) {
        const first = settledItems[index];
        const second = settledItems[inner];

        if (
          Phaser.Geom.Intersects.RectangleToRectangle(first.getBounds(), second.getBounds()) &&
          Math.abs(first.y - second.y) < 30
        ) {
          const direction = first.x <= second.x ? -1 : 1;
          const separation = 8;

          first.x += direction * separation;
          second.x -= direction * separation;
          first.body.reset(first.x, first.y);
          second.body.reset(second.x, second.y);
        }
      }
    }
  }
}
