import Phaser from 'phaser';
import { balanceConfig } from '../config/balanceConfig';

type PlayerHealthListeners = {
  onDamaged?: (currentHealth: number, maxHealth: number) => void;
  onHealthChanged?: (currentHealth: number, maxHealth: number) => void;
  onDefeated?: () => void;
};

export class PlayerHealthSystem {
  private currentHealth: number;
  private invulnerableUntil = 0;
  private listeners: PlayerHealthListeners = {};
  private readonly maxHealth: number;
  private readonly damageInvulnerabilityMs: number;

  constructor(
    private readonly scene: Phaser.Scene,
    config: {
      maxHealth: number;
      damageInvulnerabilityMs?: number;
    }
  ) {
    this.maxHealth = config.maxHealth;
    this.damageInvulnerabilityMs =
      config.damageInvulnerabilityMs ?? balanceConfig.damageInvulnerabilityMs;
    this.currentHealth = this.maxHealth;
  }

  public setListeners(listeners: PlayerHealthListeners): void {
    this.listeners = listeners;
    this.listeners.onHealthChanged?.(this.currentHealth, this.maxHealth);
  }

  public getCurrentHealth(): number {
    return this.currentHealth;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public isDefeated(): boolean {
    return this.currentHealth <= 0;
  }

  public isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil;
  }

  public takeDamage(amount: number): boolean {
    if (this.isDefeated() || this.isInvulnerable()) {
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.invulnerableUntil = this.scene.time.now + this.damageInvulnerabilityMs;

    this.listeners.onDamaged?.(this.currentHealth, this.maxHealth);
    this.listeners.onHealthChanged?.(this.currentHealth, this.maxHealth);

    if (this.currentHealth <= 0) {
      this.listeners.onDefeated?.();
    }

    return true;
  }
}
