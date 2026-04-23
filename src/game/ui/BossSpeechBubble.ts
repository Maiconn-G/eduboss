import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { Boss } from '../entities/Boss';
import { Question } from '../types/Question';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';
import { UiBadge, UiBadgeVariant } from './UiBadge';

type BubbleOptionRow = {
  optionId: string;
  background: Phaser.GameObjects.Rectangle;
  badge: UiBadge;
  text: Phaser.GameObjects.Text;
};

type BubbleOptionPalette = {
  rowFill: number;
  rowAlpha: number;
  rowStroke: number;
  text: string;
  badge: UiBadgeVariant;
  alpha: number;
};

const optionStatePalette: Record<QuestionOptionState, BubbleOptionPalette> = {
  pending: {
    rowFill: uiTheme.colors.surfaceDarkRaised,
    rowAlpha: 0.9,
    rowStroke: uiTheme.colors.borderMuted,
    text: uiTheme.colors.textPrimary,
    badge: 'primary',
    alpha: 1
  },
  dropped: {
    rowFill: uiTheme.colors.surfaceDarkRaised,
    rowAlpha: 0.56,
    rowStroke: uiTheme.colors.borderMuted,
    text: uiTheme.colors.textMuted,
    badge: 'muted',
    alpha: 0.5
  },
  collected: {
    rowFill: uiTheme.colors.brand,
    rowAlpha: 0.2,
    rowStroke: uiTheme.colors.brandHover,
    text: '#dbeafe',
    badge: 'collected',
    alpha: 1
  },
  submitted: {
    rowFill: uiTheme.colors.warning,
    rowAlpha: 0.18,
    rowStroke: 0xfbbf24,
    text: '#fef3c7',
    badge: 'submitted',
    alpha: 1
  },
  correct: {
    rowFill: uiTheme.colors.success,
    rowAlpha: 0.18,
    rowStroke: 0x4ade80,
    text: '#dcfce7',
    badge: 'correct',
    alpha: 1
  },
  wrong: {
    rowFill: uiTheme.colors.danger,
    rowAlpha: 0.18,
    rowStroke: 0xf87171,
    text: '#fee2e2',
    badge: 'wrong',
    alpha: 1
  }
};

export class BossSpeechBubble extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly border: Phaser.GameObjects.Graphics;
  private readonly tail: Phaser.GameObjects.Triangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private optionRows: BubbleOptionRow[] = [];

  private readonly maxTextWidth = 362;
  private readonly panelWidth = 420;
  private readonly minHeight = 152;
  private currentHeight = this.minHeight;
  private currentQuestion?: Question;
  private pinned = false;
  private disposed = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.shadow = scene.add.graphics();
    this.background = scene.add.graphics();
    this.border = scene.add.graphics();
    this.tail = scene.add
      .triangle(-122, 60, 0, 0, 34, 16, 5, 38, uiTheme.panels.speech.fillColor, 0.98)
      .setStrokeStyle(2, uiTheme.panels.speech.borderColor, uiTheme.panels.speech.borderAlpha);
    this.titleText = scene.add
      .text(0, 0, 'Boss', getTextStyle('panelTitle', { color: '#fca5a5' }))
      .setOrigin(0, 0);
    this.bodyText = scene.add
      .text(0, 0, '', getTextStyle('body', {
        fontSize: '20px',
        wordWrap: { width: this.maxTextWidth },
        lineSpacing: 8
      }))
      .setOrigin(0, 0);

    this.add([
      this.shadow,
      this.background,
      this.border,
      this.tail,
      this.titleText,
      this.bodyText
    ]);
    this.setDepth(46);
    this.setVisible(false);
    this.setAlpha(0);

    scene.add.existing(this);
    this.layout();
  }

  public positionNearBoss(boss: Boss): void {
    if (!this.canRender()) {
      return;
    }

    this.pinned = false;
    this.tail.setVisible(true);
    this.titleText.setText('Boss');
    this.setPosition(
      Phaser.Math.Clamp(
        balanceConfig.questionUiX + 72,
        this.panelWidth / 2 + 24,
        this.scene.scale.width - 250
      ),
      Math.max(balanceConfig.questionUiY + 112, boss.y - 6)
    );
  }

  public getAnswerSlots(count: number): Phaser.Math.Vector2[] {
    const spacing = 132;
    const startX = this.x - ((count - 1) * spacing) / 2;
    const y = this.y + this.currentHeight / 2 + 38;

    return Array.from({ length: count }, (_, index) => {
      return new Phaser.Math.Vector2(startX + index * spacing, y);
    });
  }

  public getPresentationOrigin(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }

  public show(): void {
    if (!this.canRender()) {
      return;
    }

    this.setVisible(true);
  }

  public setQuestion(question: Question): void {
    if (!this.canRender()) {
      return;
    }

    this.currentQuestion = question;
    this.bodyText.setText(question.texto);
    this.setOptions(
      question.opcoes.map((option) => ({
        id: option.id,
        text: option.texto
      }))
    );
    this.layout();
  }

  public setPinnedMode(): void {
    if (!this.canRender()) {
      return;
    }

    this.pinned = true;
    this.tail.setVisible(false);
    this.titleText.setText('Pergunta');
    this.layout();
  }

  public setNarrationMode(): void {
    if (!this.canRender()) {
      return;
    }

    this.pinned = false;
    this.tail.setVisible(true);
    this.titleText.setText('Boss');
    this.layout();
  }

  public setText(content: string): void {
    if (!this.canRender()) {
      return;
    }

    this.bodyText.setText(content);
    this.layout();
  }

  public setOptions(options: Array<{ id: string; text: string }>): void {
    if (!this.canRender()) {
      return;
    }

    this.clearOptions();

    this.optionRows = options.map((option) => {
      const background = this.scene.add
        .rectangle(0, 0, this.width - 42, 42, uiTheme.colors.surfaceDarkRaised, 0.9)
        .setOrigin(0.5)
        .setStrokeStyle(1, uiTheme.colors.borderMuted, 0.95);
      const badge = new UiBadge(this.scene, 0, 0, option.id, 13);
      const text = this.scene.add
        .text(0, 0, option.text, getTextStyle('bodyMuted', {
          fontSize: '17px',
          color: uiTheme.colors.textPrimary,
          wordWrap: { width: this.panelWidth - 112 }
        }))
        .setOrigin(0, 0.5);

      this.add([background, badge, text]);
      return { optionId: option.id, background, badge, text };
    });

    this.optionRows.forEach((row) => {
      this.applyOptionState(row, 'pending');
    });
    this.layout();
  }

  public setOptionText(index: number, content: string): void {
    if (!this.canRender()) {
      return;
    }

    const row = this.optionRows[index];
    if (!row) {
      return;
    }

    row.text.setText(content);
    this.layout();
  }

  public setOptionState(optionId: string, state: QuestionOptionState): void {
    if (!this.canRender()) {
      return;
    }

    const row = this.optionRows.find((entry) => entry.optionId === optionId);
    if (!row) {
      return;
    }

    this.applyOptionState(row, state);
  }

  public setAllOptionStates(state: QuestionOptionState): void {
    if (!this.canRender()) {
      return;
    }

    this.optionRows.forEach((row) => this.applyOptionState(row, state));
  }

  public pulseWrongOption(optionId: string, revertState: QuestionOptionState): void {
    if (!this.canRender()) {
      return;
    }

    const row = this.optionRows.find((entry) => entry.optionId === optionId);
    if (!row) {
      return;
    }

    this.applyOptionState(row, 'wrong');
    this.scene.tweens.add({
      targets: [row.background, row.text],
      x: '+=3',
      yoyo: true,
      repeat: 3,
      duration: 42,
      onComplete: () => {
        row.background.setX(0);
        row.text.setX(-this.width / 2 + 62);
        this.applyOptionState(row, revertState);
      }
    });
  }

  public highlightOption(index: number | null): void {
    if (!this.canRender()) {
      return;
    }

    this.optionRows.forEach((row, rowIndex) => {
      const active = index === rowIndex;
      row.text.setScale(active ? 1.02 : 1);
      row.badge.setScale(active ? 1.04 : 1);
      row.background.setScale(active ? 1.01 : 1);
    });
  }

  public playEmphasisShake(duration: number, intensity: number): void {
    if (!this.canRender()) {
      return;
    }

    const originalX = this.x;
    const originalY = this.y;

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: () => {
        this.setPosition(
          originalX + Phaser.Math.FloatBetween(-intensity, intensity),
          originalY + Phaser.Math.FloatBetween(-intensity, intensity)
        );
      },
      onComplete: () => {
        this.setPosition(originalX, originalY);
      }
    });
  }

  public clearText(): void {
    this.currentQuestion = undefined;
    if (this.bodyText.active) {
      this.bodyText.setText('');
    }
    this.clearOptions();
    if (this.canRender()) {
      this.layout();
    }
  }

  public async playAppearTween(duration: number): Promise<void> {
    if (!this.canRender()) {
      return;
    }

    this.show();
    this.setScale(0.94);

    await this.playTween({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: 'Back.easeOut'
    });
  }

  public async moveToQuestionCorner(): Promise<void> {
    if (!this.canRender()) {
      return;
    }

    this.setPinnedMode();

    await this.playTween({
      targets: this,
      x: balanceConfig.questionPanelCornerX,
      y: balanceConfig.questionPanelCornerY,
      scaleX: balanceConfig.questionPanelCornerScale,
      scaleY: balanceConfig.questionPanelCornerScale,
      duration: balanceConfig.questionPanelMoveDurationMs,
      ease: 'Sine.easeInOut'
    });
  }

  public resetPanel(): void {
    this.pinned = false;
    if (this.tail.active) {
      this.tail.setVisible(true);
    }
    if (this.active) {
      this.setScale(1);
      this.setAlpha(0);
      this.setVisible(false);
    }
    this.clearText();
  }

  private applyOptionState(row: BubbleOptionRow, state: QuestionOptionState): void {
    if (!row.background.active || !row.badge.active || !row.text.active) {
      return;
    }

    const palette = optionStatePalette[state];
    row.background.setFillStyle(palette.rowFill, palette.rowAlpha);
    row.background.setStrokeStyle(1, palette.rowStroke, 0.95);
    row.text.setColor(palette.text);
    row.text.setAlpha(palette.alpha);
    row.badge.setVariant(palette.badge);
    row.badge.setAlpha(palette.alpha);
  }

  private layout(): void {
    if (!this.canRender()) {
      return;
    }

    const horizontalPadding = 18;
    const topPadding = 16;
    const bottomPadding = 18;
    const titleGap = 10;
    const questionGap = 18;
    const rowGap = 8;
    const rowWidth = this.panelWidth - horizontalPadding * 2;
    const contentWidth = this.panelWidth - horizontalPadding * 2 - 10;

    this.bodyText.setWordWrapWidth(contentWidth, true);

    let optionsHeight = 0;
    this.optionRows.forEach((row, index) => {
      row.text.setWordWrapWidth(this.panelWidth - 112, true);
      const rowHeight = Math.max(40, row.text.height + 14);
      const centerY = optionsHeight + rowHeight / 2;

      row.background.setPosition(0, centerY);
      row.background.setSize(rowWidth, rowHeight);
      row.badge.setPosition(-rowWidth / 2 + 26, centerY);
      row.text.setPosition(-rowWidth / 2 + 52, centerY);

      optionsHeight += rowHeight + (index < this.optionRows.length - 1 ? rowGap : 0);
    });

    this.currentHeight = Math.max(
      this.minHeight,
      topPadding +
        this.titleText.height +
        titleGap +
        this.bodyText.height +
        (this.optionRows.length > 0 ? questionGap + optionsHeight : 0) +
        bottomPadding
    );

    const left = -this.panelWidth / 2;
    const top = -this.currentHeight / 2;
    const radius = uiTheme.radii.panel;
    const titleX = left + horizontalPadding;
    const titleY = top + topPadding;
    const bodyY = titleY + this.titleText.height + titleGap;
    const optionsTop = bodyY + this.bodyText.height + questionGap;

    this.titleText.setPosition(titleX, titleY);
    this.bodyText.setPosition(titleX, bodyY);

    this.optionRows.forEach((row) => {
      row.background.y = optionsTop + row.background.y;
      row.badge.y = optionsTop + row.badge.y;
      row.text.y = optionsTop + row.text.y;
    });

    this.tail.setPosition(left + 56, this.currentHeight / 2 - 10);

    this.shadow.clear();
    this.shadow.fillStyle(uiTheme.colors.shadow, uiTheme.shadows.alpha);
    this.shadow.fillRoundedRect(
      left,
      top + uiTheme.shadows.offsetY,
      this.panelWidth,
      this.currentHeight,
      radius
    );

    this.background.clear();
    this.background.fillStyle(uiTheme.panels.speech.fillColor, uiTheme.panels.speech.fillAlpha);
    this.background.fillRoundedRect(left, top, this.panelWidth, this.currentHeight, radius);

    this.border.clear();
    this.border.lineStyle(2, uiTheme.panels.speech.borderColor, uiTheme.panels.speech.borderAlpha);
    this.border.strokeRoundedRect(left, top, this.panelWidth, this.currentHeight, radius);
  }

  private clearOptions(): void {
    this.optionRows.forEach((row) => {
      if (row.background.active) {
        row.background.destroy();
      }
      if (row.badge.active) {
        row.badge.destroy();
      }
      if (row.text.active) {
        row.text.destroy();
      }
    });
    this.optionRows = [];
  }

  private playTween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    if (!this.canRender()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.scene.tweens.add({
        ...config,
        onComplete: () => resolve()
      });
    });
  }

  public override destroy(fromScene?: boolean): void {
    this.disposed = true;
    this.clearOptions();
    super.destroy(fromScene);
  }

  private canRender(): boolean {
    return Boolean(
      !this.disposed &&
        this.active &&
        this.scene &&
        this.scene.sys &&
        this.scene.sys.isActive() &&
        this.shadow.active &&
        this.background.active &&
        this.border.active &&
        this.titleText.active &&
        this.bodyText.active
    );
  }
}
