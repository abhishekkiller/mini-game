/**
 * Game 10: Reflex Challenge
 * Test human reaction speed with millisecond precision and false start detection.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class ReflexChallengeGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.trials = [];
    this.maxTrials = 3;
    this.currentTrial = 1;
    this.state = 'idle'; // 'waiting', 'ready', 'clicked', 'early', 'ended'
    this.readyTimestamp = 0;
    this.timeoutId = null;

    this._handleInput = this._handleInput.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view reflex-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TRIAL</span>
            <span class="hud-value" id="reflex-trial">1/3</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">AVG</span>
            <span class="hud-value highlight" id="reflex-avg">-- ms</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="reflex-best">${storage.getHighScore('reflex_challenge')} ms</span>
          </div>
        </div>

        <div class="reflex-pad state-waiting" id="reflex-pad">
          <div class="reflex-icon" id="reflex-icon">🔴</div>
          <div class="reflex-title" id="reflex-title">WAIT FOR GREEN...</div>
          <div class="reflex-sub" id="reflex-sub">Tap anywhere when the screen turns GREEN</div>
        </div>

        <div class="game-hint">Tip: Don't guess! Anticipation triggers a false start.</div>
      </div>
    `;

    this.padElem = this.container.querySelector('#reflex-pad');
    this.iconElem = this.container.querySelector('#reflex-icon');
    this.titleElem = this.container.querySelector('#reflex-title');
    this.subElem = this.container.querySelector('#reflex-sub');
    this.trialElem = this.container.querySelector('#reflex-trial');
    this.avgElem = this.container.querySelector('#reflex-avg');

    this.padElem.addEventListener('pointerdown', this._handleInput);
    window.addEventListener('keydown', this._handleKeyDown);

    this.startTrial();
  }

  _handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      this.processInput();
    }
  }

  _handleInput(e) {
    e.preventDefault();
    this.processInput();
  }

  startTrial() {
    this.state = 'waiting';
    this.trialElem.textContent = `${this.currentTrial}/${this.maxTrials}`;

    this.padElem.className = 'reflex-pad state-waiting';
    this.iconElem.textContent = '🔴';
    this.titleElem.textContent = 'WAIT FOR GREEN...';
    this.subElem.textContent = 'Do not tap yet!';

    // Random delay between 1.6s and 4.2s
    const delay = Math.random() * 2600 + 1600;

    this.timeoutId = setTimeout(() => {
      this.triggerGreen();
    }, delay);
  }

  triggerGreen() {
    this.state = 'ready';
    this.readyTimestamp = performance.now();

    this.padElem.className = 'reflex-pad state-ready';
    this.iconElem.textContent = '🟢';
    this.titleElem.textContent = 'TAP NOW!';
    this.subElem.textContent = 'FAST AS YOU CAN!';

    sound.playTick(true);
  }

  processInput() {
    if (this.state === 'waiting') {
      // False start!
      clearTimeout(this.timeoutId);
      this.state = 'early';
      sound.playError();

      this.padElem.className = 'reflex-pad state-early';
      this.iconElem.textContent = '⚠️';
      this.titleElem.textContent = 'TOO SOON!';
      this.subElem.textContent = 'Tap to retry this round';

      return;
    }

    if (this.state === 'early') {
      this.startTrial();
      return;
    }

    if (this.state === 'ready') {
      const reactionTime = Math.round(performance.now() - this.readyTimestamp);
      this.state = 'clicked';
      this.trials.push(reactionTime);
      sound.playSuccess();

      const avg = Math.round(this.trials.reduce((a, b) => a + b, 0) / this.trials.length);
      this.avgElem.textContent = `${avg} ms`;

      this.padElem.className = 'reflex-pad state-clicked';
      this.iconElem.textContent = '⚡';
      this.titleElem.textContent = `${reactionTime} ms!`;

      if (this.currentTrial < this.maxTrials) {
        this.subElem.textContent = `Great! Tap to start Round ${this.currentTrial + 1}`;
      } else {
        this.subElem.textContent = 'Challenge Complete! Calculating rank...';
      }

      return;
    }

    if (this.state === 'clicked') {
      if (this.currentTrial < this.maxTrials) {
        this.currentTrial++;
        this.startTrial();
      } else {
        this.endGame();
      }
    }
  }

  endGame() {
    this.state = 'ended';
    const avgScore = Math.round(this.trials.reduce((a, b) => a + b, 0) / this.trials.length);

    let rank = 'Cheetah 🐆';
    if (avgScore < 185) rank = 'Godlike Titan ⚡';
    else if (avgScore < 220) rank = 'Fighter Jet Pilot 🚀';
    else if (avgScore < 270) rank = 'Sharp Reflexes 🎯';
    else if (avgScore > 340) rank = 'Sleepy Sloth 🦥';

    const coinsEarned = Math.max(50, Math.floor(500 - avgScore));
    storage.addCoins(coinsEarned);

    if (avgScore < 220) {
      storage.unlockAchievement('lightning_reflex');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('reflex_challenge', avgScore);
    if (isNewBest) sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'reflex_challenge',
        gameTitle: 'Reflex Challenge',
        score: avgScore,
        scoreUnit: 'ms',
        subtitle: `Rank: ${rank} (${avgScore}ms average) • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    clearTimeout(this.timeoutId);
    this.state = 'ended';
    window.removeEventListener('keydown', this._handleKeyDown);
    if (this.padElem) {
      this.padElem.removeEventListener('pointerdown', this._handleInput);
    }
    this.container.innerHTML = '';
  }
}
