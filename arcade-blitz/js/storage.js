/**
 * Storage & Progression Manager
 * Handles local scores, coins economy, streaks, achievements, and themes.
 */

const ACHIEVEMENTS_DEF = [
  { id: 'first_play', title: 'Arcade Novice', desc: 'Play your first mini-game', reward: 50, icon: '🎮' },
  { id: 'tap_god', title: 'Finger of Fire', desc: 'Reach 85+ taps in Tap Speed Challenge', reward: 200, icon: '🔥' },
  { id: 'color_ninja', title: 'Color Prodigy', desc: 'Score 20+ in Color Reaction Test', reward: 150, icon: '🎨' },
  { id: 'galaxy_brain', title: 'Supercomputer', desc: 'Score 12+ in Brain Puzzle Rush', reward: 200, icon: '🧠' },
  { id: 'skyscraper', title: 'Tower Titan', desc: 'Stack 20+ blocks in Stack Tower', reward: 200, icon: '🏢' },
  { id: 'number_span', title: 'Photo Memory', desc: 'Remember 8+ digits in Number Memory', reward: 250, icon: '🔢' },
  { id: 'sky_ace', title: 'Bird Whisperer', desc: 'Score 15+ in Flappy Challenge', reward: 200, icon: '🪶' },
  { id: 'maze_runner', title: 'Labyrinth King', desc: 'Escape Stage 3 in Escape the Maze', reward: 200, icon: '🌀' },
  { id: 'quiz_master', title: 'Troll Proof', desc: 'Conquer the Impossible Quiz', reward: 300, icon: '💡' },
  { id: 'emoji_master', title: 'Pair Seeker', desc: 'Clear Emoji Memory in under 30 seconds', reward: 200, icon: '🃏' },
  { id: 'lightning_reflex', title: 'Fighter Pilot', desc: 'Reaction time under 220ms in Reflex Challenge', reward: 250, icon: '⚡' },
  { id: 'streak_3', title: 'Dedicated Gamer', desc: 'Maintain a 3-day daily streak', reward: 300, icon: '📅' },
  { id: 'viral_sharer', title: 'Hype Beast', desc: 'Share a score card or challenge a friend', reward: 100, icon: '🚀' }
];

const THEMES_DEF = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', price: 0, preview: 'linear-gradient(135deg, #0d0e1b, #1b0f34)', accent: '#00f2fe' },
  { id: 'vaporwave', name: 'Sunset Vaporwave', price: 200, preview: 'linear-gradient(135deg, #2b1055, #7597de)', accent: '#ff71ce' },
  { id: 'retro8bit', name: '8-Bit Matrix', price: 350, preview: 'linear-gradient(135deg, #0a1f0a, #032b03)', accent: '#00ff66' },
  { id: 'goldvip', name: 'Royal Gold VIP', price: 600, preview: 'linear-gradient(135deg, #1c1917, #2d2417)', accent: '#ffd700' },
  { id: 'kawaii', name: 'Candy Pastel', price: 250, preview: 'linear-gradient(135deg, #2a1636, #482352)', accent: '#ff80bf' }
];

class StorageManager {
  constructor() {
    this.highScores = this.load('arcade_highscores', {
      tap_speed: 0,
      color_reaction: 0,
      brain_puzzle: 0,
      stack_tower: 0,
      number_memory: 0,
      flappy_challenge: 0,
      escape_maze: 0,
      impossible_quiz: 0,
      emoji_memory: 999, // Lower is better (seconds)
      reflex_challenge: 999 // Lower is better (ms)
    });

    this.coins = this.load('arcade_coins', 100); // 100 starting bonus coins!
    this.playerName = this.load('arcade_player_name', this.generateDefaultName());
    this.unlockedThemes = this.load('arcade_unlocked_themes', ['cyberpunk']);
    this.activeTheme = this.load('arcade_active_theme', 'cyberpunk');
    this.achievements = this.load('arcade_achievements', {});
    this.isVip = this.load('arcade_vip_status', false);
    this.streakData = this.load('arcade_streak_data', {
      streak: 1,
      lastDate: new Date().toISOString().slice(0, 10),
      claimedToday: false
    });

    this.checkDailyStreak();
  }

  generateDefaultName() {
    const prefixes = ['Speedy', 'Cyber', 'Neon', 'Pixel', 'Turbo', 'Shadow', 'Arcade', 'Hyper', 'Nova'];
    const animals = ['Ninja', 'Falcon', 'Cheetah', 'Viper', 'Tiger', 'Fox', 'Dragon', 'Phoenix'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const a = animals[Math.floor(Math.random() * animals.length)];
    const num = Math.floor(Math.random() * 900 + 100);
    return `${p}${a}_${num}`;
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // --- High Scores ---

  getHighScore(gameId) {
    return this.highScores[gameId] ?? 0;
  }

  saveHighScore(gameId, score) {
    let isNewBest = false;
    const current = this.highScores[gameId];

    // For reflex and emoji_memory, lower is better (unless 0/999)
    if (gameId === 'reflex_challenge' || gameId === 'emoji_memory') {
      if (current === 999 || score < current) {
        this.highScores[gameId] = score;
        isNewBest = true;
      }
    } else {
      if (score > (current || 0)) {
        this.highScores[gameId] = score;
        isNewBest = true;
      }
    }

    if (isNewBest) {
      this.save('arcade_highscores', this.highScores);
    }
    return isNewBest;
  }

  // --- Coins ---

  getCoins() {
    return this.coins;
  }

  addCoins(amount) {
    const multiplier = this.isVip ? 2 : 1; // VIP gets 2x coins
    this.coins += (amount * multiplier);
    this.save('arcade_coins', this.coins);
    window.dispatchEvent(new CustomEvent('coins-updated', { detail: { coins: this.coins, added: amount * multiplier } }));
    return this.coins;
  }

  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.save('arcade_coins', this.coins);
      window.dispatchEvent(new CustomEvent('coins-updated', { detail: { coins: this.coins, spent: amount } }));
      return true;
    }
    return false;
  }

  // --- Player Profile ---

  getPlayerName() {
    return this.playerName;
  }

  setPlayerName(name) {
    if (name && name.trim()) {
      this.playerName = name.trim().slice(0, 16);
      this.save('arcade_player_name', this.playerName);
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: this.playerName } }));
    }
  }

  // --- Themes ---

  getThemesList() {
    return THEMES_DEF;
  }

  getUnlockedThemes() {
    return this.unlockedThemes;
  }

  getActiveTheme() {
    return this.activeTheme;
  }

  setActiveTheme(themeId) {
    if (this.unlockedThemes.includes(themeId)) {
      this.activeTheme = themeId;
      this.save('arcade_active_theme', themeId);
      document.documentElement.setAttribute('data-theme', themeId);
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: themeId } }));
      return true;
    }
    return false;
  }

  unlockTheme(themeId) {
    const theme = THEMES_DEF.find(t => t.id === themeId);
    if (!theme) return false;
    if (this.unlockedThemes.includes(themeId)) return true;

    if (this.spendCoins(theme.price)) {
      this.unlockedThemes.push(themeId);
      this.save('arcade_unlocked_themes', this.unlockedThemes);
      this.setActiveTheme(themeId);
      return true;
    }
    return false;
  }

  // --- Daily Streak ---

  checkDailyStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = this.streakData.lastDate;

    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastDate === yesterday) {
        // Consecutive day
        this.streakData.claimedToday = false;
      } else {
        // Missed a day
        this.streakData.streak = 1;
        this.streakData.claimedToday = false;
      }
      this.streakData.lastDate = today;
      this.save('arcade_streak_data', this.streakData);
    }
  }

  claimDailyBonus() {
    if (this.streakData.claimedToday) return { success: false, msg: 'Already claimed today!' };

    const streakCount = this.streakData.streak;
    const bonusCoins = 50 + Math.min(streakCount * 25, 250);

    this.streakData.streak += 1;
    this.streakData.claimedToday = true;
    this.save('arcade_streak_data', this.streakData);
    this.addCoins(bonusCoins);

    if (this.streakData.streak >= 3) {
      this.unlockAchievement('streak_3');
    }

    return { success: true, coins: bonusCoins, streak: this.streakData.streak };
  }

  getStreakInfo() {
    return this.streakData;
  }

  // --- Achievements ---

  getAchievements() {
    return ACHIEVEMENTS_DEF.map(ach => ({
      ...ach,
      unlocked: !!this.achievements[ach.id],
      unlockedAt: this.achievements[ach.id] || null
    }));
  }

  unlockAchievement(id) {
    if (this.achievements[id]) return false; // Already unlocked

    const ach = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (!ach) return false;

    this.achievements[id] = new Date().toISOString();
    this.save('arcade_achievements', this.achievements);
    this.addCoins(ach.reward);

    window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: ach }));
    return true;
  }

  // --- VIP & Ads ---

  isVipMember() {
    return !!this.isVip;
  }

  setVipMember(status) {
    this.isVip = !!status;
    this.save('arcade_vip_status', this.isVip);
    window.dispatchEvent(new CustomEvent('vip-status-changed', { detail: { isVip: this.isVip } }));
  }
}

export const storage = new StorageManager();
