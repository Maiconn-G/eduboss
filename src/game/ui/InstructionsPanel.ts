import Phaser from 'phaser';
import { UiPanel } from './UiPanel';
import { getTextStyle } from './theme/uiFactory';
import { uiTheme } from './theme/uiTheme';

const instructions = [
  'O boss apresenta uma pergunta e pressiona a arena com ataques.',
  'As respostas corretas e erradas caem pelo mapa como pickups.',
  'Pegue uma opcao e leve-a ate o canhao no canto direito.',
  'Acertos causam dano no boss; erros custam pontos, mas a pergunta continua.',
  'Sobreviva, responda certo e derrube o chefao para vencer.'
];

const tipText = 'Dica: cada erro custa 5 pontos, mas a pergunta so acaba quando voce acertar.';

export class InstructionsPanel extends Phaser.GameObjects.Container {
  private readonly panel: UiPanel;
  private readonly itemContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.panel = new UiPanel(scene, 0, 0, 446, 416, 'light', uiTheme.radii.card);
    const title = scene.add
      .text(-186, -184, 'Como jogar', getTextStyle('panelTitle', { color: '#1d4ed8' }))
      .setOrigin(0, 0.5);
    const intro = scene.add
      .text(
        -186,
        -158,
        'Aprenda a dinamica da batalha antes de entrar na arena.',
        getTextStyle('bodyMuted', {
          color: '#475569',
          fontSize: '14px',
          wordWrap: { width: 362 }
        })
      )
      .setOrigin(0, 0);

    this.add([this.panel, title, intro]);
    this.createBulletList(scene);
    scene.add.existing(this);
  }

  public getItemTargets(): Phaser.GameObjects.Container[] {
    return this.itemContainers;
  }

  private createBulletList(scene: Phaser.Scene): void {
    let currentY = -112;

    instructions.forEach((line, index) => {
      const itemContainer = scene.add.container(0, currentY);
      const bullet = scene.add.circle(-186, 7, 5, index < 2 ? uiTheme.colors.brand : uiTheme.colors.success, 1);
      const text = scene.add
        .text(
          -170,
          0,
          line,
          getTextStyle('bodyMuted', {
            color: '#1e293b',
            fontSize: '14px',
            wordWrap: { width: 346 },
            lineSpacing: 3
          })
        )
        .setOrigin(0, 0);

      itemContainer.add([bullet, text]);
      this.itemContainers.push(itemContainer);
      this.add(itemContainer);
      currentY += text.height + 6;
    });

    this.createTipCallout(scene, currentY + 22);
  }

  private createTipCallout(scene: Phaser.Scene, y: number): void {
    const tipContainer = scene.add.container(0, y);
    const tipLabel = scene.add
      .text(-172, -14, 'Dica importante', getTextStyle('sectionLabel', {
        color: '#b45309',
        fontSize: '13px'
      }))
      .setOrigin(0, 0.5);
    const tipBody = scene.add
      .text(
        -172,
        10,
        tipText,
        getTextStyle('bodyMuted', {
          color: '#92400e',
          fontSize: '13px',
          wordWrap: { width: 340 },
          lineSpacing: 3
        })
      )
      .setOrigin(0, 0);

    const tipHeight = Math.max(66, tipBody.height + 34);
    const tipBackground = scene.add
      .rectangle(0, tipHeight / 2 - 6, 386, tipHeight, 0xfffbeb, 0.96)
      .setStrokeStyle(1, 0xf59e0b, 0.55)
      .setOrigin(0.5);

    const tipAccent = scene.add
      .rectangle(-176, tipHeight / 2 - 6, 6, tipHeight - 12, 0xf59e0b, 0.9)
      .setOrigin(0.5);

    tipContainer.add([tipBackground, tipAccent, tipLabel, tipBody]);
    this.itemContainers.push(tipContainer);
    this.add(tipContainer);
  }
}
