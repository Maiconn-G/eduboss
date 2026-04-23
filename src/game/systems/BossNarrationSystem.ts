import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import { Boss } from '../entities/Boss';
import { BossSpeechBubble } from '../ui/BossSpeechBubble';
import {
  BossNarrationAudioAdapter,
  BossNarrationBlockPlayback,
  BossNarrationConfig
} from '../types/BossNarration';
import { Question } from '../types/Question';

export const BOSS_NARRATION_EVENTS = {
  narrationStarted: 'boss-narration-started',
  questionShown: 'boss-question-shown',
  optionsShown: 'boss-options-shown',
  narrationFinished: 'boss-narration-finished'
} as const;

type NarrationBlockId = 'intro' | 'question' | 'options';

export class BossNarrationSystem {
  public readonly events = new Phaser.Events.EventEmitter();

  private activeTypewriter?: Phaser.Time.TimerEvent;
  private narrationToken = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boss: Boss,
    private readonly speechBubble: BossSpeechBubble,
    private readonly audioAdapter?: BossNarrationAudioAdapter
  ) {}

  public prepareBubblePosition(): void {
    this.speechBubble.positionNearBoss(this.boss);
  }

  public async startNarration(
    question: Question,
    config: BossNarrationConfig = {}
  ): Promise<void> {
    const token = ++this.narrationToken;
    const typewriterEnabled =
      config.typewriterEnabled ?? balanceConfig.bossSpeechTypewriterEnabled;
    const introText = config.introText ?? question.introTexto;

    this.events.emit(BOSS_NARRATION_EVENTS.narrationStarted, question);

    this.prepareBubblePosition();
    this.speechBubble.setNarrationMode();
    this.speechBubble.clearText();
    await this.speechBubble.playAppearTween(balanceConfig.bossSpeechAppearDuration);

    if (!this.isCurrent(token)) {
      return;
    }

    if (introText) {
      await this.presentTextBlock(token, 'intro', introText, typewriterEnabled);
      if (!this.isCurrent(token)) {
        return;
      }

      this.speechBubble.playEmphasisShake(
        balanceConfig.speechBubbleShakeDurationMs,
        balanceConfig.speechBubbleShakeIntensity
      );
      await this.wait(balanceConfig.narrationDramaticPauseMs);
    }

    await this.presentTextBlock(token, 'question', question.texto, typewriterEnabled);
    if (!this.isCurrent(token)) {
      return;
    }

    this.events.emit(BOSS_NARRATION_EVENTS.questionShown, question);
    await this.wait(balanceConfig.narrationBetweenQuestionAndOptionsMs);

    if (!this.isCurrent(token)) {
      return;
    }

    await this.presentOptions(token, question, typewriterEnabled);
    if (!this.isCurrent(token)) {
      return;
    }

    this.events.emit(BOSS_NARRATION_EVENTS.optionsShown, question);
    this.speechBubble.playEmphasisShake(
      balanceConfig.speechBubbleShakeDurationMs,
      balanceConfig.speechBubbleShakeIntensity
    );
    await this.wait(balanceConfig.narrationBeforeAttackWaveMs);

    if (!this.isCurrent(token)) {
      return;
    }

    this.events.emit(BOSS_NARRATION_EVENTS.narrationFinished, question);
  }

  public getAnswerPresentationSlots(optionCount: number): Phaser.Math.Vector2[] {
    return this.speechBubble.getAnswerSlots(optionCount);
  }

  public getBubbleOrigin(): Phaser.Math.Vector2 {
    return this.speechBubble.getPresentationOrigin();
  }

  public cancel(): void {
    this.narrationToken += 1;
    this.cancelTypewriter();
    this.speechBubble.resetPanel();
  }

  private async presentTextBlock(
    token: number,
    blockId: NarrationBlockId,
    content: string,
    typewriterEnabled: boolean
  ): Promise<void> {
    if (typewriterEnabled) {
      await this.playTypewriter(token, content);
    } else {
      this.speechBubble.setText(content);
    }

    if (!this.isCurrent(token)) {
      return;
    }

    const audioPayload: BossNarrationBlockPlayback = { blockId, text: content };
    await this.audioAdapter?.playBlock?.(audioPayload);
    await this.wait(balanceConfig.narrationBetweenBlocksDelay);
  }

  private async presentOptions(
    token: number,
    question: Question,
    typewriterEnabled: boolean
  ): Promise<void> {
    const optionLines = question.opcoes.map((option) => ({
      id: option.id,
      text: `${option.id.toUpperCase()}) ${option.texto}`
    }));

    this.speechBubble.setOptions(
      optionLines.map((option) => ({
        id: option.id,
        text: ''
      }))
    );

    for (let index = 0; index < optionLines.length; index += 1) {
      if (!this.isCurrent(token)) {
        return;
      }

      this.speechBubble.highlightOption(index);
      if (typewriterEnabled) {
        await this.playOptionTypewriter(token, index, optionLines[index].text);
      } else {
        this.speechBubble.setOptionText(index, optionLines[index].text);
      }

      if (!this.isCurrent(token)) {
        return;
      }

      await this.wait(balanceConfig.optionHighlightStepMs);
    }

    this.speechBubble.highlightOption(null);

    const audioPayload: BossNarrationBlockPlayback = {
      blockId: 'options',
      text: optionLines.map((option) => option.text).join('\n')
    };
    await this.audioAdapter?.playBlock?.(audioPayload);
    await this.wait(balanceConfig.narrationAfterOptionsDelay);
  }

  private playTypewriter(token: number, text: string): Promise<void> {
    this.cancelTypewriter();
    this.speechBubble.setText('');

    return new Promise((resolve) => {
      let index = 0;

      this.activeTypewriter = this.scene.time.addEvent({
        delay: balanceConfig.typewriterCharSpeed,
        loop: true,
        callback: () => {
          if (!this.isCurrent(token)) {
            this.cancelTypewriter();
            resolve();
            return;
          }

          index += 1;
          this.speechBubble.setText(text.slice(0, index));

          if (index >= text.length) {
            this.cancelTypewriter();
            resolve();
          }
        }
      });
    });
  }

  private playOptionTypewriter(
    token: number,
    optionIndex: number,
    text: string
  ): Promise<void> {
    this.cancelTypewriter();
    this.speechBubble.setOptionText(optionIndex, '');

    return new Promise((resolve) => {
      let index = 0;

      this.activeTypewriter = this.scene.time.addEvent({
        delay: balanceConfig.typewriterCharSpeed,
        loop: true,
        callback: () => {
          if (!this.isCurrent(token)) {
            this.cancelTypewriter();
            resolve();
            return;
          }

          index += 1;
          this.speechBubble.setOptionText(optionIndex, text.slice(0, index));

          if (index >= text.length) {
            this.cancelTypewriter();
            resolve();
          }
        }
      });
    });
  }

  private cancelTypewriter(): void {
    this.activeTypewriter?.destroy();
    this.activeTypewriter = undefined;
  }

  private isCurrent(token: number): boolean {
    return token === this.narrationToken;
  }

  private wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(delayMs, () => resolve());
    });
  }
}
