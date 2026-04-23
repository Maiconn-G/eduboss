import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

type ControlRowConfig = {
  action: string;
  keycaps: string[];
};

const controls: ControlRowConfig[] = [
  {
    action: 'Movimento',
    keycaps: ['A / D', 'Setas']
  },
  {
    action: 'Pulo',
    keycaps: ['W', 'Espaco']
  },
  {
    action: 'Coletar resposta',
    keycaps: ['E']
  },
  {
    action: 'Atacar o boss',
    keycaps: ['Leve ao canhao']
  }
];

export class ControlsPanel extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly rowContainers: Phaser.GameObjects.Container[] = [];
  private readonly rowWidth = 286;
  private readonly rowHeight = 40;
  private readonly badgeAreaWidth = 122;
  private readonly badgeGap = 14;

  private createRows(scene: Phaser.Scene): void {
    let currentY = -18;

    controls.forEach((control, index) => {
      const rowContainer = scene.add.container(0, currentY);
      const row = scene.add
        .rectangle(
          0,
          0,
          this.rowWidth,
          this.rowHeight,
          index % 2 === 0 ? 0xffffff : uiTheme.colors.surfaceLightMuted,
          0.82
        )
        .setStrokeStyle(1, uiTheme.colors.borderMuted, 0.46)
        .setOrigin(0.5);

      const actionText = scene.add
        .text(-128, 0, control.action, getTextStyle('sectionLabel', {
          color: '#1e293b',
          fontSize: '12px',
          wordWrap: { width: this.rowWidth - this.badgeAreaWidth - 42 }
        }))
        .setOrigin(0, 0.5);

      rowContainer.add([row, actionText]);

      const badgeItems = control.keycaps.map((keycap) => this.createKeycap(scene, keycap, 0, 0));
      const totalBadgeWidth = badgeItems.reduce((sum, badgeItem, badgeIndex) => {
        return sum + badgeItem.width + (badgeIndex < badgeItems.length - 1 ? this.badgeGap : 0);
      }, 0);
      const badgeAreaRight = this.rowWidth / 2 - 16;
      let badgeLeft = badgeAreaRight - totalBadgeWidth;

      badgeItems.forEach((badgeItem) => {
        badgeItem.container.setPosition(badgeLeft + badgeItem.width / 2, 0);
        rowContainer.add(badgeItem.container);
        badgeLeft += badgeItem.width + this.badgeGap;
      });

      this.rowContainers.push(rowContainer);
      this.add(rowContainer);
      currentY += 46;
    });
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.panel = new UiPanel(scene, 0, 0, 326, 294, 'light', uiTheme.radii.card);
    const title = scene.add
      .text(-136, -118, 'Controles', getTextStyle('panelTitle', { color: '#1d4ed8' }))
      .setOrigin(0, 0.5);
    const subtitle = scene.add
      .text(-136, -90, 'Tudo o que voce precisa para entrar na arena.', getTextStyle('bodyMuted', {
        color: '#475569',
        fontSize: '14px',
        wordWrap: { width: 250 }
      }))
      .setOrigin(0, 0);

    this.add([this.panel, title, subtitle]);
    this.createRows(scene);

    scene.add.existing(this);
  }

  public getRowTargets(): Phaser.GameObjects.Container[] {
    return this.rowContainers;
  }

  private createKeycap(
    scene: Phaser.Scene,
    label: string,
    x: number,
    y: number
  ): {
    container: Phaser.GameObjects.Container;
    width: number;
  } {
    const container = scene.add.container(x, y);
    const text = scene.add
      .text(0, 0, label, getTextStyle('sectionLabel', {
        color: uiTheme.colors.textPrimary,
        fontSize: label.length >= 10 ? '11px' : '12px'
      }))
      .setOrigin(0.5);

    const width =
      label.length <= 1
        ? 44
        : label.length <= 5
          ? 52
          : Math.max(62, text.width + 16);
    const shell = scene.add.graphics();
    shell.fillStyle(uiTheme.colors.surfaceDarkRaised, 0.96);
    shell.lineStyle(1, uiTheme.colors.borderSoft, 0.85);
    shell.fillRoundedRect(-width / 2, -13, width, 26, 12);
    shell.strokeRoundedRect(-width / 2, -13, width, 26, 12);

    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.12);
    shine.fillRoundedRect(-width / 2 + 5, -10, width - 10, 7, 8);

    container.add([shell, shine, text]);
    container.setSize(width, 26);
    return { container, width };
  }
}
