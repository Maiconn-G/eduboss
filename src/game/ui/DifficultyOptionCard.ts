import Phaser from 'phaser';
import { DifficultyMode } from '../types/DifficultyMode';
import { drawPanelShadow, getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type DifficultyOptionCardConfig = {
  mode: DifficultyMode;
  title: string;
  description: string;
  onSelected: (mode: DifficultyMode) => void;
};

type DifficultyCardState = 'normal' | 'hover' | 'pressed' | 'selected';

export class DifficultyOptionCard extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly surface: Phaser.GameObjects.Graphics;
  private readonly gloss: Phaser.GameObjects.Graphics;
  private readonly accentBar: Phaser.GameObjects.Graphics;
  private readonly badgeBubble: Phaser.GameObjects.Graphics;
  private readonly badgeText: Phaser.GameObjects.Text;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly descriptionText: Phaser.GameObjects.Text;
  private readonly hitZone: Phaser.GameObjects.Rectangle;
  private visualState: DifficultyCardState = 'normal';

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly config: DifficultyOptionCardConfig) {
    super(scene, x, y);

    this.shadow = scene.add.graphics();
    this.surface = scene.add.graphics();
    this.gloss = scene.add.graphics();
    this.accentBar = scene.add.graphics();
    this.badgeBubble = scene.add.graphics();
    this.badgeText = scene.add
      .text(0, 0, 'ATIVO', getTextStyle('sectionLabel', {
        fontSize: '10px',
        fontStyle: 'bold',
        color: uiTheme.colors.textPrimary
      }))
      .setOrigin(0.5)
      .setVisible(false);
    this.titleText = scene.add
      .text(-72, -16, config.title, getTextStyle('panelTitle', {
        fontSize: '21px',
        color: uiTheme.colors.textDark
      }))
      .setOrigin(0, 0.5);
    this.descriptionText = scene.add
      .text(-72, 14, config.description, getTextStyle('bodyMuted', {
        fontSize: '14px',
        color: '#475569',
        wordWrap: { width: 138 }
      }))
      .setOrigin(0, 0.5);
    this.hitZone = scene.add
      .rectangle(0, 0, uiTheme.difficulty.cardWidth, uiTheme.difficulty.cardHeight, 0xffffff, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add([
      this.shadow,
      this.surface,
      this.gloss,
      this.accentBar,
      this.badgeBubble,
      this.badgeText,
      this.titleText,
      this.descriptionText,
      this.hitZone
    ]);

    scene.add.existing(this);
    this.bindInput();
    this.redraw();
  }

  public getMode(): DifficultyMode {
    return this.config.mode;
  }

  public setSelected(selected: boolean): void {
    this.visualState = selected ? 'selected' : 'normal';
    this.redraw();

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: selected ? uiTheme.difficulty.selectedScale : 1,
      scaleY: selected ? uiTheme.difficulty.selectedScale : 1,
      duration: 150,
      ease: 'Sine.easeOut'
    });
  }

  private bindInput(): void {
    this.hitZone.on('pointerover', () => {
      if (this.visualState === 'selected') {
        return;
      }

      this.visualState = 'hover';
      this.redraw();
      this.animateScale(uiTheme.difficulty.hoverScale);
    });

    this.hitZone.on('pointerout', () => {
      if (this.visualState === 'selected') {
        return;
      }

      this.visualState = 'normal';
      this.redraw();
      this.animateScale(1);
    });

    this.hitZone.on('pointerdown', () => {
      if (this.visualState !== 'selected') {
        this.visualState = 'pressed';
        this.redraw();
      }

      this.animateScale(uiTheme.difficulty.pressedScale);
      this.scene.time.delayedCall(40, () => {
        if (!this.scene.sys.isActive()) {
          return;
        }

        this.config.onSelected(this.config.mode);
      });
    });
  }

  private animateScale(scale: number): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: scale,
      scaleY: scale,
      duration: 110,
      ease: 'Sine.easeOut'
    });
  }

  private redraw(): void {
    const width = uiTheme.difficulty.cardWidth;
    const height = uiTheme.difficulty.cardHeight;
    const radius = uiTheme.radii.card;
    const left = -width / 2;
    const top = -height / 2;
    const accentColor = this.getAccentColor();
    const isSelected = this.visualState === 'selected';
    const isHover = this.visualState === 'hover';
    const isPressed = this.visualState === 'pressed';

    const fillColor = isSelected
      ? uiTheme.colors.surfaceLight
      : isHover
        ? uiTheme.colors.surfaceLight
        : uiTheme.colors.surfaceLightMuted;
    const borderColor = isSelected
      ? accentColor
      : isHover || isPressed
        ? uiTheme.colors.brand
        : uiTheme.colors.borderMuted;
    const borderWidth = isSelected ? 3 : uiTheme.borders.standard;
    const shadowAlpha = isSelected ? 0.22 : isHover ? 0.16 : 0.1;

    drawPanelShadow(this.shadow, width, height, radius, shadowAlpha, 5);

    this.surface.clear();
    this.surface.fillStyle(fillColor, 0.98);
    this.surface.lineStyle(borderWidth, borderColor, 1);
    this.surface.fillRoundedRect(left, top, width, height, radius);
    this.surface.strokeRoundedRect(left, top, width, height, radius);

    this.gloss.clear();
    this.gloss.fillStyle(0xffffff, isSelected ? 0.22 : 0.14);
    this.gloss.fillRoundedRect(left + 10, top + 8, width - 20, 14, 9);

    this.accentBar.clear();
    this.accentBar.fillStyle(accentColor, isSelected ? 0.96 : 0.82);
    this.accentBar.fillRoundedRect(left + 12, top + 12, 12, height - 24, 8);

    this.badgeBubble.clear();
    if (isSelected) {
      const badgeRadius = uiTheme.difficulty.selectedBadgeRadius;
      this.badgeBubble.fillStyle(accentColor, 1);
      this.badgeBubble.fillRoundedRect(36, -30, 48, 24, badgeRadius);
      this.badgeText.setPosition(60, -18);
      this.badgeText.setVisible(true);
    } else {
      this.badgeText.setVisible(false);
    }

    this.titleText.setColor(uiTheme.colors.textDark);
    this.descriptionText.setColor(isSelected ? '#334155' : '#475569');
  }

  private getAccentColor(): number {
    switch (this.config.mode) {
      case 'easy':
        return uiTheme.difficulty.accentEasy;
      case 'hard':
        return uiTheme.difficulty.accentHard;
      case 'normal':
      default:
        return uiTheme.difficulty.accentNormal;
    }
  }
}
