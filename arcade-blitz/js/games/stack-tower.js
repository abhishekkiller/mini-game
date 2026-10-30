/**
 * Game 4: Stack Tower
 * Stack moving blocks with precision timing. Slices off overhang with physics.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class StackTowerGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.canvas = null;
    this.ctx = null;
    this.state = 'idle'; // 'idle', 'playing', 'ended'
    this.score = 0;
    this.combo = 0;

    this.blocks = [];
    this.debris = [];
    this.currentBlock = null;
    this.cameraY = 0;
    this.targetCameraY = 0;

    this.baseWidth = 200;
    this.blockHeight = 24;
    this.blockSpeed = 4;
    this.direction = 1;

    this.animId = null;
    this._handleInput = this._handleInput.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view stack-tower-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">FLOOR</span>
            <span class="hud-value highlight" id="tower-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">COMBO</span>
            <span class="hud-value" id="tower-combo">0x</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="tower-best">${storage.getHighScore('stack_tower')}</span>
          </div>
        </div>

        <div class="tower-canvas-container" id="tower-wrapper">
          <canvas id="tower-canvas"></canvas>
          <div class="tower-tap-hint" id="tower-hint">TAP OR PRESS SPACE TO DROP BLOCK</div>
        </div>
      </div>
    `;

    this.scoreElem = this.container.querySelector('#tower-score');
    this.comboElem = this.container.querySelector('#tower-combo');
    this.hintElem = this.container.querySelector('#tower-hint');
    this.canvas = this.container.querySelector('#tower-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    this.initGame();

    this.container.addEventListener('pointerdown', this._handleInput);
    window.addEventListener('keydown', this._handleKeyDown);
  }

  resize() {
    const wrapper = this.container.querySelector('#tower-wrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    this.width = rect.width > 0 ? rect.width : (this.container.clientWidth || 360);
    this.height = rect.height > 0 ? rect.height : 380;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initGame() {
    this.blocks = [];
    this.debris = [];
    this.score = 0;
    this.combo = 0;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.state = 'playing';

    // Base block
    const baseBlock = {
      x: (this.width - this.baseWidth) / 2,
      y: this.height - 80,
      width: this.baseWidth,
      height: this.blockHeight,
      hue: 200
    };
    this.blocks.push(baseBlock);

    this.spawnNextBlock();
    this.loop();
  }

  spawnNextBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const hue = (200 + this.score * 14) % 360;

    this.currentBlock = {
      x: 0,
      y: prev.y - this.blockHeight,
      width: prev.width,
      height: this.blockHeight,
      hue: hue,
      speed: (this.blockSpeed + Math.min(6, this.score * 0.15)) * (Math.random() > 0.5 ? 1 : -1)
    };

    // Update target camera to keep top block centered vertically
    if (this.currentBlock.y - this.cameraY < this.height * 0.5) {
      this.targetCameraY = (this.height * 0.5) - this.currentBlock.y;
    }
  }

  _handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      this.dropBlock();
    }
  }

  _handleInput(e) {
    if (e.target.closest('.hud-item')) return;
    this.dropBlock();
  }

  dropBlock() {
    if (this.state !== 'playing' || !this.currentBlock) return;
    if (this.hintElem) this.hintElem.style.display = 'none';

    const prev = this.blocks[this.blocks.length - 1];
    const diff = this.currentBlock.x - prev.x;

    // Perfect drop threshold
    if (Math.abs(diff) < 4) {
      // Snap to perfect
      this.currentBlock.x = prev.x;
      this.combo++;
      sound.playStackDrop(this.combo);
      this.createSparkEffect(this.currentBlock.x + this.currentBlock.width / 2, this.currentBlock.y);
      this.comboElem.textContent = `${this.combo}x`;
      this.comboElem.classList.add('fire');
    } else {
      this.combo = 0;
      this.comboElem.textContent = '0x';
      this.comboElem.classList.remove('fire');

      if (diff > 0) {
        // Overhang to the right
        const newWidth = this.currentBlock.width - diff;
        if (newWidth <= 0) {
          this.gameOver();
          return;
        }

        // Falling slice
        this.debris.push({
          x: this.currentBlock.x + newWidth,
          y: this.currentBlock.y,
          width: diff,
          height: this.blockHeight,
          hue: this.currentBlock.hue,
          vy: 0,
          rot: 0,
          rotSpeed: 0.1
        });

        this.currentBlock.width = newWidth;
        sound.playTap(1.2);
      } else {
        // Overhang to the left
        const overhang = -diff;
        const newWidth = this.currentBlock.width - overhang;
        if (newWidth <= 0) {
          this.gameOver();
          return;
        }

        // Falling slice
        this.debris.push({
          x: this.currentBlock.x,
          y: this.currentBlock.y,
          width: overhang,
          height: this.blockHeight,
          hue: this.currentBlock.hue,
          vy: 0,
          rot: 0,
          rotSpeed: -0.1
        });

        this.currentBlock.x = prev.x;
        this.currentBlock.width = newWidth;
        sound.playTap(1.2);
      }
    }

    this.blocks.push(this.currentBlock);
    this.score++;
    this.scoreElem.textContent = this.score;

    this.spawnNextBlock();
  }

  createSparkEffect(x, y) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.debris.push({
        x: x,
        y: y,
        width: 4,
        height: 4,
        hue: 50, // Gold
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        isSpark: true
      });
    }
  }

  loop() {
    if (this.state === 'ended') return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Camera smooth follow
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

    // Move current block
    if (this.currentBlock && this.state === 'playing') {
      this.currentBlock.x += this.currentBlock.speed;

      if (this.currentBlock.x + this.currentBlock.width > this.width + 30) {
        this.currentBlock.speed = -Math.abs(this.currentBlock.speed);
      } else if (this.currentBlock.x < -30) {
        this.currentBlock.speed = Math.abs(this.currentBlock.speed);
      }
    }

    // Update debris physics
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      if (d.isSpark) {
        d.x += d.vx;
        d.y += d.vy;
        d.life -= 0.05;
        if (d.life <= 0) this.debris.splice(i, 1);
      } else {
        d.vy += 0.5; // gravity
        d.y += d.vy;
        d.rot += d.rotSpeed;
        if (d.y - this.cameraY > this.height + 100) {
          this.debris.splice(i, 1);
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    // Render stacked blocks
    for (const b of this.blocks) {
      this.ctx.fillStyle = `hsl(${b.hue}, 85%, 55%)`;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);

      // 3D block edge highlight
      this.ctx.fillStyle = `rgba(255, 255, 255, 0.25)`;
      this.ctx.fillRect(b.x, b.y, b.width, 3);
      this.ctx.fillStyle = `rgba(0, 0, 0, 0.25)`;
      this.ctx.fillRect(b.x, b.y + b.height - 3, b.width, 3);
    }

    // Render moving current block
    if (this.currentBlock && this.state === 'playing') {
      const b = this.currentBlock;
      this.ctx.fillStyle = `hsl(${b.hue}, 90%, 60%)`;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);

      this.ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
      this.ctx.fillRect(b.x, b.y, b.width, 3);
    }

    // Render falling debris
    for (const d of this.debris) {
      if (d.isSpark) {
        this.ctx.fillStyle = `rgba(255, 215, 0, ${d.life})`;
        this.ctx.fillRect(d.x, d.y, d.width, d.height);
      } else {
        this.ctx.save();
        this.ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
        this.ctx.rotate(d.rot);
        this.ctx.fillStyle = `hsl(${d.hue}, 70%, 45%)`;
        this.ctx.fillRect(-d.width / 2, -d.height / 2, d.width, d.height);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }

  gameOver() {
    this.state = 'ended';
    cancelAnimationFrame(this.animId);
    sound.playError();

    const coinsEarned = this.score * 3;
    storage.addCoins(coinsEarned);

    if (this.score >= 20) {
      storage.unlockAchievement('skyscraper');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('stack_tower', this.score);
    if (isNewBest) sound.playFanfare();
    else sound.playSuccess();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'stack_tower',
        gameTitle: 'Stack Tower',
        score: this.score,
        scoreUnit: 'floors',
        subtitle: `Tower Height: ${this.score} Stories • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    this.state = 'ended';
    cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this._handleKeyDown);
    this.container.removeEventListener('pointerdown', this._handleInput);
    this.container.innerHTML = '';
  }
}
