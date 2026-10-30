/**
 * Game 1: Tap Speed Challenge
 * Tap as fast as possible in 10 seconds.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class TapSpeedGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.state = 'idle'; // 'idle', 'playing', 'ended'
    this.score = 0;
    this.duration = 10.0;
    this.timeLeft = 10.0;
    this.startTime = 0;
    this.timerInterval = null;
    this.tapTimes = [];
    this._onTap = this._onTap.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view tap-speed-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="tap-timer">10.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">CPS</span>
            <span class="hud-value highlight" id="tap-cps">0.0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="tap-best">${storage.getHighScore('tap_speed')}</span>
          </div>
        </div>

        <div class="tap-rank-banner" id="tap-rank">
          <span class="rank-icon">🐢</span> <span class="rank-title">Warm up your fingers!</span>
        </div>

        <div class="tap-arena">
          <div class="tap-score-display" id="tap-score">0</div>
          <button class="tap-target-btn" id="tap-btn" aria-label="Tap Target">
            <div class="tap-btn-inner">
              <span class="tap-cta" id="tap-cta">TAP TO START</span>
              <span class="tap-sub">Use touch, click, or SPACE</span>
            </div>
            <div class="tap-pulse-ring"></div>
          </button>
        </div>

        <div class="game-hint">Tip: Use two alternating fingers for maximum CPS!</div>
      </div>
    `;

    this.btn = this.container.querySelector('#tap-btn');
    this.scoreElem = this.container.querySelector('#tap-score');
    this.timerElem = this.container.querySelector('#tap-timer');
    this.cpsElem = this.container.querySelector('#tap-cps');
    this.rankElem = this.container.querySelector('#tap-rank');
    this.ctaElem = this.container.querySelector('#tap-cta');

    this.btn.addEventListener('pointerdown', this._onTap);
    window.addEventListener('keydown', this._onKeyDown);
  }

  _onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyX') {
      e.preventDefault();
      this._onTap(e);
    }
  }

  _onTap(e) {
    if (this.state === 'ended') return;

    if (this.state === 'idle') {
      this.startGame();
    }

    this.score++;
    const now = performance.now();
    this.tapTimes.push(now);

    // Keep only taps from last 1 second for instant CPS
    while (this.tapTimes.length > 0 && this.tapTimes[0] < now - 1000) {
      this.tapTimes.shift();
    }

    const cps = (this.tapTimes.length).toFixed(1);
    this.cpsElem.textContent = cps;
    this.scoreElem.textContent = this.score;

    // Pitch escalation based on CPS
    const pitch = 0.9 + Math.min(1.2, this.tapTimes.length * 0.08);
    sound.playTap(pitch);

    // Visual button bounce & particles
    this.btn.classList.add('tapped');
    setTimeout(() => this.btn?.classList.remove('tapped'), 60);

    this.createTapParticle(e);
    this.updateRank();
  }

  createTapParticle(e) {
    const rect = this.btn.getBoundingClientRect();
    const x = e.clientX ? e.clientX : rect.left + rect.width / 2;
    const y = e.clientY ? e.clientY : rect.top + rect.height / 2;

    const particle = document.createElement('div');
    particle.className = 'tap-particle';
    particle.textContent = '+1';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 600);
  }

  startGame() {
    this.state = 'playing';
    this.startTime = performance.now();
    this.ctaElem.textContent = 'TAP!';
    this.btn.classList.add('active-game');

    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.timeLeft = Math.max(0, this.duration - elapsed);
      this.timerElem.textContent = `${this.timeLeft.toFixed(1)}s`;

      if (this.timeLeft <= 3.0 && this.timeLeft > 0) {
        sound.playTick(true);
        this.timerElem.classList.add('urgent');
      }

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 50);
  }

  updateRank() {
    let icon = '🐢';
    let title = 'Turtle Tapper';

    if (this.score >= 100) {
      icon = '👑';
      title = 'GODLIKE TITAN (100+)';
    } else if (this.score >= 85) {
      icon = '⚡';
      title = 'Lightning Strike (85+)';
    } else if (this.score >= 70) {
      icon = '🐆';
      title = 'Cheetah Rush (70+)';
    } else if (this.score >= 50) {
      icon = '🐇';
      title = 'Speedy Rabbit (50+)';
    } else if (this.score >= 30) {
      icon = '🦥';
      title = 'Warming Up (30+)';
    }

    this.rankElem.innerHTML = `<span class="rank-icon">${icon}</span> <span class="rank-title">${title}</span>`;
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    this.timerElem.textContent = '0.0s';
    this.ctaElem.textContent = 'FINISH!';
    this.btn.classList.remove('active-game');

    const avgCps = (this.score / 10).toFixed(1);
    const coinsEarned = Math.floor(this.score * 1.5);
    storage.addCoins(coinsEarned);

    if (this.score >= 85) {
      storage.unlockAchievement('tap_god');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('tap_speed', this.score);
    if (isNewBest) sound.playFanfare();
    else sound.playSuccess();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'tap_speed',
        gameTitle: 'Tap Speed Challenge',
        score: this.score,
        scoreUnit: 'taps',
        subtitle: `Average CPS: ${avgCps} taps/sec • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    clearInterval(this.timerInterval);
    window.removeEventListener('keydown', this._onKeyDown);
    if (this.btn) {
      this.btn.removeEventListener('pointerdown', this._onTap);
    }
    this.container.innerHTML = '';
  }
}
