import Phaser from 'phaser';
import { BattleState } from '../types/BattleState';

export const BATTLE_FLOW_EVENTS = {
  stateChanged: 'battle-flow-state-changed'
} as const;

export class BattleFlowSystem {
  public readonly events = new Phaser.Events.EventEmitter();
  private currentState: BattleState = 'intro';

  public getState(): BattleState {
    return this.currentState;
  }

  public setState(nextState: BattleState): void {
    if (nextState === this.currentState) {
      return;
    }

    const previousState = this.currentState;
    this.currentState = nextState;
    this.events.emit(BATTLE_FLOW_EVENTS.stateChanged, nextState, previousState);
  }

  public canPlayerMove(): boolean {
    return (
      this.currentState === 'boss_speaking' ||
      this.currentState === 'pre_answer_attack_wave' ||
      this.currentState === 'answer_drop' ||
      this.currentState === 'question_active'
    );
  }

  public canCollectAnswer(): boolean {
    return this.currentState === 'question_active';
  }

  public canSubmitAnswer(): boolean {
    return this.currentState === 'question_active';
  }

  public canBossAttack(): boolean {
    return (
      this.currentState === 'pre_answer_attack_wave' ||
      this.currentState === 'question_active'
    );
  }

  public canTakeDamage(): boolean {
    return (
      this.currentState === 'pre_answer_attack_wave' ||
      this.currentState === 'question_active'
    );
  }

  public isTerminal(): boolean {
    return this.currentState === 'victory' || this.currentState === 'defeat';
  }
}
