import Phaser from 'phaser';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { UiBadge, UiBadgeVariant } from './UiBadge';

type OptionPalette = {
  fill: number;
  fillAlpha: number;
  stroke: number;
  strokeAlpha: number;
  text: string;
  shadowAlpha: number;
  badge: UiBadgeVariant;
  alpha: number;
};

const optionPalettes: Record<QuestionOptionState, OptionPalette> = {
  pending: {
    fill: 0xffffff,
    fillAlpha: 0.9,
    stroke: 0xdbeafe,
    strokeAlpha: 1,
    text: '#1e293b',
    shadowAlpha: 0.08,
    badge: 'primary',
    alpha: 1
  },
  dropped: {
    fill: 0xf8fafc,
    fillAlpha: 0.68,
    stroke: 0xe2e8f0,
    strokeAlpha: 0.9,
    text: '#475569',
    shadowAlpha: 0.03,
    badge: 'muted',
    alpha: 0.56
  },
  collected: {
    fill: 0xeff6ff,
    fillAlpha: 0.98,
    stroke: 0x60a5fa,
    strokeAlpha: 1,
    text: '#1d4ed8',
    shadowAlpha: 0.12,
    badge: 'collected',
    alpha: 1
  },
  submitted: {
    fill: 0xfffbeb,
    fillAlpha: 0.98,
    stroke: 0xfcd34d,
    strokeAlpha: 1,
    text: '#92400e',
    shadowAlpha: 0.12,
    badge: 'submitted',
    alpha: 1
  },
  correct: {
    fill: 0xf0fdf4,
    fillAlpha: 0.98,
    stroke: 0x4ade80,
    strokeAlpha: 1,
    text: '#166534',
    shadowAlpha: 0.14,
    badge: 'correct',
    alpha: 1
  },
  wrong: {
    fill: 0xfff1f2,
    fillAlpha: 0.98,
    stroke: 0xf87171,
    strokeAlpha: 1,
    text: '#991b1b',
    shadowAlpha: 0.12,
    badge: 'wrong',
    alpha: 1
  }
};

export class QuestionOptionItem extends Phaser.GameObjects.Container {
  public readonly optionId: string;

  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly card: Phaser.GameObjects.Graphics;
  private readonly badge: UiBadge;
  private readonly optionText: Phaser.GameObjects.Text;
  private readonly itemWidth: number;
  private readonly toneOffset: number;
  private currentState: QuestionOptionState = 'pending';
  private itemHeight = 48;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    optionId: string,
    label: string,
    text: string,
    width: number,
    toneOffset = 0
  ) {
    super(scene, x, y);

    this.optionId = optionId;
    this.itemWidth = width;
    this.toneOffset = toneOffset;

    this.shadow = scene.add.graphics();
    this.card = scene.add.graphics();
    this.badge = new UiBadge(scene, 0, 0, label, 14);
    this.optionText = scene.add
      .text(0, 0, text, {
        fontFamily: 'Verdana',
        fontSize: '17px',
        color: '#1e293b',
        wordWrap: { width: width - 96 },
        lineSpacing: 4
      })
      .setOrigin(0, 0);

    this.add([this.shadow, this.card, this.badge, this.optionText]);
    scene.add.existing(this);

    this.layout();
    this.applyState('pending');
  }

  public setOptionState(nextState: QuestionOptionState): void {
    this.applyState(nextState);
  }

  public pulseWrongAndRevert(revertState: QuestionOptionState, durationMs = 360): void {
    this.applyState('wrong');
    this.scene.tweens.killTweensOf(this);
    const originalX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: originalX + 3,
      yoyo: true,
      repeat: 3,
      duration: 45,
      onComplete: () => {
        this.setX(originalX);
      }
    });

    this.scene.time.delayedCall(durationMs, () => {
      if (!this.active) {
        return;
      }

      this.applyState(revertState);
    });
  }

  public getItemHeight(): number {
    return this.itemHeight;
  }

  private layout(): void {
    this.optionText.setWordWrapWidth(this.itemWidth - 96, true);
    this.itemHeight = Math.max(48, this.optionText.height + 18);

    const left = -this.itemWidth / 2;
    this.badge.setPosition(left + 28, 0);
    this.optionText.setPosition(left + 54, -this.itemHeight / 2 + 10);

    this.redrawCard(optionPalettes.pending);
  }

  private applyState(nextState: QuestionOptionState): void {
    this.currentState = nextState;
    this.scene.tweens.killTweensOf(this);
    this.setScale(1);

    const palette = optionPalettes[nextState];
    this.setAlpha(palette.alpha);
    this.optionText.setColor(palette.text);
    this.badge.setVariant(palette.badge);
    this.badge.setShadowAlpha(nextState === 'dropped' ? 0.03 : 0.08);
    this.redrawCard(palette);

    if (nextState === 'collected') {
      this.setScale(1.02);
    }
  }

  private redrawCard(palette: OptionPalette): void {
    const width = this.itemWidth;
    const height = this.itemHeight;
    const radius = 12;
    const left = -width / 2;
    const top = -height / 2;

    this.shadow.clear();
    this.shadow.fillStyle(0x0f172a, palette.shadowAlpha);
    this.shadow.fillRoundedRect(left, top + 4, width, height, radius);

    this.card.clear();
    const fill = this.toneOffset === 1 ? Phaser.Display.Color.IntegerToColor(palette.fill).brighten(4).color : palette.fill;
    this.card.fillStyle(fill, palette.fillAlpha);
    this.card.lineStyle(1.5, palette.stroke, palette.strokeAlpha);
    this.card.fillRoundedRect(left, top, width, height, radius);
    this.card.strokeRoundedRect(left, top, width, height, radius);
  }
}
