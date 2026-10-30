/**
 * Game 5: Number Memory
 * Memorize and reproduce increasingly long digit sequences.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class NumberMemoryGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.level = 3; // Start with 3 digits
    this.score = 0;
    this.sequence = '';
    this.userInput = '';
    this.state = 'idle'; // 'memorizing', 'recalling', 'ended'
    this.timerTimeout = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view number-memory-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">DIGITS</span>
            <span class="hud-value highlight" id="num-digits">3</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">LEVEL</span>
            <span class="hud-value" id="num-level">1</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="num-best">${storage.getHighScore('number_memory')}</span>
          </div>
        </div>

        <div class="number-stage-container" id="num-stage">
          <!-- Swapped between Memory Display and Keypad Input -->
        </div>

        <div class="game-hint">Tip: Chunk digits into pairs or triplets in your head!</div>
      </div>
    `;

    this.stageElem = this.container.querySelector('#num-stage');
    this.digitsElem = this.container.querySelector('#num-digits');
    this.levelElem = this.container.querySelector('#num-level');

    window.addEventListener('keydown', this._handleKeyDown);
    this.startRound();
  }

  generateSequence(len) {
    let str = '';
    for (let i = 0; i < len; i++) {
      str += Math.floor(Math.random() * 10);
    }
    return str;
  }

  startRound() {
    this.state = 'memorizing';
    this.sequence = this.generateSequence(this.level);
    this.userInput = '';

    this.digitsElem.textContent = this.level;
    this.levelElem.textContent = this.level - 2;

    const displayDuration = 1400 + (this.level * 600); // More time for longer sequences

    this.stageElem.innerHTML = `
      <div class="memory-phase">
        <div class="memory-prompt">MEMORIZE THIS NUMBER</div>
        <div class="memory-digits pop-in">${this.sequence}</div>
        <div class="memory-progress-track">
          <div class="memory-progress-bar" id="mem-progress" style="transition: width ${displayDuration}ms linear;"></div>
        </div>
      </div>
    `;

    // Trigger shrinking bar
    setTimeout(() => {
      const bar = this.container.querySelector('#mem-progress');
      if (bar) bar.style.width = '0%';
    }, 20);

    sound.playWhoosh();

    this.timerTimeout = setTimeout(() => {
      this.showInputPhase();
    }, displayDuration);
  }

  showInputPhase() {
    this.state = 'recalling';

    this.stageElem.innerHTML = `
      <div class="recall-phase">
        <div class="memory-prompt">WHAT WAS THE NUMBER?</div>
        <div class="recall-display" id="recall-input">_</div>

        <div class="numpad-grid">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(key => `
            <button class="numpad-btn ${key === '✓' ? 'submit' : ''} ${key === '⌫' ? 'back' : ''}" data-key="${key}">
              ${key}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.inputDisplay = this.container.querySelector('#recall-input');
    const buttons = this.stageElem.querySelectorAll('.numpad-btn');
    buttons.forEach(btn => {
      btn.addEventListener('pointerdown', () => this.handleKeyInput(btn.dataset.key));
    });
  }

  _handleKeyDown(e) {
    if (this.state !== 'recalling') return;

    if (e.key >= '0' && e.key <= '9') {
      this.handleKeyInput(e.key);
    } else if (e.key === 'Backspace') {
      this.handleKeyInput('⌫');
    } else if (e.key === 'Enter') {
      this.handleKeyInput('✓');
    }
  }

  handleKeyInput(key) {
    if (this.state !== 'recalling') return;

    if (key === '⌫') {
      this.userInput = this.userInput.slice(0, -1);
      sound.playTap(0.8);
    } else if (key === '✓') {
      this.submitAnswer();
      return;
    } else {
      if (this.userInput.length < this.sequence.length + 2) {
        this.userInput += key;
        sound.playTap(1.1);
      }
    }

    if (this.inputDisplay) {
      this.inputDisplay.textContent = this.userInput || '_';
    }

    // Auto submit if user entered full length
    if (this.userInput.length === this.sequence.length) {
      setTimeout(() => this.submitAnswer(), 200);
    }
  }

  submitAnswer() {
    if (this.state !== 'recalling' || !this.userInput) return;

    if (this.userInput === this.sequence) {
      // Correct!
      sound.playSuccess();
      this.score = this.level;
      this.level++;
      this.stageElem.innerHTML = `
        <div class="memory-result correct">
          <div class="result-icon">🎉</div>
          <div class="result-title">CORRECT!</div>
          <div class="result-sub">Level up! Adding 1 more digit...</div>
        </div>
      `;

      setTimeout(() => this.startRound(), 1200);
    } else {
      // Wrong
      this.endGame();
    }
  }

  endGame() {
    this.state = 'ended';
    sound.playError();

    this.stageElem.innerHTML = `
      <div class="memory-result wrong">
        <div class="result-title">MISSED!</div>
        <div class="result-comparison">
          <div><span class="lbl">Actual:</span> <strong class="correct-text">${this.sequence}</strong></div>
          <div><span class="lbl">You typed:</span> <strong class="wrong-text">${this.userInput || '(none)'}</strong></div>
        </div>
      </div>
    `;

    const finalScore = Math.max(0, this.level - 1);
    const coinsEarned = finalScore * 15;
    storage.addCoins(coinsEarned);

    if (finalScore >= 8) {
      storage.unlockAchievement('number_span');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('number_memory', finalScore);
    if (isNewBest) sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'number_memory',
        gameTitle: 'Number Memory',
        score: finalScore,
        scoreUnit: 'digits',
        subtitle: `Memory Span: ${finalScore} Digits • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 1500);
  }

  destroy() {
    clearTimeout(this.timerTimeout);
    window.removeEventListener('keydown', this._handleKeyDown);
    this.container.innerHTML = '';
  }
}
