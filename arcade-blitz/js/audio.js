/**
 * Arcade Blitz Audio Synthesizer Engine
 * Pure Web Audio API - zero external assets, instant 0ms latency, runs anywhere.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('arcade_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('arcade_volume') || '0.7');
    this.hapticsEnabled = localStorage.getItem('arcade_haptics') !== 'false';
    this._initOnGesture = this._initOnGesture.bind(this);

    // Auto initialize on first interaction
    window.addEventListener('click', this._initOnGesture, { once: true });
    window.addEventListener('touchstart', this._initOnGesture, { once: true });
    window.addEventListener('keydown', this._initOnGesture, { once: true });
  }

  _initOnGesture() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('arcade_muted', this.muted);
    return this.muted;
  }

  toggleHaptics() {
    this.hapticsEnabled = !this.hapticsEnabled;
    localStorage.setItem('arcade_haptics', this.hapticsEnabled);
    if (this.hapticsEnabled) this.vibrate(40);
    return this.hapticsEnabled;
  }

  vibrate(pattern = 30) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored if user hasn't interacted or restricted
      }
    }
  }

  // --- Sound Synthesizers ---

  playTap(pitch = 1) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate(15);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 400 * pitch;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.25 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playScore(multiplier = 1) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([20, 20, 20]);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = Math.min(1800, 520 + (multiplier * 45));
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  playStackDrop(combo = 0) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate(25);
    // Ascending pentatonic notes
    const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = pentatonicScale[Math.min(combo, pentatonicScale.length - 1)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.35 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  playWhoosh() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate(20);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  playTick(high = false) {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(high ? 880 : 440, ctx.currentTime);

    gain.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  playError() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([60, 40, 80]);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  }

  playSuccess() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([40, 30, 40, 30, 80]);
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.23);
    });
  }

  playFanfare() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.vibrate([100, 50, 100, 50, 200]);
    const chords = [
      { f: 523.25, t: 0.00, d: 0.12 },
      { f: 523.25, t: 0.12, d: 0.12 },
      { f: 523.25, t: 0.24, d: 0.12 },
      { f: 659.25, t: 0.38, d: 0.25 },
      { f: 587.33, t: 0.65, d: 0.15 },
      { f: 659.25, t: 0.82, d: 0.15 },
      { f: 783.99, t: 0.98, d: 0.45 }
    ];

    chords.forEach(c => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, ctx.currentTime + c.t);

      gain.gain.setValueAtTime(0, ctx.currentTime + c.t);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, ctx.currentTime + c.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.t + c.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + c.t);
      osc.stop(ctx.currentTime + c.t + c.d + 0.02);
    });
  }
}

export const sound = new SoundEngine();
