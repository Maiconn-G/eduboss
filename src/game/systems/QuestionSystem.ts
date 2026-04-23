import { Question } from '../types/Question';

export function validateAnswer(selectedId: string, currentQuestion: Question): boolean {
  return selectedId === currentQuestion.correta;
}

export class QuestionSystem {
  private currentIndex = 0;

  constructor(private readonly questions: Question[]) {}

  public getTotalQuestions(): number {
    return this.questions.length;
  }

  public getCurrentQuestion(): Question | null {
    return this.questions[this.currentIndex] ?? null;
  }

  public advanceToNextQuestion(): Question | null {
    this.currentIndex += 1;
    return this.getCurrentQuestion();
  }
}
