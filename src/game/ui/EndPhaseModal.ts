import Phaser from 'phaser';
import { UiButton } from './UiButton';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type EndPhaseMode = 'victory' | 'defeat';

type EndPhaseModalConfig = {
  mode: EndPhaseMode;
  title: string;
  message: string;
  score: number;
  onRetry: () => void;
  onBackToLobby: () => void;
};

export class EndPhaseModal extends Phaser.GameObjects.Container {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly content: Phaser.GameObjects.Container;
  private readonly panel: UiPanel;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly scoreLabel: Phaser.GameObjects.Text;
  private readonly scoreValue: Phaser.GameObjects.Text;
  private readonly retryButton: UiButton;
  private readonly lobbyButton: UiButton;

  constructor(scene: Phaser.Scene, config: EndPhaseModalConfig) {
    super(scene, 0, 0);

    scene.add.existing(this);
    this.setDepth(90);

    const titleColor = config.mode === 'victory' ? '#fef08a' : '#fecaca';
    const titleStroke = config.mode === 'victory' ? '#7c2d12' : '#7f1d1d';

    this.overlay = scene.add
      .rectangle(640, 360, 1280, 720, uiTheme.colors.surfaceOverlay, 0)
      .setDepth(90)
      .setInteractive();

    this.content = scene.add.container(640, 386);
    this.content.setDepth(91);
    this.content.setAlpha(0);
    this.content.setScale(0.94);

    this.panel = new UiPanel(scene, 0, 0, 560, 316, 'modal', uiTheme.radii.modal);
    this.panel.setDepth(0);

    this.titleText = scene.add
      .text(0, -92, config.title, getTextStyle('heroTitle', {
        fontSize: '50px',
        color: titleColor,
        stroke: titleStroke,
        strokeThickness: 6
      }))
      .setOrigin(0.5);

    this.messageText = scene.add
      .text(0, -18, config.message, getTextStyle('body', {
        fontSize: '23px',
        align: 'center',
        wordWrap: { width: 440 }
      }))
      .setOrigin(0.5);

    this.scoreLabel = scene.add
      .text(0, 56, 'Score final', getTextStyle('sectionLabel', {
        fontSize: '16px',
        color: '#cbd5e1'
      }))
      .setOrigin(0.5);

    this.scoreValue = scene.add
      .text(0, 92, `${config.score}`, getTextStyle('numeric', {
        fontSize: '38px',
        color: '#fde68a'
      }))
      .setOrigin(0.5);

    this.retryButton = new UiButton(scene, -126, 144, {
      label: 'Tentar novamente',
      width: 236,
      height: 64,
      variant: 'primary',
      depth: 92,
      onClick: () => {
        this.disableActions();
        config.onRetry();
      }
    });

    this.lobbyButton = new UiButton(scene, 126, 144, {
      label: 'Voltar ao lobby',
      width: 220,
      height: 64,
      variant: 'secondary',
      depth: 92,
      onClick: () => {
        this.disableActions();
        config.onBackToLobby();
      }
    });

    this.content.add([
      this.panel,
      this.titleText,
      this.messageText,
      this.scoreLabel,
      this.scoreValue,
      this.retryButton,
      this.lobbyButton
    ]);

    this.add([this.overlay, this.content]);
    this.playEntrance();
  }

  public disableActions(): void {
    this.retryButton.setDisabled(true);
    this.lobbyButton.setDisabled(true);
  }

  public override destroy(fromScene?: boolean): void {
    this.retryButton.destroy();
    this.lobbyButton.destroy();
    this.panel.destroy();
    this.titleText.destroy();
    this.messageText.destroy();
    this.scoreLabel.destroy();
    this.scoreValue.destroy();
    this.content.destroy();
    this.overlay.destroy();
    super.destroy(fromScene);
  }

  private playEntrance(): void {
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.58,
      duration: 180,
      ease: 'Sine.easeOut'
    });

    this.scene.tweens.add({
      targets: this.content,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: 392,
      duration: 220,
      ease: 'Cubic.easeOut'
    });
  }
}
