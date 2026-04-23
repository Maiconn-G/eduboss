import Phaser from 'phaser';
import { gameConfig } from './game/config/gameConfig';

const container = document.getElementById('app');

if (!container) {
  throw new Error('Container #app nao encontrado.');
}

new Phaser.Game({
  ...gameConfig,
  parent: container
});
