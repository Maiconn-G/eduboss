import Phaser from 'phaser';
import { DEFAULT_DIFFICULTY_MODE } from '../config/difficultyConfig';
import { DifficultyMode } from '../types/DifficultyMode';
import { StartScreen } from '../ui/StartScreen';
import { Question } from '../types/Question';

export class LobbyScene extends Phaser.Scene {
  private selectedDifficulty: DifficultyMode = DEFAULT_DIFFICULTY_MODE;

  constructor() {
    super('LobbyScene');
  }

  public create(): void {
    new StartScreen(this, {
      initialDifficulty: this.selectedDifficulty,
      onStart: (difficulty) => {
        this.selectedDifficulty = difficulty;
        this.scene.start('BattleScene', {
          questions: this.buildMockQuestions(),
          difficulty
        });
      }
    });
  }

  private buildMockQuestions(): Question[] {
    return [
      {
        id: 1,
        texto: 'Qual o resultado de 5 x 5?',
        opcoes: [
          { id: 'a', texto: '20' },
          { id: 'b', texto: '25' },
          { id: 'c', texto: '30' }
        ],
        correta: 'b'
      },
      {
        id: 2,
        texto: 'Qual planeta e conhecido como Planeta Vermelho?',
        opcoes: [
          { id: 'a', texto: 'Marte' },
          { id: 'b', texto: 'Venus' },
          { id: 'c', texto: 'Saturno' }
        ],
        correta: 'a'
      },
      {
        id: 3,
        texto: 'Qual e a capital do Brasil?',
        opcoes: [
          { id: 'a', texto: 'Rio de Janeiro' },
          { id: 'b', texto: 'Brasilia' },
          { id: 'c', texto: 'Salvador' }
        ],
        correta: 'b'
      }
    ];
  }
}
