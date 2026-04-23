import attackSmashLoopUrl from '../../../assets/images/boss/Enemy3-AttackSmashLoop.png';
import attackSmashStartUrl from '../../../assets/images/boss/Enemy3-AttackSmashStart.png';
import dieUrl from '../../../assets/images/boss/Enemy3-Die.png';
import flyUrl from '../../../assets/images/boss/Enemy3-Fly.png';
import hitNoVfxUrl from '../../../assets/images/boss/Enemy3-Hit-NoVFX.png';
import hitUrl from '../../../assets/images/boss/Enemy3-Hit.png';
import idleUrl from '../../../assets/images/boss/Enemy3-Idle.png';
import smashEndUrl from '../../../assets/images/boss/Enemy3-SmashEnd.png';

export type BossAnimationState =
  | 'idle'
  | 'fly'
  | 'hit'
  | 'hitNoVFX'
  | 'die'
  | 'smashStart'
  | 'smashLoop'
  | 'smashEnd';

export type BossAnimationDefinition = {
  key: BossAnimationState;
  assetPath: string;
  textureKey: string;
  animationKey: string;
  frameWidth: number;
  frameHeight: number;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
};

const frameWidth = 64;
const frameHeight = 64;

export const bossAnimationConfig: Record<BossAnimationState, BossAnimationDefinition> = {
  idle: {
    key: 'idle',
    assetPath: idleUrl,
    textureKey: 'boss-idle',
    animationKey: 'boss-idle',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 7,
    frameRate: 10,
    repeat: -1
  },
  fly: {
    key: 'fly',
    assetPath: flyUrl,
    textureKey: 'boss-fly',
    animationKey: 'boss-fly',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 7,
    frameRate: 12,
    repeat: -1
  },
  hit: {
    key: 'hit',
    assetPath: hitUrl,
    textureKey: 'boss-hit',
    animationKey: 'boss-hit',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 3,
    frameRate: 16,
    repeat: 0
  },
  hitNoVFX: {
    key: 'hitNoVFX',
    assetPath: hitNoVfxUrl,
    textureKey: 'boss-hit-no-vfx',
    animationKey: 'boss-hit-no-vfx',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 3,
    frameRate: 16,
    repeat: 0
  },
  die: {
    key: 'die',
    assetPath: dieUrl,
    textureKey: 'boss-die',
    animationKey: 'boss-die',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 16,
    frameRate: 14,
    repeat: 0
  },
  smashStart: {
    key: 'smashStart',
    assetPath: attackSmashStartUrl,
    textureKey: 'boss-smash-start',
    animationKey: 'boss-smash-start',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 11,
    frameRate: 18,
    repeat: 0
  },
  smashLoop: {
    key: 'smashLoop',
    assetPath: attackSmashLoopUrl,
    textureKey: 'boss-smash-loop',
    animationKey: 'boss-smash-loop',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 2,
    frameRate: 16,
    repeat: -1
  },
  smashEnd: {
    key: 'smashEnd',
    assetPath: smashEndUrl,
    textureKey: 'boss-smash-end',
    animationKey: 'boss-smash-end',
    frameWidth,
    frameHeight,
    startFrame: 0,
    endFrame: 7,
    frameRate: 16,
    repeat: 0
  }
};

export const bossAnimationDefinitions = Object.values(bossAnimationConfig);
export const bossDefaultAnimation = bossAnimationConfig.idle;
