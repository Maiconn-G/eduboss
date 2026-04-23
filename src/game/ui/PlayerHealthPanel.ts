import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

export class PlayerHealthPanel extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly healthPips: Phaser.GameObjects.Graphics[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    currentHealth: number,
    maxHealth: number
  ) {
    super(scene, x, y);

    this.panel = new UiPanel(scene, 0, 0, 250, 76, 'hud');

    const label = scene.add
      .text(-98, -11, 'Vida', getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0, 0.5);
    this.valueText = scene.add
      .text(-98, 12, '', getTextStyle('bodyMuted'))
      .setOrigin(0, 0.5);

    this.add([this.panel, label, this.valueText]);

    for (let index = 0; index < maxHealth; index += 1) {
      const pip = scene.add.graphics();
      pip.setPosition(42 + index * 30, 0);
      this.healthPips.push(pip);
      this.add(pip);
    }

    this.setDepth(40);
    scene.add.existing(this);
    this.updateHealth(currentHealth, maxHealth);
  }

  public updateHealth(currentHealth: number, maxHealth: number): void {
    this.valueText.setText(`${currentHealth}/${maxHealth}`);
    this.healthPips.forEach((pip, index) => {
      const active = index < currentHealth;
      pip.clear();
      pip.fillStyle(active ? uiTheme.colors.successSoft : uiTheme.colors.dangerSoft, 1);
      pip.lineStyle(2, active ? uiTheme.colors.success : uiTheme.colors.danger, 0.95);
      pip.fillRoundedRect(-11, -11, 22, 22, 8);
      pip.strokeRoundedRect(-11, -11, 22, 22, 8);
    });
  }
}
