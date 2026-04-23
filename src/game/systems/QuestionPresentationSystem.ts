import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import { BossNarrationSystem } from './BossNarrationSystem';
import { Question } from '../types/Question';
import { BossNarrationConfig } from '../types/BossNarration';
import { AnswerPresentationSystem } from './AnswerPresentationSystem';

export class QuestionPresentationSystem {
  private lastPresentationSlots: Phaser.Math.Vector2[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly narrationSystem: BossNarrationSystem,
    private readonly answerPresentationSystem: AnswerPresentationSystem
  ) {}

  public getPresentationAnswerSlots(
    boss: Boss,
    optionCount: number
  ): Phaser.Math.Vector2[] {
    this.narrationSystem.prepareBubblePosition();
    this.lastPresentationSlots = this.narrationSystem.getAnswerPresentationSlots(optionCount);
    return this.lastPresentationSlots.map((slot) => slot.clone());
  }

  public getLastPresentationSlots(): Phaser.Math.Vector2[] {
    return this.lastPresentationSlots.map((slot) => slot.clone());
  }

  public async presentQuestion(
    boss: Boss,
    question: Question,
    config?: BossNarrationConfig
  ): Promise<void> {
    this.answerPresentationSystem.prepareQuestion(question);
    this.answerPresentationSystem.hide();

    await this.narrationSystem.startNarration(question, config);
    await this.revealPinnedQuestion();
  }

  public async revealPinnedQuestion(): Promise<void> {
    await this.answerPresentationSystem.pinQuestionPanel();
  }

  public cancel(): void {
    this.narrationSystem.cancel();
  }
}
