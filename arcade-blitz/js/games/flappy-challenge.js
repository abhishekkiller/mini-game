/**
 * Game 6: Flappy Challenge
 * Navigate obstacles with precision taps, collect coins, and beat records.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class FlappyChallengeGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.canvas = null;
    this.ctx = null;
    this.state = 'idle'; // 'idle', 'playing', 'ended'
    this.score = 0;

    // Physics
    this.gravity = 0.38;
    this.jumpForce = -7.2;
    this.bird = {
      x: 70,
      y: 200,
      vy: 0,
      radius: 16,
      angle: 0
    };

    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 130;
    this.pipeSpeed = 2.8;
    this.pipeInterval = 110;
    this.frameCount = 0;

    this.particles = [];
    this.animId = null;

    this._handleJump = this._handleJump.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view flappy-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">SCORE</span>
            <span class="hud-value highlight" id="flappy-score">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="flappy-best">${storage.getHighScore('flappy_challenge')}</span>
          </div>
        </div>

        <div class="flappy-canvas-wrapper" id="flappy-wrapper">
          <canvas id="flappy-canvas"></canvas>
          <div class="flappy-start-cta" id="flappy-cta">
            <div class="tap-icon">👆</div>
            <div>TAP OR SPACE TO FLY</div>
          </div>
        </div>
      </div>
    `;

    this.scoreElem = this.container.querySelector('#flappy-score');
    this.ctaElem = this.container.querySelector('#flappy-cta');
    this.canvas = this.container.querySelector('#flappy-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    this.initGame();

    this.container.addEventListener('pointerdown', this._handleJump);
    window.addEventListener('keydown', this._handleKeyDown);
  }

  resize() {
    const wrapper = this.container.querySelector('#flappy-wrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    this.width = rect.width > 0 ? rect.width : (this.container.clientWidth || 360);
    this.height = rect.height > 0 ? rect.height : 380;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.bird.x = Math.min(80, this.width * 0.25);
    this.bird.y = this.height / 2;
  }

  initGame() {
    this.bird.y = this.height / 2;
    this.bird.vy = 0;
    this.bird.angle = 0;
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.frameCount = 0;
    this.state = 'idle';

    this.draw();
  }

  _handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      this.flap();
    }
  }

  _handleJump(e) {
    if (e.target.closest('.hud-item')) return;
    this.flap();
  }

  flap() {
    if (this.state === 'ended') return;

    if (this.state === 'idle') {
      this.state = 'playing';
      if (this.ctaElem) this.ctaElem.style.display = 'none';
      this.loop();
    }

    this.bird.vy = this.jumpForce;
    sound.playWhoosh();
    this.createFeatherParticles();
  }

  createFeatherParticles() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.bird.x - 10,
        y: this.bird.y + (Math.random() - 0.5) * 10,
        vx: -(Math.random() * 2 + 1),
        vy: Math.random() * 2 - 1,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: 0.04
      });
    }
  }

  spawnPipe() {
    const minH = 60;
    const maxH = this.height - this.pipeGap - minH - 40;
    const topH = Math.floor(Math.random() * (maxH - minH) + minH);

    this.pipes.push({
      x: this.width + 10,
      topH: topH,
      bottomY: topH + this.pipeGap,
      passed: false
    });
  }

  loop() {
    if (this.state !== 'playing') return;

    this.update();
    this.draw();

    this.animId = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.frameCount++;

    // Bird physics
    this.bird.vy += this.gravity;
    this.bird.y += this.bird.vy;

    // Angle rotation based on velocity
    this.bird.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.bird.vy * 0.08)));

    // Floor & ceiling collisions
    if (this.bird.y + this.bird.radius >= this.height - 30) {
      this.gameOver();
      return;
    }
    if (this.bird.y - this.bird.radius <= 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = 0;
    }

    // Spawn pipes
    if (this.frameCount % this.pipeInterval === 0) {
      this.spawnPipe();
    }

    // Update pipes
    const speed = this.pipeSpeed + Math.min(2, this.score * 0.05);

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= speed;

      // Score check
      if (!p.passed && p.x + this.pipeWidth < this.bird.x) {
        p.passed = true;
        this.score++;
        this.scoreElem.textContent = this.score;
        sound.playScore(this.score);
      }

      // Collision detection (AABB vs Circle)
      const birdL = this.bird.x - this.bird.radius + 3;
      const birdR = this.bird.x + this.bird.radius - 3;
      const birdT = this.bird.y - this.bird.radius + 3;
      const birdB = this.bird.y + this.bird.radius - 3;

      if (birdR > p.x && birdL < p.x + this.pipeWidth) {
        if (birdT < p.topH || birdB > p.bottomY) {
          this.gameOver();
          return;
        }
      }

      // Remove off-screen pipes
      if (p.x + this.pipeWidth < -20) {
        this.pipes.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Sky Background gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    if (Math.floor(this.score / 10) % 2 === 0) {
      // Day/Neon
      skyGrad.addColorStop(0, '#0d1b2a');
      skyGrad.addColorStop(1, '#1b263b');
    } else {
      // Midnight Sunset
      skyGrad.addColorStop(0, '#2b0938');
      skyGrad.addColorStop(1, '#130924');
    }
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Distant Cyber City Skyline
    this.ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
    for (let i = 0; i < this.width; i += 40) {
      const bHeight = 80 + Math.sin(i * 0.05) * 40;
      this.ctx.fillRect(i, this.height - bHeight - 30, 36, bHeight);
    }

    // Render Pipes
    for (const p of this.pipes) {
      // Top pipe
      const pipeGrad = this.ctx.createLinearGradient(p.x, 0, p.x + this.pipeWidth, 0);
      pipeGrad.addColorStop(0, '#00e676');
      pipeGrad.addColorStop(0.5, '#69f0ae');
      pipeGrad.addColorStop(1, '#00b248');

      this.ctx.fillStyle = pipeGrad;
      this.ctx.fillRect(p.x, 0, this.pipeWidth, p.topH);
      // Top pipe cap
      this.ctx.fillStyle = '#00c853';
      this.ctx.fillRect(p.x - 4, p.topH - 18, this.pipeWidth + 8, 18);

      // Bottom pipe
      this.ctx.fillStyle = pipeGrad;
      this.ctx.fillRect(p.x, p.bottomY, this.pipeWidth, this.height - p.bottomY - 30);
      // Bottom pipe cap
      this.ctx.fillStyle = '#00c853';
      this.ctx.fillRect(p.x - 4, p.bottomY, this.pipeWidth + 8, 18);
    }

    // Render Ground
    this.ctx.fillStyle = '#10141f';
    this.ctx.fillRect(0, this.height - 30, this.width, 30);
    this.ctx.fillStyle = '#00f2fe';
    this.ctx.fillRect(0, this.height - 30, this.width, 3);

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.fillStyle = `rgba(255, 235, 59, ${pt.life})`;
      this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }

    // Render Bird
    this.ctx.save();
    this.ctx.translate(this.bird.x, this.bird.y);
    this.ctx.rotate(this.bird.angle);

    // Bird body (Flappy neon sphere)
    const birdGrad = this.ctx.createRadialGradient(-4, -4, 2, 0, 0, 16);
    birdGrad.addColorStop(0, '#ffea00');
    birdGrad.addColorStop(0.8, '#ff9100');
    birdGrad.addColorStop(1, '#ff3d00');

    this.ctx.fillStyle = birdGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(6, -5, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Wing
    this.ctx.fillStyle = '#fff59d';
    this.ctx.beginPath();
    this.ctx.ellipse(-6, 2, 7, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = '#ff1744';
    this.ctx.beginPath();
    this.ctx.moveTo(12, 0);
    this.ctx.lineTo(20, 4);
    this.ctx.lineTo(12, 8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  gameOver() {
    this.state = 'ended';
    cancelAnimationFrame(this.animId);
    sound.playError();

    const coinsEarned = this.score * 5;
    storage.addCoins(coinsEarned);

    if (this.score >= 15) {
      storage.unlockAchievement('sky_ace');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('flappy_challenge', this.score);
    if (isNewBest) sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'flappy_challenge',
        gameTitle: 'Flappy Challenge',
        score: this.score,
        scoreUnit: 'pipes',
        subtitle: `Sky Dominance: ${this.score} Obstacles Passed • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    this.state = 'ended';
    cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this._handleKeyDown);
    this.container.removeEventListener('pointerdown', this._handleJump);
    this.container.innerHTML = '';
  }
}
