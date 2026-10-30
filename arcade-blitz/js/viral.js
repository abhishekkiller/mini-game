/**
 * Viral Engine: Social Sharing, Result Cards, Challenge-a-Friend, and Roasts
 */

import { storage } from './storage.js';

const ROASTS = {
  low: [
    "My microwave has faster reflexes than you! 🤖",
    "Are your fingers asleep or just taking a vacation? 😴",
    "A snail on ice skates could beat that score. 🐌",
    "Did you play this with your elbows? Be honest. 肘",
    "Gravity called, it wants its speed back. 📉",
    "Even my grandma clears this with her eyes closed! 👵"
  ],
  medium: [
    "Not bad for a human, but my cat did better! 🐱",
    "Solid effort! Almost broke into the elite club. 🥈",
    "Respectable! But can you do it twice in a row? 🤔",
    "Decent moves! A little more caffeine and you'll ascend. ☕",
    "Warmup is over. Now show your true power! 💥"
  ],
  high: [
    "CERTIFIED GAMER GOD! You are built different! 👑🔥",
    "NASA called. They want their reaction time back! 🚀",
    "Illegal finger agility detected. Are you a cyborg? 🦾",
    "Top 1% viral dominance achieved! Bow down, mortals! 🏆",
    "Screenshot this before anyone accuses you of hacking! 📸"
  ]
};

export class ViralEngine {
  constructor() {
    this.currentChallenge = this.parseChallengeFromURL();
  }

  getRoast(score, gameId) {
    let tier = 'medium';
    if (gameId === 'reflex_challenge') {
      if (score > 340) tier = 'low';
      else if (score < 220) tier = 'high';
    } else if (gameId === 'tap_speed') {
      if (score < 50) tier = 'low';
      else if (score >= 85) tier = 'high';
    } else if (gameId === 'stack_tower') {
      if (score < 8) tier = 'low';
      else if (score >= 20) tier = 'high';
    } else if (gameId === 'color_reaction') {
      if (score < 12) tier = 'low';
      else if (score >= 22) tier = 'high';
    } else {
      if (score <= 5) tier = 'low';
      else if (score >= 15) tier = 'high';
    }

    const list = ROASTS[tier];
    return list[Math.floor(Math.random() * list.length)];
  }

  // --- Challenge a Friend URL Handling ---

  createChallengeLink(gameId, gameTitle, score) {
    storage.unlockAchievement('viral_sharer');
    const playerName = encodeURIComponent(storage.getPlayerName());
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?challenge=${encodeURIComponent(gameId)}&by=${playerName}&target=${encodeURIComponent(score)}`;
  }

  parseChallengeFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const challengeGame = params.get('challenge');
      const challenger = params.get('by');
      const target = params.get('target');

      if (challengeGame && target) {
        return {
          gameId: challengeGame,
          challengerName: challenger ? decodeURIComponent(challenger) : 'A Friend',
          targetScore: Number(target) || 0
        };
      }
    } catch (e) {
      console.warn('URL parse failed', e);
    }
    return null;
  }

  getIncomingChallenge() {
    return this.currentChallenge;
  }

  // --- Dynamic Shareable Canvas Card Generator ---

  async generateScoreCardCanvas({ gameId, gameTitle, score, scoreUnit = 'pts', isNewRecord = false, isNewBest = false }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const hasNewBest = isNewRecord || isNewBest;
    const playerName = storage.getPlayerName();
    const roast = this.getRoast(score, gameId);
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    // Background Gradient (Cyber Arcade)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#090a15');
    bgGrad.addColorStop(0.5, '#13112c');
    bgGrad.addColorStop(1, '#1f0d3d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle neon grid background
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Outer Glowing Border
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 12;
    ctx.strokeRect(36, 36, 1008, 1008);

    // Inner Card Container
    ctx.fillStyle = 'rgba(25, 22, 56, 0.75)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(80, 80, 920, 920, 36);
    } else {
      ctx.rect(80, 80, 920, 920);
    }
    ctx.fill();

    // Brand Header
    ctx.font = '900 42px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#00f2fe';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ARCADE BLITZ ⚡', 540, 170);

    ctx.font = '600 24px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('VIRAL MINI-GAMES ARENA', 540, 210);

    // Game Title Badge
    ctx.fillStyle = 'rgba(255, 0, 128, 0.2)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(240, 250, 600, 64, 32);
    } else {
      ctx.rect(240, 250, 600, 64);
    }
    ctx.fill();
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '800 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(gameTitle.toUpperCase(), 540, 294);

    // Big Score Display
    ctx.font = '900 150px "Segoe UI", system-ui, sans-serif';
    const scoreGrad = ctx.createLinearGradient(300, 400, 780, 520);
    scoreGrad.addColorStop(0, '#00f2fe');
    scoreGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = scoreGrad;
    ctx.fillText(`${score}`, 540, 480);

    ctx.font = '700 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(scoreUnit.toUpperCase(), 540, 545);

    // New Record Badge
    if (hasNewBest) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '800 26px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('🔥 NEW PERSONAL BEST! 🔥', 540, 600);
    }

    // Roast Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(140, 640, 800, 130, 20);
    } else {
      ctx.rect(140, 640, 800, 130);
    }
    ctx.fill();

    ctx.font = 'italic 600 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    // Word wrap roast if needed
    this._wrapText(ctx, `"${roast}"`, 540, 700, 740, 36);

    // Footer Player Info & Call to Action
    ctx.font = '700 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`Player: ${playerName}`, 540, 830);

    ctx.font = '600 24px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Can you beat this? Play free on Arcade Blitz! • ${dateStr}`, 540, 880);

    ctx.fillStyle = '#ff007f';
    ctx.font = '800 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('👉 TAP TO ACCEPT THE CHALLENGE 👈', 540, 935);

    return canvas;
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k].trim(), x, startY + (k * lineHeight));
    }
  }

  // --- Share or Copy Trigger ---

  async shareScore({ gameId, gameTitle, score, scoreUnit = 'pts' }) {
    storage.unlockAchievement('viral_sharer');
    const challengeLink = this.createChallengeLink(gameId, gameTitle, score);
    const shareText = `🔥 I just scored ${score} ${scoreUnit} in ${gameTitle} on Arcade Blitz! Think you can beat me? Challenge me here:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Arcade Blitz Challenge: ${gameTitle}`,
          text: shareText,
          url: challengeLink
        });
        return { success: true, method: 'native' };
      } catch (err) {
        if (err.name !== 'AbortError') {
          return this.copyToClipboard(`${shareText} ${challengeLink}`);
        }
        return { success: false, method: 'cancelled' };
      }
    } else {
      return this.copyToClipboard(`${shareText} ${challengeLink}`);
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true, method: 'clipboard' };
    }
  }
}

export const viral = new ViralEngine();
