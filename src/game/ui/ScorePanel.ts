import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

export class ScorePanel extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly valueText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, initialScore: number) {
    super(scene, x, y);

    this.panel = new UiPanel(scene, 0, 0, 206, 76, 'hud');

    const label = scene.add
      .text(-72, -11, 'Score', getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0, 0.5);
    this.valueText = scene.add
      .text(-72, 14, String(initialScore), getTextStyle('numeric'))
      .setOrigin(0, 0.5);

    this.add([this.panel, label, this.valueText]);
    this.setDepth(40);
    scene.add.existing(this);
  }

  public updateScore(score: number): void {
    this.valueText.setText(String(score));
  }
}
