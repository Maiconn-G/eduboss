import { Question } from '../types/Question';
import { QuestionOptionState } from '../types/QuestionOptionState';
import { AnswerPresentationSystem } from './AnswerPresentationSystem';

export class AnswerStateSyncSystem {
  private optionStates = new Map<string, QuestionOptionState>();

  constructor(private readonly presentationSystem: AnswerPresentationSystem) {}

  public beginQuestion(question: Question): void {
    this.presentationSystem.prepareQuestion(question);
    this.optionStates.clear();

    question.opcoes.forEach((option) => {
      this.optionStates.set(option.id, 'pending');
    });
  }

  public markDropped(optionId: string): void {
    this.setState(optionId, 'dropped');
  }

  public markAllDropped(question: Question): void {
    question.opcoes.forEach((option) => {
      this.setState(option.id, 'dropped');
    });
  }

  public markCollected(optionId: string): void {
    this.setState(optionId, 'collected');
  }

  public markSubmitted(optionId: string): void {
    this.setState(optionId, 'submitted');
  }

  public markCorrect(optionId: string): void {
    this.setState(optionId, 'correct');
  }

  public markWrongThenDropped(optionId: string): void {
    this.optionStates.set(optionId, 'wrong');
    this.presentationSystem.setOptionState(optionId, 'wrong');
    this.presentationSystem.pulseWrongOption(optionId, 'dropped');
    this.optionStates.set(optionId, 'dropped');
  }

  public resetQuestionToDropped(question: Question): void {
    question.opcoes.forEach((option) => {
      this.setState(option.id, 'dropped');
    });
  }

  public getState(optionId: string): QuestionOptionState {
    return this.optionStates.get(optionId) ?? 'pending';
  }

  private setState(optionId: string, state: QuestionOptionState): void {
    this.optionStates.set(optionId, state);
    this.presentationSystem.setOptionState(optionId, state);
  }
}
