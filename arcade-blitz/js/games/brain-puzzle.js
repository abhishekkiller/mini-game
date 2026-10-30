/**
 * Game 3: Brain Puzzle Rush
 * Solve fast arithmetic, sequence, and logic puzzles against the ticking timer.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class BrainPuzzleGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.state = 'idle';
    this.score = 0;
    this.timeLeft = 35.0;
    this.combo = 0;
    this.timerInterval = null;
    this.currentPuzzle = null;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view brain-puzzle-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="puzzle-timer">35.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">COMBO</span>
            <span class="hud-value highlight" id="puzzle-combo">0x</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-value" id="puzzle-score">0</span>
          </div>
        </div>

        <div class="puzzle-category-badge" id="puzzle-category">ARITHMETIC RUSH</div>

        <div class="puzzle-card" id="puzzle-card">
          <div class="puzzle-question" id="puzzle-question">Generating...</div>
        </div>

        <div class="puzzle-options-grid" id="puzzle-options">
          <!-- Dynamic options -->
        </div>

        <div class="game-hint">Tip: Use keys 1, 2, 3, 4 on keyboard or tap options!</div>
      </div>
    `;

    this.timerElem = this.container.querySelector('#puzzle-timer');
    this.comboElem = this.container.querySelector('#puzzle-combo');
    this.scoreElem = this.container.querySelector('#puzzle-score');
    this.categoryElem = this.container.querySelector('#puzzle-category');
    this.cardElem = this.container.querySelector('#puzzle-card');
    this.questionElem = this.container.querySelector('#puzzle-question');
    this.optionsElem = this.container.querySelector('#puzzle-options');

    window.addEventListener('keydown', this._handleKeyDown);
    this.startGame();
  }

  _handleKeyDown(e) {
    if (this.state !== 'playing') return;
    const keyMap = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3, 'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2, 'Numpad4': 3 };
    if (e.code in keyMap) {
      const idx = keyMap[e.code];
      const buttons = this.optionsElem.querySelectorAll('.puzzle-opt-btn');
      if (buttons[idx]) buttons[idx].click();
    }
  }

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.timeLeft = 35.0;
    this.combo = 0;

    this.nextPuzzle();

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

  generatePuzzle() {
    const types = ['math', 'sequence', 'operator', 'compare'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'math') {
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, ans;

      if (op === '+') {
        a = Math.floor(Math.random() * 45 + 5);
        b = Math.floor(Math.random() * 45 + 5);
        ans = a + b;
      } else if (op === '-') {
        a = Math.floor(Math.random() * 60 + 20);
        b = Math.floor(Math.random() * (a - 10) + 5);
        ans = a - b;
      } else {
        a = Math.floor(Math.random() * 9 + 3);
        b = Math.floor(Math.random() * 9 + 3);
        ans = a * b;
      }

      const options = this.generateDistractors(ans);
      return {
        category: '⚡ SPEED MATH',
        question: `${a} ${op} ${b} = ?`,
        correct: ans,
        options
      };
    } else if (type === 'sequence') {
      const seqTypes = ['add', 'double', 'squares'];
      const st = seqTypes[Math.floor(Math.random() * seqTypes.length)];
      let seq = [], nextVal;

      if (st === 'add') {
        const step = Math.floor(Math.random() * 6 + 2);
        const start = Math.floor(Math.random() * 15 + 1);
        seq = [start, start + step, start + step * 2, start + step * 3];
        nextVal = start + step * 4;
      } else if (st === 'double') {
        const start = Math.floor(Math.random() * 4 + 2);
        seq = [start, start * 2, start * 4, start * 8];
        nextVal = start * 16;
      } else {
        const start = Math.floor(Math.random() * 3 + 1);
        seq = [start * start, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
        nextVal = (start + 4) ** 2;
      }

      const options = this.generateDistractors(nextVal);
      return {
        category: '🔢 PATTERN RECOGNITION',
        question: `${seq.join(', ')}, [ ? ]`,
        correct: nextVal,
        options
      };
    } else if (type === 'operator') {
      const ops = [
        { sym: '+', fn: (x, y) => x + y },
        { sym: '−', fn: (x, y) => x - y },
        { sym: '×', fn: (x, y) => x * y }
      ];
      const selected = ops[Math.floor(Math.random() * ops.length)];
      const x = Math.floor(Math.random() * 9 + 2);
      const y = Math.floor(Math.random() * 8 + 2);
      const res = selected.fn(x, y);

      return {
        category: '🧩 MISSING OPERATOR',
        question: `${x}  [ ? ]  ${y}  =  ${res}`,
        correct: selected.sym,
        options: ['+', '−', '×', '÷']
      };
    } else {
      // Comparison
      const left = Math.floor(Math.random() * 40 + 10);
      const right = Math.floor(Math.random() * 40 + 10);
      let sym = '=';
      if (left > right) sym = '>';
      else if (left < right) sym = '<';

      return {
        category: '⚖️ VALUE COMPARISON',
        question: `${left}   [ ? ]   ${right}`,
        correct: sym,
        options: ['<', '>', '=', '≠']
      };
    }
  }

  generateDistractors(correct) {
    const set = new Set([correct]);
    while (set.size < 4) {
      const delta = Math.floor(Math.random() * 9 + 1) * (Math.random() < 0.5 ? -1 : 1);
      const fake = correct + delta;
      if (fake > 0) set.add(fake);
    }
    return Array.from(set).sort(() => 0.5 - Math.random());
  }

  nextPuzzle() {
    this.currentPuzzle = this.generatePuzzle();
    this.categoryElem.textContent = this.currentPuzzle.category;
    this.questionElem.textContent = this.currentPuzzle.question;

    this.optionsElem.innerHTML = '';
    this.currentPuzzle.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'puzzle-opt-btn';
      btn.innerHTML = `<span class="opt-key">${idx + 1}</span> ${opt}`;
      btn.addEventListener('pointerdown', () => this.handleAnswer(opt));
      this.optionsElem.appendChild(btn);
    });
  }

  handleAnswer(answer) {
    if (this.state !== 'playing') return;

    const isCorrect = String(answer) === String(this.currentPuzzle.correct);

    if (isCorrect) {
      this.combo++;
      const points = 1 + Math.floor(this.combo / 3);
      this.score += points;
      this.timeLeft = Math.min(45.0, this.timeLeft + 1.2);

      this.scoreElem.textContent = this.score;
      this.comboElem.textContent = `${this.combo}x`;
      if (this.combo >= 3) this.comboElem.classList.add('fire');

      sound.playScore(this.combo);
      this.cardElem.classList.add('flash-green');
      setTimeout(() => this.cardElem?.classList.remove('flash-green'), 120);

      this.nextPuzzle();
    } else {
      this.combo = 0;
      this.comboElem.textContent = '0x';
      this.comboElem.classList.remove('fire');
      this.timeLeft = Math.max(0, this.timeLeft - 3.0); // 3s penalty

      sound.playError();
      this.cardElem.classList.add('flash-red');
      this.container.classList.add('shake');
      setTimeout(() => {
        this.cardElem?.classList.remove('flash-red');
        this.container?.classList.remove('shake');
      }, 250);

      this.nextPuzzle();
    }
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    this.timerElem.textContent = '0.0s';

    const coinsEarned = Math.floor(this.score * 3);
    storage.addCoins(coinsEarned);

    if (this.score >= 12) {
      storage.unlockAchievement('galaxy_brain');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('brain_puzzle', this.score);
    if (isNewBest) sound.playFanfare();
    else sound.playSuccess();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'brain_puzzle',
        gameTitle: 'Brain Puzzle Rush',
        score: this.score,
        scoreUnit: 'solved',
        subtitle: `Logical Prowess: Superb • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 500);
  }

  destroy() {
    clearInterval(this.timerInterval);
    this.state = 'ended';
    window.removeEventListener('keydown', this._handleKeyDown);
    this.container.innerHTML = '';
  }
}
