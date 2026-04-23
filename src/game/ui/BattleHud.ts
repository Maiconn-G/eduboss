import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

export class BattleHud extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly separators: Phaser.GameObjects.Graphics;
  private readonly bossTrack: Phaser.GameObjects.Graphics;
  private readonly bossFill: Phaser.GameObjects.Graphics;
  private readonly bossValueText: Phaser.GameObjects.Text;
  private readonly healthValueText: Phaser.GameObjects.Text;
  private readonly scoreValueText: Phaser.GameObjects.Text;
  private readonly healthPips: Phaser.GameObjects.Graphics[] = [];
  private readonly bossBarWidth = 290;
  private readonly bossBarHeight = 18;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bossCurrentHP: number,
    bossMaxHP: number,
    currentHealth: number,
    maxHealth: number,
    score: number
  ) {
    super(scene, x, y);

    this.panel = new UiPanel(scene, 0, 0, 676, 82, 'hud');
    this.separators = scene.add.graphics();
    this.bossTrack = scene.add.graphics();
    this.bossFill = scene.add.graphics();

    const bossLabel = scene.add
      .text(-305, -16, 'Boss HP', getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0, 0.5);
    this.bossValueText = scene.add
      .text(-160, 13, '', getTextStyle('sectionLabel', { color: '#fef2f2' }))
      .setOrigin(0.5);

    const healthLabel = scene.add
      .text(30, -16, 'Vida', getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0, 0.5);
    this.healthValueText = scene.add
      .text(30, 13, '', getTextStyle('bodyMuted'))
      .setOrigin(0, 0.5);

    const scoreLabel = scene.add
      .text(245, -16, 'Score', getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0, 0.5);
    this.scoreValueText = scene.add
      .text(245, 14, '', getTextStyle('numeric'))
      .setOrigin(0, 0.5);

    this.add([
      this.panel,
      this.separators,
      this.bossTrack,
      this.bossFill,
      bossLabel,
      this.bossValueText,
      healthLabel,
      this.healthValueText,
      scoreLabel,
      this.scoreValueText
    ]);

    for (let index = 0; index < maxHealth; index += 1) {
      const pip = scene.add.graphics().setPosition(120 + index * 30, -6);
      this.healthPips.push(pip);
      this.add(pip);
    }

    scene.add.existing(this);
    this.setDepth(40);

    this.redrawChrome();
    this.updateBoss(bossCurrentHP, bossMaxHP);
    this.updateHealth(currentHealth, maxHealth);
    this.updateScore(score);
  }

  public updateBoss(currentHP: number, maxHP: number): void {
    const progress = Phaser.Math.Clamp(currentHP / maxHP, 0, 1);
    const fillWidth = this.bossBarWidth * progress;
    const left = -305;
    const top = 4;

    this.bossFill.clear();
    if (fillWidth > 0) {
      this.bossFill.fillStyle(uiTheme.colors.danger, 1);
      this.bossFill.fillRoundedRect(left, top, fillWidth, this.bossBarHeight, 11);
    }

    this.bossValueText.setText(`${currentHP}/${maxHP}`);
  }

  public updateHealth(currentHealth: number, maxHealth: number): void {
    this.healthValueText.setText(`${currentHealth}/${maxHealth}`);
    this.healthPips.forEach((pip, index) => {
      const active = index < currentHealth;
      pip.clear();
      pip.fillStyle(active ? uiTheme.colors.successSoft : uiTheme.colors.dangerSoft, 1);
      pip.lineStyle(2, active ? uiTheme.colors.success : uiTheme.colors.danger, 0.96);
      pip.fillRoundedRect(-10, -10, 20, 20, 8);
      pip.strokeRoundedRect(-10, -10, 20, 20, 8);
    });
  }

  public updateScore(score: number): void {
    this.scoreValueText.setText(String(score));
  }

  private redrawChrome(): void {
    this.separators.clear();
    this.separators.lineStyle(2, uiTheme.colors.borderMuted, 0.34);
    this.separators.lineBetween(0, -26, 0, 26);
    this.separators.lineBetween(215, -26, 215, 26);

    this.bossTrack.clear();
    this.bossTrack.fillStyle(uiTheme.panels.hud.accentColor, 1);
    this.bossTrack.fillRoundedRect(-305, 4, this.bossBarWidth, this.bossBarHeight, 11);
  }
}
