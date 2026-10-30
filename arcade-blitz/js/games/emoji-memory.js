/**
 * Game 9: Emoji Memory Blitz
 * Flip and match identical emoji pairs with 3D card physics and combo multipliers.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

const EMOJI_SET = ['🦄', '🚀', '💎', '🍕', '👾', '🥑', '🔥', '👑'];

export class EmojiMemoryGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.state = 'idle'; // 'playing', 'locked', 'ended'
    this.combo = 0;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view emoji-memory-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="emoji-timer">0.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">MOVES</span>
            <span class="hud-value" id="emoji-moves">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">PAIRS</span>
            <span class="hud-value highlight" id="emoji-pairs">0/8</span>
          </div>
        </div>

        <div class="emoji-grid-container" id="emoji-grid">
          <!-- 16 3D Cards -->
        </div>

        <div class="game-hint">Tip: Memorize card positions when flipping!</div>
      </div>
    `;

    this.timerElem = this.container.querySelector('#emoji-timer');
    this.movesElem = this.container.querySelector('#emoji-moves');
    this.pairsElem = this.container.querySelector('#emoji-pairs');
    this.gridElem = this.container.querySelector('#emoji-grid');

    this.startGame();
  }

  startGame() {
    this.state = 'playing';
    this.matchedPairs = 0;
    this.moves = 0;
    this.timer = 0;
    this.combo = 0;
    this.flippedCards = [];

    // Duplicate emojis for pairs and shuffle
    const deck = [...EMOJI_SET, ...EMOJI_SET].sort(() => 0.5 - Math.random());

    this.gridElem.innerHTML = '';
    this.cards = deck.map((emoji, index) => {
      const card = document.createElement('div');
      card.className = 'emoji-card';
      card.dataset.index = index;
      card.dataset.emoji = emoji;

      card.innerHTML = `
        <div class="emoji-card-inner">
          <div class="emoji-card-front">?</div>
          <div class="emoji-card-back">${emoji}</div>
        </div>
      `;

      card.addEventListener('pointerdown', () => this.handleCardFlip(card));
      this.gridElem.appendChild(card);
      return card;
    });

    this.timerInterval = setInterval(() => {
      this.timer += 0.1;
      this.timerElem.textContent = `${this.timer.toFixed(1)}s`;
    }, 100);
  }

  handleCardFlip(card) {
    if (this.state !== 'playing') return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (this.flippedCards.length >= 2) return;

    // Flip card
    card.classList.add('flipped');
    this.flippedCards.push(card);
    sound.playTap(1.4);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesElem.textContent = this.moves;
      this.checkMatch();
    }
  }

  checkMatch() {
    this.state = 'locked';
    const [c1, c2] = this.flippedCards;
    const isMatch = c1.dataset.emoji === c2.dataset.emoji;

    if (isMatch) {
      this.combo++;
      sound.playScore(this.combo);

      setTimeout(() => {
        c1.classList.add('matched');
        c2.classList.add('matched');
        this.matchedPairs++;
        this.pairsElem.textContent = `${this.matchedPairs}/${EMOJI_SET.length}`;
        this.flippedCards = [];
        this.state = 'playing';

        if (this.matchedPairs === EMOJI_SET.length) {
          this.endGame();
        }
      }, 300);
    } else {
      this.combo = 0;
      sound.playError();

      setTimeout(() => {
        c1.classList.remove('flipped');
        c2.classList.remove('flipped');
        this.flippedCards = [];
        this.state = 'playing';
      }, 700);
    }
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    const finalSeconds = parseFloat(this.timer.toFixed(1));

    const coinsEarned = Math.max(50, Math.floor(300 - finalSeconds * 4));
    storage.addCoins(coinsEarned);

    if (finalSeconds < 30.0) {
      storage.unlockAchievement('emoji_master');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('emoji_memory', finalSeconds);
    sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'emoji_memory',
        gameTitle: 'Emoji Memory Blitz',
        score: finalSeconds,
        scoreUnit: 'sec',
        subtitle: `Cleared in ${finalSeconds}s with ${this.moves} moves! • Earned +${coinsEarned} Coins 🪙`,
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
