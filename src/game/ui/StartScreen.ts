import Phaser from 'phaser';
import { DifficultyMode } from '../types/DifficultyMode';
import { MenuAnimationSystem } from '../systems/MenuAnimationSystem';
import { ControlsPanel } from './ControlsPanel';
import { DifficultySelector } from './DifficultySelector';
import { InstructionsPanel } from './InstructionsPanel';
import { MenuButton } from './MenuButton';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { menuMotion } from './theme/menuMotion';
import { uiTheme } from './theme/uiTheme';

type StartScreenConfig = {
  initialDifficulty?: DifficultyMode;
  onStart: (difficulty: DifficultyMode) => void;
};

export class StartScreen extends Phaser.GameObjects.Container {
  private readonly animationSystem: MenuAnimationSystem;
  private readonly shellPanel: UiPanel;
  private readonly instructionsPanel: InstructionsPanel;
  private readonly controlsPanel: ControlsPanel;
  private readonly difficultySelector: DifficultySelector;
  private readonly startButton: MenuButton;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly taglineText: Phaser.GameObjects.Text;
  private readonly sectionTitle: Phaser.GameObjects.Text;
  private readonly sectionLead: Phaser.GameObjects.Text;
  private readonly divider: Phaser.GameObjects.Graphics;
  private readonly entranceTargets: Array<
    Phaser.GameObjects.GameObject & {
      alpha: number;
      y: number;
      scaleX: number;
      scaleY: number;
    }
  > = [];
  private startLocked = false;

  constructor(scene: Phaser.Scene, config: StartScreenConfig) {
    super(scene, 0, 0);

    scene.add.existing(this);
    this.setDepth(5);
    this.animationSystem = new MenuAnimationSystem(scene);

    this.createBackground(scene);

    this.titleText = scene.add
      .text(
        640,
        38,
        'EduBoss',
        getTextStyle('heroTitle', {
          color: uiTheme.colors.textPrimary,
          align: 'center',
          fontSize: '40px',
          stroke: '#6d8fbe',
          strokeThickness: 5
        })
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.subtitleText = scene.add
      .text(
        640,
        90,
        'Arena do Conhecimento',
        getTextStyle('heroTitle', {
          color: '#eef6ff',
          fontSize: '30px',
          align: 'center',
          stroke: '#6d8fbe',
          strokeThickness: 4
        })
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.taglineText = scene.add
      .text(
        640,
        128,
        'Responda certo, sobreviva aos ataques e derrote o boss da sala.',
        getTextStyle('body', {
          color: '#dbeafe',
          fontSize: '16px',
          align: 'center',
          stroke: '#5f81ad',
          strokeThickness: 3,
          wordWrap: { width: 760 }
        })
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.shellPanel = new UiPanel(scene, 640, 436, 1048, 586, 'light', uiTheme.radii.modal);
    this.shellPanel.setDepth(11);

    this.sectionTitle = scene.add
      .text(640, 210, 'Prepare-se para a batalha', getTextStyle('panelTitle', { color: '#1d4ed8' }))
      .setOrigin(0.5)
      .setDepth(16);

    this.sectionLead = scene.add
      .text(
        640,
        236,
        'Entenda a dinamica, memorize os controles e comece sua primeira rodada.',
        getTextStyle('bodyMuted', {
          color: '#475569',
          fontSize: '14px',
          align: 'center',
          wordWrap: { width: 660 }
        })
      )
      .setOrigin(0.5)
      .setDepth(16);

    const instructionsWidth = 446;
    const controlsWidth = 326;
    const difficultyWidth = uiTheme.difficulty.sidebarContainerWidth;
    const columnGap = 24;
    const contentWidth = instructionsWidth + controlsWidth + difficultyWidth + columnGap * 2;
    const contentLeft = 640 - contentWidth / 2;
    const instructionsCenterX = contentLeft + instructionsWidth / 2;
    const controlsCenterX = contentLeft + instructionsWidth + columnGap + controlsWidth / 2;
    const difficultyCenterX =
      contentLeft + instructionsWidth + columnGap + controlsWidth + columnGap + difficultyWidth / 2;
    const dividerX = contentLeft + instructionsWidth + columnGap / 2;

    this.instructionsPanel = new InstructionsPanel(scene, instructionsCenterX, 460);
    this.instructionsPanel.setDepth(16);

    this.controlsPanel = new ControlsPanel(scene, controlsCenterX, 400);
    this.controlsPanel.setDepth(16);

    this.difficultySelector = new DifficultySelector(scene, difficultyCenterX, 460, {
      initialMode: config.initialDifficulty,
      layout: 'sidebar'
    });
    this.difficultySelector.setDepth(16);

    this.divider = scene.add.graphics().setDepth(15);
    this.divider.lineStyle(2, uiTheme.colors.borderMuted, 0.28);
    this.divider.lineBetween(dividerX, 292, dividerX, 668);

    this.startButton = new MenuButton(scene, controlsCenterX, 626, 'Comecar batalha', () => {
      void this.handleStart(config.onStart);
    });
    this.startButton.setDepth(18);

    this.add([
      this.titleText,
      this.subtitleText,
      this.taglineText,
      this.shellPanel,
      this.sectionTitle,
      this.sectionLead,
      this.divider,
      this.instructionsPanel,
      this.controlsPanel,
      this.difficultySelector,
      this.startButton
    ]);

    this.entranceTargets.push(
      this.titleText,
      this.subtitleText,
      this.taglineText,
      this.shellPanel,
      this.sectionTitle,
      this.sectionLead,
      this.divider,
      this.instructionsPanel,
      this.controlsPanel,
      this.difficultySelector,
      this.startButton
    );

    this.playEntranceSequence();
    this.startButton.startPrimaryPulse();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.animationSystem.dispose();
    });
  }

  private createBackground(scene: Phaser.Scene): void {
    const sky = scene.add.rectangle(640, 360, 1280, 720, 0x8fc8ff).setDepth(0);
    const horizonGlow = scene.add.ellipse(640, 160, 980, 220, 0xffffff, 0.14).setDepth(0);
    const ground = scene.add.rectangle(640, 650, 1280, 140, 0x4d7c0f).setDepth(0);
    const grass = scene.add.rectangle(640, 614, 1280, 44, 0x65a30d).setDepth(0);
    const sun = scene.add.circle(1110, 116, 58, 0xfef08a, 0.92).setDepth(1);
    const sunRing = scene.add.circle(1110, 116, 72).setStrokeStyle(5, 0xfacc15, 0.45).setDepth(1);
    const hillLeft = scene.add.ellipse(160, 636, 390, 150, 0x65a30d, 0.35).setDepth(1);
    const hillRight = scene.add.ellipse(1140, 640, 330, 124, 0x65a30d, 0.32).setDepth(1);

    const clouds = [
      scene.add.ellipse(220, 122, 190, 66, 0xffffff, 0.45).setDepth(1),
      scene.add.ellipse(380, 174, 140, 50, 0xffffff, 0.32).setDepth(1),
      scene.add.ellipse(930, 178, 176, 58, 0xffffff, 0.28).setDepth(1)
    ];

    this.add([sky, horizonGlow, ground, grass, sun, sunRing, hillLeft, hillRight, ...clouds]);

    clouds.forEach((cloud, index) => {
      scene.tweens.add({
        targets: cloud,
        x: cloud.x + (index % 2 === 0 ? 18 : -16),
        duration: 4200 + index * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    scene.tweens.add({
      targets: [sun, sunRing],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private playEntranceSequence(): void {
    this.animationSystem.playEntrance([
      { target: this.titleText, delay: 0, offsetY: 16, scaleFrom: 0.97 },
      { target: this.subtitleText, delay: menuMotion.menuStaggerDelay, offsetY: 14, scaleFrom: 0.985 },
      { target: this.taglineText, delay: menuMotion.menuStaggerDelay * 2, offsetY: 12, scaleFrom: 0.99 },
      { target: this.shellPanel, delay: menuMotion.menuStaggerDelay * 3, offsetY: 22, scaleFrom: 0.98 },
      { target: this.sectionTitle, delay: menuMotion.menuStaggerDelay * 4, offsetY: 16, scaleFrom: 0.985 },
      { target: this.sectionLead, delay: menuMotion.menuStaggerDelay * 5, offsetY: 16, scaleFrom: 0.985 },
      { target: this.divider, delay: menuMotion.menuStaggerDelay * 6, offsetY: 8, scaleFrom: 1 },
      { target: this.instructionsPanel, delay: menuMotion.menuStaggerDelay * 6, offsetY: 18, scaleFrom: 0.985 },
      { target: this.controlsPanel, delay: menuMotion.menuStaggerDelay * 7, offsetY: 18, scaleFrom: 0.985 },
      { target: this.difficultySelector, delay: menuMotion.menuStaggerDelay * 8, offsetY: 18, scaleFrom: 0.985 },
      { target: this.startButton, delay: menuMotion.menuStaggerDelay * 9, offsetY: 20, scaleFrom: 0.97 }
    ]);

    this.animationSystem.playCascade(
      this.instructionsPanel.getItemTargets() as unknown as Array<
        Phaser.GameObjects.GameObject & {
          alpha: number;
          y: number;
          scaleX: number;
          scaleY: number;
        }
      >,
      menuMotion.menuStaggerDelay * 6
    );
    this.animationSystem.playCascade(
      this.controlsPanel.getRowTargets() as unknown as Array<
        Phaser.GameObjects.GameObject & {
          alpha: number;
          y: number;
          scaleX: number;
          scaleY: number;
        }
      >,
      menuMotion.menuStaggerDelay * 7
    );
    this.animationSystem.playCascade(this.difficultySelector.getTargets(), menuMotion.menuStaggerDelay * 8);
    this.animationSystem.addFloatIdle(this.titleText as unknown as Phaser.GameObjects.GameObject & {
      alpha: number;
      y: number;
      scaleX: number;
      scaleY: number;
    });
  }

  private async handleStart(onStart: (difficulty: DifficultyMode) => void): Promise<void> {
    if (this.startLocked) {
      return;
    }

    this.startLocked = true;
    this.startButton.stopPrimaryPulse();
    await this.animationSystem.playExit(this.entranceTargets);
    onStart(this.difficultySelector.getSelectedMode());
  }
}
