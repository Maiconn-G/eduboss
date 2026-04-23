import Phaser from 'phaser';
import { DEFAULT_DIFFICULTY_MODE, difficultyConfig } from '../config/difficultyConfig';
import { DifficultyMode } from '../types/DifficultyMode';
import { DifficultyOptionCard } from './DifficultyOptionCard';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type DifficultySelectorConfig = {
  initialMode?: DifficultyMode;
  onChanged?: (mode: DifficultyMode) => void;
};

export class DifficultySelector extends Phaser.GameObjects.Container {
  private readonly shellPanel: UiPanel;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly helperText: Phaser.GameObjects.Text;
  private readonly cards: DifficultyOptionCard[];
  private readonly targets: Array<
    Phaser.GameObjects.GameObject & {
      alpha: number;
      y: number;
      scaleX: number;
      scaleY: number;
    }
  >;
  private selectedMode: DifficultyMode;
  private readonly onChanged?: (mode: DifficultyMode) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DifficultySelectorConfig = {}) {
    super(scene, x, y);

    scene.add.existing(this);

    this.onChanged = config.onChanged;
    this.selectedMode = config.initialMode ?? DEFAULT_DIFFICULTY_MODE;

    this.shellPanel = new UiPanel(
      scene,
      0,
      0,
      uiTheme.difficulty.containerWidth,
      uiTheme.difficulty.containerHeight,
      'light',
      uiTheme.radii.modal
    );
    this.shellPanel.setDepth(0);

    this.titleText = scene.add
      .text(0, -50, 'Escolha a dificuldade', getTextStyle('panelTitle', {
        fontSize: '20px',
        color: '#1d4ed8'
      }))
      .setOrigin(0.5);

    this.helperText = scene.add
      .text(0, -24, 'Defina o ritmo da batalha antes de entrar na arena.', getTextStyle('bodyMuted', {
        fontSize: '13px',
        color: '#475569',
        align: 'center'
      }))
      .setOrigin(0.5);

    const cardModes: DifficultyMode[] = ['easy', 'normal', 'hard'];
    const rowWidth =
      uiTheme.difficulty.cardWidth * cardModes.length +
      uiTheme.difficulty.cardGap * (cardModes.length - 1);
    const startX = -rowWidth / 2 + uiTheme.difficulty.cardWidth / 2;

    this.cards = cardModes.map((mode, index) => {
      const entry = difficultyConfig[mode];

      return new DifficultyOptionCard(scene, startX + index * (uiTheme.difficulty.cardWidth + uiTheme.difficulty.cardGap), 28, {
        mode,
        title: entry.label,
        description: entry.description,
        onSelected: (selectedMode) => this.setSelectedMode(selectedMode)
      });
    });

    this.add([this.shellPanel, this.titleText, this.helperText, ...this.cards]);

    this.targets = [
      this.shellPanel,
      this.titleText,
      this.helperText,
      ...this.cards
    ] as Array<
      Phaser.GameObjects.GameObject & {
        alpha: number;
        y: number;
        scaleX: number;
        scaleY: number;
      }
    >;

    this.setSelectedMode(this.selectedMode, false);
  }

  public getSelectedMode(): DifficultyMode {
    return this.selectedMode;
  }

  public getTargets(): Array<
    Phaser.GameObjects.GameObject & {
      alpha: number;
      y: number;
      scaleX: number;
      scaleY: number;
    }
  > {
    return this.targets;
  }

  public setSelectedMode(mode: DifficultyMode, emitChange = true): void {
    this.selectedMode = mode;

    this.cards.forEach((card) => {
      card.setSelected(card.getMode() === mode);
    });

    if (emitChange) {
      this.onChanged?.(mode);
    }
  }
}
