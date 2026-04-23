import Phaser from 'phaser';
import { drawPanelShadow, drawPanelSurface, UiPanelVariant } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

export class UiPanel extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly surface: Phaser.GameObjects.Graphics;
  private widthValue: number;
  private heightValue: number;
  private variant: UiPanelVariant;
  private radius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    variant: UiPanelVariant = 'hud',
    radius: number = uiTheme.radii.panel
  ) {
    super(scene, x, y);

    this.widthValue = width;
    this.heightValue = height;
    this.variant = variant;
    this.radius = radius;

    this.shadow = scene.add.graphics();
    this.surface = scene.add.graphics();
    this.add([this.shadow, this.surface]);

    scene.add.existing(this);
    this.redraw();
  }

  public setPanelSize(width: number, height: number): void {
    this.widthValue = width;
    this.heightValue = height;
    this.redraw();
  }

  public setPanelVariant(variant: UiPanelVariant): void {
    this.variant = variant;
    this.redraw();
  }

  public getPanelWidth(): number {
    return this.widthValue;
  }

  public getPanelHeight(): number {
    return this.heightValue;
  }

  private redraw(): void {
    drawPanelShadow(this.shadow, this.widthValue, this.heightValue, this.radius);
    drawPanelSurface(this.surface, this.widthValue, this.heightValue, this.variant, this.radius);
  }
}
