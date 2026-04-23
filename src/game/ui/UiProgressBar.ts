import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type UiProgressBarConfig = {
  width: number;
  label: string;
  valueFormatter?: (current: number, max: number) => string;
  fillColor?: number;
  trackColor?: number;
};

export class UiProgressBar extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly barWidth: number;
  private readonly barHeight: number;
  private readonly fillColor: number;
  private readonly trackColor: number;
  private readonly valueFormatter: (current: number, max: number) => string;

  constructor(scene: Phaser.Scene, x: number, y: number, config: UiProgressBarConfig) {
    super(scene, x, y);

    this.barWidth = config.width;
    this.barHeight = uiTheme.progressBar.height;
    this.fillColor = config.fillColor ?? uiTheme.colors.danger;
    this.trackColor = config.trackColor ?? uiTheme.panels.hud.accentColor;
    this.valueFormatter = config.valueFormatter ?? ((current, max) => `${current}/${max}`);

    const shellWidth = this.barWidth + uiTheme.progressBar.shellPadding * 2 + 10;
    const shellHeight = 70;

    this.panel = new UiPanel(scene, 0, 0, shellWidth, shellHeight, 'hud');
    this.track = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.labelText = scene.add
      .text(0, -22, config.label, getTextStyle('panelTitle', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0.5);
    this.valueText = scene.add
      .text(0, 1, '', getTextStyle('sectionLabel', { color: uiTheme.colors.textPrimary }))
      .setOrigin(0.5);

    this.add([this.panel, this.track, this.fill, this.labelText, this.valueText]);
    scene.add.existing(this);
    this.setDepth(40);
    this.redrawTrack();
  }

  public setValue(current: number, max: number): void {
    const progress = Phaser.Math.Clamp(current / max, 0, 1);
    const fillWidth = this.barWidth * progress;
    const left = -this.barWidth / 2;

    this.fill.clear();
    if (fillWidth > 0) {
      this.fill.fillStyle(this.fillColor, 1);
      this.fill.fillRoundedRect(
        left,
        -this.barHeight / 2,
        fillWidth,
        this.barHeight,
        uiTheme.radii.progressBar
      );
    }

    this.valueText.setText(this.valueFormatter(current, max));
  }

  private redrawTrack(): void {
    this.track.clear();
    this.track.fillStyle(this.trackColor, 1);
    this.track.fillRoundedRect(
      -this.barWidth / 2,
      -this.barHeight / 2,
      this.barWidth,
      this.barHeight,
      uiTheme.radii.progressBar
    );
  }
}
