import Phaser from 'phaser';
import { DEFAULT_DIFFICULTY_MODE, difficultyConfig } from '../config/difficultyConfig';
import { DifficultyMode } from '../types/DifficultyMode';
import { DifficultyOptionCard } from './DifficultyOptionCard';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type DifficultySelectorConfig = {
  initialMode?: DifficultyMode;
  layout?: 'full' | 'compact' | 'sidebar';
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
  private readonly layout: 'full' | 'compact' | 'sidebar';
  private readonly onChanged?: (mode: DifficultyMode) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DifficultySelectorConfig = {}) {
    super(scene, x, y);

    scene.add.existing(this);

    this.onChanged = config.onChanged;
    this.layout = config.layout ?? 'full';
    this.selectedMode = config.initialMode ?? DEFAULT_DIFFICULTY_MODE;

    const isCompact = this.layout === 'compact';
    const isSidebar = this.layout === 'sidebar';
    const containerWidth = isCompact
      ? uiTheme.difficulty.compactContainerWidth
      : isSidebar
        ? uiTheme.difficulty.sidebarContainerWidth
        : uiTheme.difficulty.containerWidth;
    const containerHeight = isCompact
      ? uiTheme.difficulty.compactContainerHeight
      : isSidebar
        ? uiTheme.difficulty.sidebarContainerHeight
        : uiTheme.difficulty.containerHeight;

    this.shellPanel = new UiPanel(
      scene,
      0,
      0,
      containerWidth,
      containerHeight,
      'light',
      uiTheme.radii.modal
    );
    this.shellPanel.setDepth(0);

    this.titleText = scene.add
      .text(
        0,
        isCompact ? -38 : isSidebar ? -176 : -50,
        isCompact || isSidebar ? 'Dificuldade' : 'Escolha a dificuldade',
        getTextStyle('panelTitle', {
        fontSize: isCompact ? '18px' : isSidebar ? '19px' : '20px',
        color: '#1d4ed8'
      }))
      .setOrigin(0.5);

    this.helperText = scene.add
      .text(
        0,
        isCompact ? 42 : isSidebar ? 0 : -24,
        isCompact || isSidebar ? '' : 'Defina o ritmo da batalha antes de entrar na arena.',
        getTextStyle('bodyMuted', {
        fontSize: isCompact ? '12px' : '13px',
        color: '#475569',
        align: 'center'
      }))
      .setOrigin(0.5);

    if (isSidebar) {
      this.helperText.setVisible(false);
    }

    const cardModes: DifficultyMode[] = ['easy', 'normal', 'hard'];
    const rowWidth =
      (isCompact
        ? uiTheme.difficulty.compactCardWidth
        : isSidebar
          ? uiTheme.difficulty.sidebarCardWidth
          : uiTheme.difficulty.cardWidth) * (isSidebar ? 1 : cardModes.length) +
      (isCompact
        ? uiTheme.difficulty.compactCardGap
        : isSidebar
          ? uiTheme.difficulty.sidebarCardGap
          : uiTheme.difficulty.cardGap) * (isSidebar ? 0 : cardModes.length - 1);
    const cardWidth = isCompact
      ? uiTheme.difficulty.compactCardWidth
      : isSidebar
        ? uiTheme.difficulty.sidebarCardWidth
        : uiTheme.difficulty.cardWidth;
    const cardGap = isCompact
      ? uiTheme.difficulty.compactCardGap
      : isSidebar
        ? uiTheme.difficulty.sidebarCardGap
        : uiTheme.difficulty.cardGap;
    const startX = isSidebar ? 0 : -rowWidth / 2 + cardWidth / 2;
    const cardsY = isCompact ? -2 : isSidebar ? -88 : 28;

    this.cards = cardModes.map((mode, index) => {
      const entry = difficultyConfig[mode];

      return new DifficultyOptionCard(
        scene,
        isSidebar ? startX : startX + index * (cardWidth + cardGap),
        isSidebar
          ? cardsY + index * (uiTheme.difficulty.sidebarCardHeight + uiTheme.difficulty.sidebarCardGap)
          : cardsY,
        {
        mode,
        title: entry.label,
        description: entry.description,
        variant: isCompact ? 'compact' : isSidebar ? 'sidebar' : 'default',
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

    if (this.layout === 'compact') {
      this.helperText.setText(difficultyConfig[mode].description);
    }

    if (emitChange) {
      this.onChanged?.(mode);
    }
  }
}
