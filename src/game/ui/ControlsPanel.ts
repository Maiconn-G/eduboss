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

  private createRows(scene: Phaser.Scene): void {
    let currentY = -20;

    controls.forEach((control, index) => {
      const rowContainer = scene.add.container(0, currentY);
      const row = scene.add
        .rectangle(
          0,
          0,
          this.rowWidth,
          38,
          index % 2 === 0 ? 0xffffff : uiTheme.colors.surfaceLightMuted,
          0.82
        )
        .setStrokeStyle(1, uiTheme.colors.borderMuted, 0.46)
        .setOrigin(0.5);

      const actionText = scene.add
        .text(-128, 0, control.action, getTextStyle('sectionLabel', {
          color: '#1e293b',
          fontSize: '13px'
        }))
        .setOrigin(0, 0.5);

      rowContainer.add([row, actionText]);

      const badges = control.keycaps.map((keycap) => this.createKeycap(scene, keycap, 0, 0));
      const totalBadgeWidth = badges.reduce((sum, badge, badgeIndex) => {
        return sum + badge.getBounds().width + (badgeIndex < badges.length - 1 ? 8 : 0);
      }, 0);
      let badgeX = this.rowWidth / 2 - totalBadgeWidth - 10;
      badges.forEach((badge) => {
        badge.setPosition(badgeX + badge.getBounds().width / 2, 0);
        rowContainer.add(badge);
        badgeX += badge.getBounds().width + 8;
      });

      this.rowContainers.push(rowContainer);
      this.add(rowContainer);
      currentY += 48;
    });
  }

  private createKeycap(scene: Phaser.Scene, label: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const text = scene.add
      .text(0, 0, label, getTextStyle('sectionLabel', {
        color: uiTheme.colors.textPrimary,
        fontSize: '13px'
      }))
      .setOrigin(0.5);

    const width = Math.max(58, text.width + 18);
    const shell = scene.add.graphics();
    shell.fillStyle(uiTheme.colors.surfaceDarkRaised, 0.96);
    shell.lineStyle(1, uiTheme.colors.borderSoft, 0.85);
    shell.fillRoundedRect(-width / 2, -13, width, 26, 11);
    shell.strokeRoundedRect(-width / 2, -13, width, 26, 11);

    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.12);
    shine.fillRoundedRect(-width / 2 + 5, -10, width - 10, 8, 8);

    container.add([shell, shine, text]);
    container.setSize(width, 26);
    return container;
  }
}
