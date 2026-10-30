/**
 * Game 2: Color Reaction Test (Stroop Blitz)
 * Select the correct ink color or word under extreme time pressure.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

const COLORS = [
  { name: 'RED', hex: '#ff2a5f' },
  { name: 'BLUE', hex: '#00d2ff' },
  { name: 'GREEN', hex: '#00e676' },
  { name: 'YELLOW', hex: '#ffd600' },
  { name: 'PURPLE', hex: '#d500f9' },
  { name: 'ORANGE', hex: '#ff9100' }
];

export class ColorReactionGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.state = 'idle';
    this.score = 0;
    this.timeLeft = 25.0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timerInterval = null;
    this.currentMode = 'ink'; // 'ink' = match ink color, 'text' = match word meaning
    this.targetColor = null;
    this._handleChoice = this._handleChoice.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view color-reaction-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="color-timer">25.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">COMBO</span>
            <span class="hud-value highlight" id="color-combo">0x</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-value" id="color-score">0</span>
          </div>
        </div>

        <div class="color-instruction-bar" id="color-instruction">
          MATCH THE INK COLOR!
        </div>

        <div class="color-display-card" id="color-card">
          <div class="color-word" id="color-word">READY?</div>
        </div>

        <div class="color-buttons-grid" id="color-grid">
          <!-- Dynamic Buttons -->
        </div>

        <div class="game-hint">Watch out: The ink color tricks your brain!</div>
      </div>
    `;

    this.timerElem = this.container.querySelector('#color-timer');
    this.comboElem = this.container.querySelector('#color-combo');
    this.scoreElem = this.container.querySelector('#color-score');
    this.wordElem = this.container.querySelector('#color-word');
    this.instructionElem = this.container.querySelector('#color-instruction');
    this.gridElem = this.container.querySelector('#color-grid');
    this.cardElem = this.container.querySelector('#color-card');

    this.startGame();
  }

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.timeLeft = 25.0;
    this.combo = 0;
    this.maxCombo = 0;

    this.nextRound();

    this.timerInterval = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 0.1);
      this.timerElem.textContent = `${this.timeLeft.toFixed(1)}s`;

      if (this.timeLeft <= 5.0) {
        this.timerElem.classList.add('urgent');
      }

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 100);
  }

  nextRound() {
    if (this.state !== 'playing') return;

    // Pick 4 unique colors for buttons
    const shuffled = [...COLORS].sort(() => 0.5 - Math.random());
    const roundColors = shuffled.slice(0, 4);

    // Pick target from round colors
    const targetIdx = Math.floor(Math.random() * roundColors.length);
    const target = roundColors[targetIdx];

    // Pick text label (might be different or same)
    const textIdx = Math.floor(Math.random() * roundColors.length);
    const textItem = roundColors[textIdx];

    // Randomize mode every few rounds (75% ink color, 25% text meaning)
    this.currentMode = Math.random() < 0.25 ? 'text' : 'ink';

    if (this.currentMode === 'ink') {
      this.targetColor = target;
      this.instructionElem.textContent = 'MATCH INK COLOR! 🎨';
      this.instructionElem.style.color = '#00f2fe';
    } else {
      this.targetColor = textItem;
      this.instructionElem.textContent = 'MATCH THE WORD! 🔤';
      this.instructionElem.style.color = '#ffd700';
    }

    this.wordElem.textContent = textItem.name;
    this.wordElem.style.color = target.hex;
    this.wordElem.classList.add('pop-in');
    setTimeout(() => this.wordElem?.classList.remove('pop-in'), 150);

    // Render 4 color choice buttons
    this.gridElem.innerHTML = '';
    roundColors.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.textContent = color.name;
      btn.style.borderColor = color.hex;
      btn.style.boxShadow = `0 4px 14px ${color.hex}33`;
      btn.dataset.colorName = color.name;
      btn.addEventListener('pointerdown', () => this._handleChoice(color));
      this.gridElem.appendChild(btn);
    });
  }

  _handleChoice(chosenColor) {
    if (this.state !== 'playing') return;

    const isCorrect = chosenColor.name === this.targetColor.name;

    if (isCorrect) {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const points = 1 + Math.floor(this.combo / 4);
      this.score += points;
      this.timeLeft = Math.min(30.0, this.timeLeft + 0.5); // bonus time

      this.scoreElem.textContent = this.score;
      this.comboElem.textContent = `${this.combo}x`;
      if (this.combo >= 4) this.comboElem.classList.add('fire');

      sound.playScore(this.combo);
      this.cardElem.classList.add('flash-green');
      setTimeout(() => this.cardElem?.classList.remove('flash-green'), 120);

      this.nextRound();
    } else {
      // Penalty
      this.combo = 0;
      this.comboElem.textContent = '0x';
      this.comboElem.classList.remove('fire');
      this.timeLeft = Math.max(0, this.timeLeft - 2.0); // 2s penalty

      sound.playError();
      this.cardElem.classList.add('flash-red');
      this.container.classList.add('shake');
      setTimeout(() => {
        this.cardElem?.classList.remove('flash-red');
        this.container?.classList.remove('shake');
      }, 250);

      this.nextRound();
    }
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    this.timerElem.textContent = '0.0s';

    const coinsEarned = Math.floor(this.score * 2);
    storage.addCoins(coinsEarned);

    if (this.score >= 20) {
      storage.unlockAchievement('color_ninja');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('color_reaction', this.score);
    if (isNewBest) sound.playFanfare();
    else sound.playSuccess();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'color_reaction',
        gameTitle: 'Color Reaction Test',
        score: this.score,
        scoreUnit: 'pts',
        subtitle: `Max Combo: ${this.maxCombo}x • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 500);
  }

  destroy() {
    clearInterval(this.timerInterval);
    this.state = 'ended';
    this.container.innerHTML = '';
  }
}
