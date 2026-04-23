import Phaser from 'phaser';
import { Question } from '../types/Question';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { BossSpeechBubble } from '../ui/BossSpeechBubble';

export class AnswerPresentationSystem {
  private currentQuestion?: Question;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly questionPanel: BossSpeechBubble
  ) {}

  public prepareQuestion(question: Question): void {
    this.currentQuestion = question;
    this.questionPanel.setQuestion(question);
    this.questionPanel.setAllOptionStates('pending');
  }

  public async pinQuestionPanel(): Promise<void> {
    if (!this.currentQuestion) {
      return;
    }

    this.questionPanel.setQuestion(this.currentQuestion);
    this.questionPanel.setAllOptionStates('pending');
    await this.questionPanel.moveToQuestionCorner();
  }

  public setOptionState(optionId: string, state: QuestionOptionState): void {
    this.questionPanel.setOptionState(optionId, state);
  }

  public setAllOptionsState(state: QuestionOptionState): void {
    this.questionPanel.setAllOptionStates(state);
  }

  public pulseWrongOption(optionId: string, revertState: QuestionOptionState): void {
    this.questionPanel.pulseWrongOption(optionId, revertState);
  }

  public hide(): void {
    this.questionPanel.resetPanel();
  }
}
