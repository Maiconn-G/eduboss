import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';
import {
  DEFAULT_DIFFICULTY_MODE,
  DifficultySettings,
  getDifficultySettings
} from '../config/difficultyConfig';
import { Boss } from '../entities/Boss';
import { Cannon } from '../entities/Cannon';
import { Player } from '../entities/Player';
import { AnswerDropSystem } from '../systems/AnswerDropSystem';
import { AnswerPresentationSystem } from '../systems/AnswerPresentationSystem';
import { AnswerResetSystem } from '../systems/AnswerResetSystem';
import { AnswerStateSyncSystem } from '../systems/AnswerStateSyncSystem';
import { BossAttackSystem } from '../systems/BossAttackSystem';
import { BossMovementSystem } from '../systems/BossMovementSystem';
import { BossNarrationSystem } from '../systems/BossNarrationSystem';
import { BattleFlowSystem } from '../systems/BattleFlowSystem';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { PlayerHealthSystem } from '../systems/PlayerHealthSystem';
import { QuestionPresentationSystem } from '../systems/QuestionPresentationSystem';
import { QuestionSystem, validateAnswer } from '../systems/QuestionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { BossSpeechBubble } from '../ui/BossSpeechBubble';
import { BattleHud } from '../ui/BattleHud';
import { PhaseResetButton } from '../ui/PhaseResetButton';
import { UiPanel } from '../ui/UiPanel';
import { getTextStyle } from '../ui/theme/uiFactory';
import { uiTheme } from '../ui/theme/uiTheme';
import { DifficultyMode } from '../types/DifficultyMode';
import { Question } from '../types/Question';

type BattleSceneData = {
  questions?: Question[];
  difficulty?: DifficultyMode;
};

export class BattleScene extends Phaser.Scene {
  private player!: Player;
  private boss!: Boss;
  private cannon!: Cannon;
  private platforms: Phaser.GameObjects.Rectangle[] = [];

  private bossSpeechBubble!: BossSpeechBubble;
  private battleHud!: BattleHud;
  private feedbackText!: Phaser.GameObjects.Text;
  private phaseResetButton?: PhaseResetButton;

  private questionSystem!: QuestionSystem;
  private scoreSystem!: ScoreSystem;
  private answerResetSystem!: AnswerResetSystem;
  private answerDropSystem!: AnswerDropSystem;
  private answerPresentationSystem!: AnswerPresentationSystem;
  private answerStateSyncSystem!: AnswerStateSyncSystem;
  private playerHealthSystem!: PlayerHealthSystem;
  private bossAttackSystem!: BossAttackSystem;
  private bossMovementSystem!: BossMovementSystem;
  private battleFlowSystem!: BattleFlowSystem;
  private feedbackSystem!: FeedbackSystem;
  private bossNarrationSystem!: BossNarrationSystem;
  private questionPresentationSystem!: QuestionPresentationSystem;

  private questions: Question[] = [];
  private difficultyMode: DifficultyMode = DEFAULT_DIFFICULTY_MODE;
  private difficulty!: DifficultySettings;
  private groundTopY = 680;
  private sequenceToken = 0;

  constructor() {
    super('BattleScene');
  }

  public init(data: BattleSceneData): void {
    this.questions = data.questions ?? [];
    this.difficultyMode = data.difficulty ?? DEFAULT_DIFFICULTY_MODE;
    this.difficulty = getDifficultySettings(this.difficultyMode);
  }

  public create(): void {
    this.createBackground();
    this.createPlatforms();
    this.createSystems();
    this.createEntities();
    this.createUi();
    this.setupCollisions();
    this.registerSceneLifecycle();
    void this.startQuestionSequence();
  }

  public update(): void {
    if (this.battleFlowSystem.isTerminal()) {
      return;
    }

    this.player.setControlsEnabled(this.battleFlowSystem.canPlayerMove());
    this.player.update();
    this.bossAttackSystem.update();
    this.answerDropSystem.update(this.answerResetSystem.getItems());

    if (this.battleFlowSystem.canCollectAnswer() && this.player.consumeCollectIntent()) {
      this.tryCollectNearbyAnswer();
    }
  }

  private createBackground(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x93c5fd);
    this.add.rectangle(1090, 110, 120, 120, 0xfef08a, 0.85);
    this.add.ellipse(240, 160, 200, 80, 0xffffff, 0.55);
    this.add.ellipse(430, 120, 170, 64, 0xffffff, 0.45);
    this.add.rectangle(640, 650, 1280, 140, 0x4d7c0f);
    this.add.rectangle(640, 614, 1280, 44, 0x65a30d);
  }

  private createPlatforms(): void {
    this.platforms.push(this.addPlatform(640, 700, 1280, 40));
    this.platforms.push(this.addPlatform(320, 588, 230, 24));
    this.platforms.push(this.addPlatform(555, 510, 220, 24));
    this.platforms.push(this.addPlatform(810, 438, 230, 24));
  }

  private createSystems(): void {
    this.questionSystem = new QuestionSystem(this.questions);
    this.scoreSystem = new ScoreSystem({
      scorePenalty: this.difficulty.scorePenalty
    });
    this.battleFlowSystem = new BattleFlowSystem();
    this.playerHealthSystem = new PlayerHealthSystem(this, {
      maxHealth: this.difficulty.playerMaxHealth
    });
    this.feedbackSystem = new FeedbackSystem(this);
    this.answerResetSystem = new AnswerResetSystem(this, this.platforms);
    this.answerDropSystem = new AnswerDropSystem(this, this.difficulty);
  }

  private createEntities(): void {
    this.boss = new Boss(this, this.scale.width / 2, balanceConfig.bossHoverY, this.questionSystem.getTotalQuestions());
    this.player = new Player(this, 120, 620);
    this.cannon = new Cannon(this, this.scale.width - 120, 616);
    this.bossMovementSystem = new BossMovementSystem(this, this.boss);

    this.bossAttackSystem = new BossAttackSystem(
      this,
      this.boss,
      this.player,
      this.battleFlowSystem,
      this.playerHealthSystem,
      this.feedbackSystem,
      this.bossMovementSystem,
      this.difficulty,
      {
        arenaWidth: this.scale.width,
        dangerZoneY: this.groundTopY - 8,
        bossHoverY: balanceConfig.bossHoverY,
        flightLeftLimit: balanceConfig.bossFlightLeftLimit,
        flightRightLimit: balanceConfig.bossFlightRightLimit,
        attackLeftLimit: balanceConfig.bossAttackAlignLeftLimit,
        attackRightLimit: balanceConfig.bossAttackAlignRightLimit
      }
    );

    this.bossAttackSystem.start();
  }

  private createUi(): void {
    this.bossSpeechBubble = new BossSpeechBubble(this);
    this.bossNarrationSystem = new BossNarrationSystem(this, this.boss, this.bossSpeechBubble);
    this.answerPresentationSystem = new AnswerPresentationSystem(this, this.bossSpeechBubble);
    this.answerStateSyncSystem = new AnswerStateSyncSystem(this.answerPresentationSystem);
    this.battleHud = new BattleHud(
      this,
      892,
      48,
      this.boss.currentHP,
      this.boss.maxHP,
      this.playerHealthSystem.getCurrentHealth(),
      this.playerHealthSystem.getMaxHealth(),
      this.scoreSystem.getScore()
    );
    this.questionPresentationSystem = new QuestionPresentationSystem(
      this,
      this.bossNarrationSystem,
      this.answerPresentationSystem
    );

    this.playerHealthSystem.setListeners({
      onDamaged: () => {
        this.feedbackSystem.playDamageFeedback(this.player);
      },
      onHealthChanged: (currentHealth, maxHealth) => {
        this.battleHud.updateHealth(currentHealth, maxHealth);
      },
      onDefeated: () => {
        this.handleDefeat();
      }
    });

    this.feedbackText = this.add
      .text(this.scale.width / 2, 238, '', getTextStyle('body', {
        fontSize: '28px',
        fontStyle: 'bold',
        stroke: '#0f172a',
        strokeThickness: 5
      }))
      .setOrigin(0.5)
      .setDepth(60);

  }

  private setupCollisions(): void {
    this.platforms.forEach((platform) => {
      this.physics.add.collider(this.player, platform);
    });

    this.physics.add.overlap(
      this.player,
      this.cannon,
      () => {
        this.handleCannonOverlap();
      },
      undefined,
      this
    );
  }

  private registerSceneLifecycle(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sequenceToken += 1;
      this.answerResetSystem.clearAnswers();
      this.bossMovementSystem.dispose();
      this.bossAttackSystem.dispose();
      this.feedbackSystem.cancelHitStop();
      this.questionPresentationSystem.cancel();
      this.phaseResetButton?.destroy();
      this.phaseResetButton = undefined;
    });
  }

  private addPlatform(
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Rectangle {
    const platform = this.add
      .rectangle(x, y, width, height, 0x92400e)
      .setStrokeStyle(3, 0xf59e0b, 1)
      .setDepth(2);

    this.physics.add.existing(platform, true);
    return platform;
  }

  private async startQuestionSequence(): Promise<void> {
    const question = this.questionSystem.getCurrentQuestion();

    if (!question) {
      this.handleVictory();
      return;
    }

    const token = ++this.sequenceToken;

    this.player.clearCarriedAnswer();
    this.answerResetSystem.clearAnswers();
    this.bossAttackSystem.stopAllAttacks();
    this.bossMovementSystem.stopPatrol();
    await this.bossMovementSystem.returnToHover();
    this.feedbackText.setText('');
    this.battleFlowSystem.setState('boss_speaking');
    this.answerStateSyncSystem.beginQuestion(question);

    const presentationSlots = this.questionPresentationSystem.getPresentationAnswerSlots(
      this.boss,
      question.opcoes.length
    );

    await this.questionPresentationSystem.presentQuestion(this.boss, question);

    if (!this.isSequenceCurrent(token)) {
      return;
    }

    this.battleFlowSystem.setState('pre_answer_attack_wave');
    await this.bossAttackSystem.startPreAnswerWave();

    if (!this.isSequenceCurrent(token)) {
      return;
    }

    await this.releaseAnswersIntoArena();
  }

  private async releaseAnswersIntoArena(): Promise<void> {
    const currentQuestion = this.questionSystem.getCurrentQuestion();
    if (!currentQuestion) {
      return;
    }

    this.battleFlowSystem.setState('answer_drop');

    const presentationSlots = this.questionPresentationSystem.getLastPresentationSlots();
    this.answerResetSystem.spawnPendingAnswers(currentQuestion, presentationSlots);

    const launchPromise = this.answerDropSystem.launchAnswers(this.answerResetSystem.getItems());
    await this.timeDelay(140);

    if (!this.battleFlowSystem.isTerminal()) {
      this.answerStateSyncSystem.markAllDropped(currentQuestion);
    }

    await launchPromise;

    if (this.battleFlowSystem.isTerminal()) {
      return;
    }

    this.battleFlowSystem.setState('question_active');
  }

  private async relaunchCurrentQuestionAnswers(question: Question): Promise<void> {
    this.bossAttackSystem.stopAllAttacks();
    this.answerResetSystem.clearAnswers();
    this.answerStateSyncSystem.resetQuestionToDropped(question);

    await this.releaseAnswersIntoArena();
  }

  private tryCollectNearbyAnswer(): void {
    if (this.player.hasCarriedAnswer()) {
      return;
    }

    const answer = this.answerResetSystem
      .getCollectibleItems()
      .find((item) => this.physics.overlap(this.player, item));

    if (!answer) {
      this.showFeedback('Espere as respostas cairem e pare perto de uma delas.', '#ffffff');
      return;
    }

    if (this.player.pickupAnswer(answer)) {
      this.answerStateSyncSystem.markCollected(answer.optionId);
      this.showFeedback(`Resposta equipada: ${answer.optionText}`, '#d1fae5');
    }
  }

  private handleCannonOverlap(): void {
    if (!this.battleFlowSystem.canSubmitAnswer() || !this.player.hasCarriedAnswer()) {
      return;
    }

    const currentQuestion = this.questionSystem.getCurrentQuestion();
    const carriedAnswer = this.player.consumeCarriedAnswer();

    if (!currentQuestion || !carriedAnswer) {
      return;
    }

    this.battleFlowSystem.setState('answer_feedback');
    this.bossAttackSystem.stopAllAttacks();
    this.bossMovementSystem.stopPatrol();
    this.player.startAttack();
    this.feedbackSystem.playCannonFireFeedback(this.cannon);
    this.answerStateSyncSystem.markSubmitted(carriedAnswer.optionId);

    const isCorrect = validateAnswer(carriedAnswer.optionId, currentQuestion);
    carriedAnswer.destroy();
    this.answerResetSystem.clearAnswers();

    if (isCorrect) {
      this.handleCorrectAnswer(carriedAnswer.optionId);
      return;
    }

    void this.handleWrongAnswer(currentQuestion, carriedAnswer.optionId);
  }

  private handleCorrectAnswer(optionId: string): void {
    this.boss.takeDamage(1);
    void this.boss.playHitAnimation();
    this.answerStateSyncSystem.markCorrect(optionId);
    this.battleHud.updateBoss(this.boss.currentHP, this.boss.maxHP);
    this.feedbackSystem.playCorrectAnswerFeedback();
    this.feedbackSystem.playBossHitFeedback(this.boss);
    this.feedbackSystem.applyHitStop();
    this.showFeedback('Acertou! O boss recebeu dano.', '#dcfce7');

    if (this.boss.isDefeated()) {
      void this.boss.playDeathAnimation();
      this.time.delayedCall(700, () => {
        this.handleVictory();
      });
      return;
    }

    this.time.delayedCall(950, () => {
      if (this.battleFlowSystem.isTerminal()) {
        return;
      }

      this.questionSystem.advanceToNextQuestion();
      void this.startQuestionSequence();
    });
  }

  private async handleWrongAnswer(currentQuestion: Question, optionId: string): Promise<void> {
    this.scoreSystem.applyWrongAnswer();
    this.battleHud.updateScore(this.scoreSystem.getScore());
    this.feedbackSystem.playWrongAnswerFeedback();
    this.feedbackSystem.playDamageFeedback(this.player);
    this.answerStateSyncSystem.markWrongThenDropped(optionId);
    this.showFeedback(
      `Errou! -${this.difficulty.scorePenalty} pontos. O boss espalha as respostas de novo.`,
      '#fee2e2'
    );

    await new Promise<void>((resolve) => {
      this.time.delayedCall(650, () => resolve());
    });

    if (this.battleFlowSystem.isTerminal()) {
      return;
    }

    await this.relaunchCurrentQuestionAnswers(currentQuestion);
  }

  private handleVictory(): void {
    if (this.battleFlowSystem.getState() === 'victory') {
      return;
    }

    this.finishBattle(
      'victory',
      'Vitoria!',
      `Boss derrotado.\nScore final: ${this.scoreSystem.getScore()}`,
      '#fef08a'
    );
  }

  private handleDefeat(): void {
    if (this.battleFlowSystem.getState() === 'defeat') {
      return;
    }

    this.finishBattle(
      'defeat',
      'Derrota!',
      'Sua vida chegou a zero.\nUse o botao abaixo para tentar novamente.',
      '#fecaca'
    );
  }

  private finishBattle(
    state: 'victory' | 'defeat',
    title: string,
    subtitle: string,
    titleColor: string
  ): void {
    this.sequenceToken += 1;
    this.battleFlowSystem.setState(state);
    this.bossAttackSystem.stopAllAttacks();
    this.bossMovementSystem.stopPatrol();
    this.answerResetSystem.clearAnswers();
    this.player.clearCarriedAnswer();
    this.player.setControlsEnabled(false);
    this.feedbackSystem.cancelHitStop();
    this.questionPresentationSystem.cancel();
    this.physics.pause();
    this.phaseResetButton?.destroy();
    this.phaseResetButton = undefined;

    this.add.rectangle(640, 360, 1280, 720, uiTheme.colors.surfaceOverlay, 0.56).setDepth(80);
    const endPanel = new UiPanel(this, 640, 392, 520, 260, 'modal', uiTheme.radii.modal);
    endPanel.setDepth(81);
    this.add
      .text(640, 324, title, getTextStyle('heroTitle', {
        fontSize: '54px',
        color: titleColor,
        stroke: '#7c2d12',
        strokeThickness: 6
      }))
      .setOrigin(0.5)
      .setDepth(82);
    this.add
      .text(640, 404, subtitle, getTextStyle('body', {
        fontSize: '24px',
        align: 'center',
        wordWrap: { width: 420 }
      }))
      .setOrigin(0.5)
      .setDepth(82);

    this.phaseResetButton = new PhaseResetButton(
      this,
      640,
      494,
      state === 'victory' ? 'Reiniciar' : 'Tentar novamente',
      () => {
        this.restartPhase();
      }
    );
  }

  private isSequenceCurrent(token: number): boolean {
    return token === this.sequenceToken && !this.battleFlowSystem.isTerminal();
  }

  private showFeedback(message: string, color: string): void {
    this.feedbackText.setText(message);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);

    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      y: 196,
      duration: 1200,
      ease: 'Sine.easeOut',
      onStart: () => {
        this.feedbackText.setY(238);
      }
    });
  }

  private timeDelay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(delayMs, () => resolve());
    });
  }

  private restartPhase(): void {
    this.phaseResetButton?.setDisabled(true);
    this.sequenceToken += 1;
    this.feedbackSystem.cancelHitStop();
    this.physics.resume();
    this.input.enabled = false;
    this.time.delayedCall(0, () => {
      if (!this.scene.isActive()) {
        return;
      }

      this.scene.restart({
        questions: this.questions,
        difficulty: this.difficultyMode
      });
    });
  }
}
