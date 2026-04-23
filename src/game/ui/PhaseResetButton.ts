import Phaser from 'phaser';
import { UiButton } from './UiButton';

export class PhaseResetButton extends UiButton {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void
  ) {
    super(scene, x, y, {
      label,
      width: 240,
      height: 64,
      variant: 'primary',
      depth: 91,
      onClick
    });
  }
}
