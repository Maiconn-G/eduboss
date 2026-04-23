import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { Question } from '../types/Question';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { QuestionOptionsPanel } from './QuestionOptionsPanel';

export class QuestionOverlay extends Phaser.GameObjects.Container {
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly accentBar: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly questionText: Phaser.GameObjects.Text;
  private readonly optionsPanel: QuestionOptionsPanel;
  private readonly pinnedPosition: Phaser.Math.Vector2;
  private readonly contentWidth: number;
  private readonly panelWidth: number;
  private currentHeight: number = balanceConfig.questionUiHeight;

  constructor(scene: Phaser.Scene) {
    super(scene, balanceConfig.questionUiX, balanceConfig.questionUiY);

    this.pinnedPosition = new Phaser.Math.Vector2(
      balanceConfig.questionUiX,
      balanceConfig.questionUiY
    );

    this.panelWidth = balanceConfig.questionUiWidth;
    this.contentWidth = this.panelWidth - 48;

    this.shadow = scene.add.graphics();
    this.panel = scene.add.graphics();
    this.accentBar = scene.add.graphics();
    this.title = scene.add
      .text(0, 0, 'Pergunta', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#1d4ed8',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);
    this.questionText = scene.add
      .text(0, 0, '', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#0f172a',
        wordWrap: { width: this.contentWidth - 16 },
        lineSpacing: 6
      })
      .setOrigin(0, 0);
    this.optionsPanel = new QuestionOptionsPanel(scene, 0, 0, this.contentWidth);

    this.add([
      this.shadow,
      this.panel,
      this.accentBar,
      this.title,
      this.questionText,
      this.optionsPanel
    ]);
    this.setDepth(42);
    this.setVisible(false);

    scene.add.existing(this);
    this.layoutContent();
  }

  public setQuestion(question: Question): void {
    this.questionText.setText(question.texto);
    this.optionsPanel.setOptions(question.opcoes);
    this.layoutContent();
  }

  public setOptionState(optionId: string, state: QuestionOptionState): void {
    this.optionsPanel.setOptionState(optionId, state);
  }

  public setAllOptionStates(state: QuestionOptionState): void {
    this.optionsPanel.setAllOptionsState(state);
  }

  public pulseWrongOption(optionId: string, revertState: QuestionOptionState): void {
    this.optionsPanel.pulseWrongAndRevert(optionId, revertState);
  }

  public async moveQuestionToPinnedPosition(
    question: Question,
    fromX: number,
    fromY: number
  ): Promise<void> {
    this.setQuestion(question);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
    this.setPosition(fromX, fromY);

    await new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x: this.pinnedPosition.x,
        y: this.pinnedPosition.y,
        scaleX: 0.88,
        scaleY: 0.88,
        duration: 480,
        ease: 'Sine.easeInOut',
        onComplete: () => resolve()
      });
    });
  }

  public hideOverlay(): void {
    this.setVisible(false);
  }

  private layoutContent(): void {
    const horizontalPadding = 24;
    const topPadding = 18;
    const bottomPadding = 20;
    const titleGap = 10;
    const questionGap = 14;
    const radius = 18;

    this.questionText.setWordWrapWidth(this.contentWidth - 16, true);
    const optionsHeight = this.optionsPanel.getPanelHeight();

    this.currentHeight = Math.max(
      164,
      topPadding +
        this.title.height +
        titleGap +
        this.questionText.height +
        questionGap +
        optionsHeight +
        bottomPadding
    );

    const panelLeft = -this.panelWidth / 2;
    const panelTop = -this.currentHeight / 2;
    const left = panelLeft + horizontalPadding;
    const titleTop = panelTop + topPadding;
    const questionTop = titleTop + this.title.height + titleGap;
    const optionsTop = questionTop + this.questionText.height + questionGap;

    this.title.setPosition(left, titleTop);
    this.questionText.setPosition(left, questionTop);
    this.optionsPanel.setPosition(0, optionsTop + optionsHeight / 2);

    this.shadow.clear();
    this.shadow.fillStyle(0x0f172a, 0.12);
    this.shadow.fillRoundedRect(panelLeft, panelTop + 6, this.panelWidth, this.currentHeight, radius);

    this.panel.clear();
    this.panel.fillStyle(0xf8fbff, 0.98);
    this.panel.lineStyle(2, 0x93c5fd, 0.9);
    this.panel.fillRoundedRect(panelLeft, panelTop, this.panelWidth, this.currentHeight, radius);
    this.panel.strokeRoundedRect(panelLeft, panelTop, this.panelWidth, this.currentHeight, radius);

    this.accentBar.clear();
    this.accentBar.fillStyle(0xdbeafe, 0.95);
    this.accentBar.fillRoundedRect(
      panelLeft + 14,
      panelTop + 12,
      this.panelWidth - 28,
      16,
      8
    );
  }
}
