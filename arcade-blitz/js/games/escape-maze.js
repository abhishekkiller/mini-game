/**
 * Game 7: Escape the Maze
 * Procedural labyrinth speedrun with gems, time extensions, and responsive controls.
 */

import { sound } from '../audio.js';
import { storage } from '../storage.js';

export class EscapeMazeGame {
  constructor(container, onGameOver) {
    this.container = container;
    this.onGameOver = onGameOver;
    this.canvas = null;
    this.ctx = null;
    this.state = 'idle';

    this.stage = 1;
    this.score = 0;
    this.timeLeft = 30.0;
    this.timerInterval = null;

    this.gridCols = 7;
    this.gridRows = 7;
    this.cellSize = 36;
    this.maze = [];
    this.player = { col: 0, row: 0, x: 0, y: 0 };
    this.exit = { col: 6, row: 6 };
    this.gems = [];
    this.trail = [];

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-view maze-view">
        <div class="game-hud">
          <div class="hud-item">
            <span class="hud-label">TIME</span>
            <span class="hud-value" id="maze-timer">30.0s</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">STAGE</span>
            <span class="hud-value highlight" id="maze-stage">1</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">BEST</span>
            <span class="hud-value" id="maze-best">${storage.getHighScore('escape_maze')}</span>
          </div>
        </div>

        <div class="maze-canvas-container" id="maze-wrapper">
          <canvas id="maze-canvas"></canvas>
        </div>

        <div class="maze-dpad">
          <button class="dpad-btn up" data-dir="up">▲</button>
          <div class="dpad-mid">
            <button class="dpad-btn left" data-dir="left">◀</button>
            <div class="dpad-center">●</div>
            <button class="dpad-btn right" data-dir="right">▶</button>
          </div>
          <button class="dpad-btn down" data-dir="down">▼</button>
        </div>

        <div class="game-hint">Tip: Swipe, use D-pad, or Arrow / WASD keys!</div>
      </div>
    `;

    this.timerElem = this.container.querySelector('#maze-timer');
    this.stageElem = this.container.querySelector('#maze-stage');
    this.canvas = this.container.querySelector('#maze-canvas');
    this.ctx = this.canvas.getContext('2d');

    // D-Pad listeners
    const dpadButtons = this.container.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.move(btn.dataset.dir);
      });
    });

    window.addEventListener('keydown', this._handleKeyDown);
    this.canvas.addEventListener('touchstart', this._handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this._handleTouchEnd, { passive: true });

    this.startGame();
  }

  startGame() {
    this.state = 'playing';
    this.stage = 1;
    this.score = 0;
    this.timeLeft = 30.0;

    this.generateMazeForStage();

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

  generateMazeForStage() {
    // Stage 1: 7x7, Stage 2: 9x9, Stage 3: 11x11, Stage 4+: 13x13
    const size = Math.min(13, 5 + this.stage * 2);
    this.gridCols = size;
    this.gridRows = size;

    // Canvas dimensions
    const wrapper = this.container.querySelector('#maze-wrapper');
    const clientW = wrapper && wrapper.clientWidth > 0 ? wrapper.clientWidth : 360;
    const clientH = wrapper && wrapper.clientHeight > 0 ? wrapper.clientHeight : 360;
    const maxSize = Math.min(clientW - 20, clientH - 20, 360);
    this.cellSize = Math.floor(Math.max(260, maxSize) / size);
    this.canvas.width = this.cellSize * size;
    this.canvas.height = this.cellSize * size;

    // Initialize cells: each has top, right, bottom, left walls
    this.maze = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push({
          c, r,
          visited: false,
          walls: { top: true, right: true, bottom: true, left: true }
        });
      }
      this.maze.push(row);
    }

    // Recursive Backtracker Maze Generation
    const stack = [];
    let current = this.maze[0][0];
    current.visited = true;

    while (true) {
      const neighbors = this.getUnvisitedNeighbors(current.c, current.r);
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWalls(current, next);
        stack.push(current);
        current = next;
        current.visited = true;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }

    this.player = { col: 0, row: 0 };
    this.exit = { col: size - 1, row: size - 1 };
    this.trail = [];

    // Spawn 2-4 bonus gems
    this.gems = [];
    for (let i = 0; i < Math.min(4, Math.floor(size / 3)); i++) {
      const gc = Math.floor(Math.random() * (size - 2) + 1);
      const gr = Math.floor(Math.random() * (size - 2) + 1);
      if (!this.gems.some(g => g.col === gc && g.row === gr)) {
        this.gems.push({ col: gc, row: gr, collected: false });
      }
    }

    this.render();
  }

  getUnvisitedNeighbors(c, r) {
    const list = [];
    const dirs = [
      { c: c, r: r - 1 },
      { c: c + 1, r: r },
      { c: c, r: r + 1 },
      { c: c - 1, r: r }
    ];

    dirs.forEach(d => {
      if (d.c >= 0 && d.c < this.gridCols && d.r >= 0 && d.r < this.gridRows) {
        if (!this.maze[d.r][d.c].visited) {
          list.push(this.maze[d.r][d.c]);
        }
      }
    });
    return list;
  }

  removeWalls(a, b) {
    const x = a.c - b.c;
    if (x === 1) { a.walls.left = false; b.walls.right = false; }
    else if (x === -1) { a.walls.right = false; b.walls.left = false; }

    const y = a.r - b.r;
    if (y === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (y === -1) { a.walls.bottom = false; b.walls.top = false; }
  }

  _handleKeyDown(e) {
    if (this.state !== 'playing') return;

    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); this.move('up'); }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); this.move('down'); }
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.move('left'); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.move('right'); }
  }

  _handleTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  _handleTouchEnd(e) {
    if (e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 20) {
        if (absX > absY) {
          this.move(dx > 0 ? 'right' : 'left');
        } else {
          this.move(dy > 0 ? 'down' : 'up');
        }
      }
    }
  }

  move(dir) {
    if (this.state !== 'playing') return;

    const currentCell = this.maze[this.player.row][this.player.col];
    let moved = false;

    if (dir === 'up' && !currentCell.walls.top) {
      this.player.row--;
      moved = true;
    } else if (dir === 'down' && !currentCell.walls.bottom) {
      this.player.row++;
      moved = true;
    } else if (dir === 'left' && !currentCell.walls.left) {
      this.player.col--;
      moved = true;
    } else if (dir === 'right' && !currentCell.walls.right) {
      this.player.col++;
      moved = true;
    }

    if (moved) {
      sound.playTap(1.3);
      this.trail.push({ col: this.player.col, row: this.player.row });

      // Check Gems
      this.gems.forEach(g => {
        if (!g.collected && g.col === this.player.col && g.row === this.player.row) {
          g.collected = true;
          this.timeLeft = Math.min(60.0, this.timeLeft + 5.0);
          storage.addCoins(10);
          sound.playScore(3);
        }
      });

      // Check Exit
      if (this.player.col === this.exit.col && this.player.row === this.exit.row) {
        this.stageCompleted();
        return;
      }

      this.render();
    }
  }

  stageCompleted() {
    this.score++;
    this.stage++;
    this.stageElem.textContent = this.stage;
    this.timeLeft += 8.0; // Bonus time for clearing stage
    sound.playSuccess();

    this.generateMazeForStage();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dark grid background
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Trail
    ctx.fillStyle = 'rgba(0, 242, 254, 0.18)';
    for (const t of this.trail) {
      ctx.fillRect(t.col * this.cellSize + 4, t.row * this.cellSize + 4, this.cellSize - 8, this.cellSize - 8);
    }

    // Render Walls
    ctx.strokeStyle = '#2a3b68';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.maze[r][c];
        const x = c * this.cellSize;
        const y = r * this.cellSize;

        ctx.beginPath();
        if (cell.walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + this.cellSize, y); }
        if (cell.walls.right) { ctx.moveTo(x + this.cellSize, y); ctx.lineTo(x + this.cellSize, y + this.cellSize); }
        if (cell.walls.bottom) { ctx.moveTo(x, y + this.cellSize); ctx.lineTo(x + this.cellSize, y + this.cellSize); }
        if (cell.walls.left) { ctx.moveTo(x, y); ctx.lineTo(x, y + this.cellSize); }
        ctx.stroke();
      }
    }

    // Render Gems
    for (const g of this.gems) {
      if (!g.collected) {
        const gx = g.col * this.cellSize + this.cellSize / 2;
        const gy = g.row * this.cellSize + this.cellSize / 2;
        ctx.font = `${Math.floor(this.cellSize * 0.65)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💎', gx, gy);
      }
    }

    // Render Exit Portal
    const ex = this.exit.col * this.cellSize + this.cellSize / 2;
    const ey = this.exit.row * this.cellSize + this.cellSize / 2;
    const portalGrad = ctx.createRadialGradient(ex, ey, 2, ex, ey, this.cellSize / 2);
    portalGrad.addColorStop(0, '#00ff88');
    portalGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, this.cellSize * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${Math.floor(this.cellSize * 0.65)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌀', ex, ey);

    // Render Player
    const px = this.player.col * this.cellSize + this.cellSize / 2;
    const py = this.player.row * this.cellSize + this.cellSize / 2;
    const pGrad = ctx.createRadialGradient(px - 2, py - 2, 2, px, py, this.cellSize * 0.35);
    pGrad.addColorStop(0, '#00f2fe');
    pGrad.addColorStop(1, '#ff007f');

    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, this.cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  endGame() {
    this.state = 'ended';
    clearInterval(this.timerInterval);
    sound.playError();

    const coinsEarned = this.score * 25;
    storage.addCoins(coinsEarned);

    if (this.score >= 3) {
      storage.unlockAchievement('maze_runner');
    }
    storage.unlockAchievement('first_play');

    const isNewBest = storage.saveHighScore('escape_maze', this.score);
    if (isNewBest) sound.playFanfare();

    setTimeout(() => {
      this.onGameOver({
        gameId: 'escape_maze',
        gameTitle: 'Escape the Maze',
        score: this.score,
        scoreUnit: 'stages',
        subtitle: `Labyrinth Runner: Cleared ${this.score} Stages • Earned +${coinsEarned} Coins 🪙`,
        isNewBest
      });
    }, 600);
  }

  destroy() {
    clearInterval(this.timerInterval);
    this.state = 'ended';
    window.removeEventListener('keydown', this._handleKeyDown);
    this.canvas.removeEventListener('touchstart', this._handleTouchStart);
    this.canvas.removeEventListener('touchend', this._handleTouchEnd);
    this.container.innerHTML = '';
  }
}
