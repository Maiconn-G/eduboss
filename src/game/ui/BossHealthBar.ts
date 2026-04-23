import Phaser from 'phaser';
import { UiProgressBar } from './UiProgressBar';

export class BossHealthBar extends Phaser.GameObjects.Container {
  private readonly progressBar: UiProgressBar;

  constructor(scene: Phaser.Scene, currentHP: number, maxHP: number) {
    super(scene, scene.scale.width / 2, 42);

    this.progressBar = new UiProgressBar(scene, 0, 0, {
      width: 328,
      label: 'Boss HP',
      valueFormatter: (current, max) => `${current}/${max}`
    });

    this.add(this.progressBar);
    this.setDepth(40);
    scene.add.existing(this);

    this.update(currentHP, maxHP);
  }

  public update(currentHP: number, maxHP: number): void {
    this.progressBar.setValue(currentHP, maxHP);
  }
}
