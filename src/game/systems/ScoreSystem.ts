import { balanceConfig } from '../config/balanceConfig';

type ScoreSystemConfig = {
  initialScore?: number;
  scorePenalty: number;
};

export class ScoreSystem {
  private score: number;
  private readonly scorePenalty: number;

  constructor(config: ScoreSystemConfig) {
    this.score = config.initialScore ?? balanceConfig.initialScore;
    this.scorePenalty = config.scorePenalty;
  }

  public getScore(): number {
    return this.score;
  }

  public applyWrongAnswer(): number {
    this.score -= this.scorePenalty;
    return this.score;
  }
}
