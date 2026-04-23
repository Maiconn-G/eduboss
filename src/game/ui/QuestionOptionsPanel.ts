import Phaser from 'phaser';
import { QuestionOption } from '../types/Question';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { QuestionOptionItem } from './QuestionOptionItem';

export class QuestionOptionsPanel extends Phaser.GameObjects.Container {
  private readonly itemWidth: number;
  private items = new Map<string, QuestionOptionItem>();
  private optionOrder: string[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, itemWidth: number) {
    super(scene, x, y);
    this.itemWidth = itemWidth;

    scene.add.existing(this);
  }

  public setOptions(options: QuestionOption[]): void {
    this.clearOptions();
    this.optionOrder = options.map((option) => option.id);

    let nextY = 0;
    options.forEach((option, index) => {
      const item = new QuestionOptionItem(
        this.scene,
        0,
        0,
        option.id,
        option.id,
        option.texto,
        this.itemWidth,
        index % 2
      );

      nextY += item.getItemHeight() / 2;
      item.setPosition(0, nextY);
      this.items.set(option.id, item);
      this.add(item);
      nextY += item.getItemHeight() / 2 + 8;
    });
  }

  public setOptionState(optionId: string, state: QuestionOptionState): void {
    this.items.get(optionId)?.setOptionState(state);
  }

  public pulseWrongAndRevert(optionId: string, revertState: QuestionOptionState): void {
    this.items.get(optionId)?.pulseWrongAndRevert(revertState);
  }

  public setAllOptionsState(state: QuestionOptionState): void {
    this.items.forEach((item) => item.setOptionState(state));
  }

  public getPanelHeight(): number {
    if (this.optionOrder.length === 0) {
      return 0;
    }

    return this.optionOrder.reduce((total, optionId, index) => {
      const item = this.items.get(optionId);
      if (!item) {
        return total;
      }

      return total + item.getItemHeight() + (index < this.optionOrder.length - 1 ? 8 : 0);
    }, 0);
  }

  public clearOptions(): void {
    this.items.forEach((item) => item.destroy());
    this.items.clear();
    this.optionOrder = [];
    this.removeAll(true);
  }
}
