import Phaser from 'phaser';
import { drawButtonSurface, drawPanelShadow, getTextStyle, UiButtonVariant } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type UiButtonConfig = {
  label: string;
  width?: number;
  height?: number;
  variant?: UiButtonVariant;
  depth?: number;
  hoverScale?: number;
  pressedScale?: number;
  clickDelayMs?: number;
  onClick: () => void;
};

type UiButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

export class UiButton extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly surface: Phaser.GameObjects.Graphics;
  private readonly shine: Phaser.GameObjects.Graphics;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly hitZone: Phaser.GameObjects.Rectangle;
  private readonly widthValue: number;
  private readonly heightValue: number;
  private readonly variant: UiButtonVariant;
  private readonly onClick: () => void;
  private readonly hoverScale: number;
  private readonly pressedScale: number;
  private readonly clickDelayMs: number;
  private visualState: UiButtonState = 'normal';
  private disabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: UiButtonConfig) {
    super(scene, x, y);

    this.widthValue = config.width ?? 232;
    this.heightValue = config.height ?? 62;
    this.variant = config.variant ?? 'primary';
    this.onClick = config.onClick;
    this.hoverScale = config.hoverScale ?? uiTheme.button.hoverScale;
    this.pressedScale = config.pressedScale ?? uiTheme.button.pressedScale;
    this.clickDelayMs = config.clickDelayMs ?? 90;

    this.shadow = scene.add.graphics();
    this.surface = scene.add.graphics();
    this.shine = scene.add.graphics();
    this.labelText = scene.add
      .text(0, 0, config.label, getTextStyle('button'))
      .setOrigin(0.5);
    this.hitZone = scene.add
      .rectangle(0, 0, this.widthValue, this.heightValue, 0xffffff, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add([this.shadow, this.surface, this.shine, this.labelText, this.hitZone]);
    this.setDepth(config.depth ?? 90);

    scene.add.existing(this);
    this.redraw();
    this.bindInput();
  }

  public setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    this.visualState = disabled ? 'disabled' : 'normal';
    if (disabled) {
      this.hitZone.disableInteractive();
      this.setScale(1);
    } else {
      this.hitZone.setInteractive({ useHandCursor: true });
    }
    this.redraw();
  }

  public setLabel(label: string): void {
    this.labelText.setText(label);
  }

  protected getButtonWidth(): number {
    return this.widthValue;
  }

  protected getButtonHeight(): number {
    return this.heightValue;
  }

  private bindInput(): void {
    this.hitZone.on('pointerover', () => {
      if (this.disabled || this.visualState === 'pressed') {
        return;
      }

      this.visualState = 'hover';
      this.redraw();
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        scaleX: this.hoverScale,
        scaleY: this.hoverScale,
        duration: 120
      });
    });

    this.hitZone.on('pointerout', () => {
      if (this.disabled) {
        return;
      }

      this.visualState = 'normal';
      this.redraw();
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 120
      });
    });

    this.hitZone.on('pointerdown', () => {
      if (this.disabled) {
        return;
      }

      this.disabled = true;
      this.visualState = 'pressed';
      this.hitZone.disableInteractive();
      this.redraw();
      this.scene.tweens.killTweensOf(this);
      this.setScale(this.pressedScale);

      // Trigger on pointer down to avoid lost pointerup events on modal overlays/restarts.
      this.scene.time.delayedCall(this.clickDelayMs, () => {
        if (!this.scene.sys.isActive()) {
          return;
        }

        this.onClick();
      });
    });
  }

  private redraw(): void {
    drawPanelShadow(
      this.shadow,
      this.widthValue,
      this.heightValue,
      uiTheme.radii.button,
      0.22,
      uiTheme.shadows.offsetY
    );
    drawButtonSurface(
      this.surface,
      this.widthValue,
      this.heightValue,
      this.variant,
      this.visualState
    );

    this.shine.clear();
    this.shine.fillStyle(0xffffff, this.visualState === 'pressed' ? 0.1 : 0.16);
    this.shine.fillRoundedRect(
      -this.widthValue / 2 + 12,
      -this.heightValue / 2 + 8,
      this.widthValue - 24,
      18,
      10
    );

    this.labelText.setColor(uiTheme.buttons[this.variant].textColor);
    this.labelText.setAlpha(this.visualState === 'disabled' ? 0.65 : 1);
  }
}
