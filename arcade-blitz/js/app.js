/**
 * Arcade Blitz - Master Application Controller
 * Coordinates games lifecycle, state, UI modals, social sharing, and monetization.
 */

import { sound } from './audio.js';
import { storage } from './storage.js';
import { confetti } from './confetti.js';
import { viral } from './viral.js';
import { leaderboard } from './leaderboard.js';
import { monetization } from './monetization.js';

// Import All 10 Mini-Games
import { TapSpeedGame } from './games/tap-speed.js';
import { ColorReactionGame } from './games/color-reaction.js';
import { BrainPuzzleGame } from './games/brain-puzzle.js';
import { StackTowerGame } from './games/stack-tower.js';
import { NumberMemoryGame } from './games/number-memory.js';
import { FlappyChallengeGame } from './games/flappy-challenge.js';
import { EscapeMazeGame } from './games/escape-maze.js';
import { ImpossibleQuizGame } from './games/impossible-quiz.js';
import { EmojiMemoryGame } from './games/emoji-memory.js';
import { ReflexChallengeGame } from './games/reflex-challenge.js';

const GAMES_CATALOG = [
  {
    id: 'tap_speed',
    title: 'Tap Speed Challenge',
    category: 'reflex',
    icon: '🔥',
    badge: 'HOT',
    badgeClass: 'hot',
    scoreUnit: 'taps',
    desc: 'Tap as fast as possible in 10 seconds. Unleash crazy combo bursts and rank up!',
    gameClass: TapSpeedGame
  },
  {
    id: 'color_reaction',
    title: 'Color Reaction Test',
    category: 'reflex',
    icon: '🎨',
    badge: 'REFLEX',
    badgeClass: 'reflex',
    scoreUnit: 'pts',
    desc: 'Rapid Stroop effect! Match colors before your brain tricks you.',
    gameClass: ColorReactionGame
  },
  {
    id: 'brain_puzzle',
    title: 'Brain Puzzle Rush',
    category: 'brain',
    icon: '🧠',
    badge: 'BRAIN',
    badgeClass: 'brain',
    scoreUnit: 'solved',
    desc: 'Solve fast arithmetic, number sequences, and logic patterns against the clock.',
    gameClass: BrainPuzzleGame
  },
  {
    id: 'stack_tower',
    title: 'Stack Tower',
    category: 'arcade',
    icon: '🏢',
    badge: 'SKILL',
    badgeClass: 'puzzle',
    scoreUnit: 'floors',
    desc: 'Stack sliding blocks perfectly. Slices off overhang with physics!',
    gameClass: StackTowerGame
  },
  {
    id: 'number_memory',
    title: 'Number Memory',
    category: 'brain',
    icon: '🔢',
    badge: 'BRAIN',
    badgeClass: 'brain',
    scoreUnit: 'digits',
    desc: 'Remember and repeat increasingly long digit sequences. Test human limits!',
    gameClass: NumberMemoryGame
  },
  {
    id: 'flappy_challenge',
    title: 'Flappy Challenge',
    category: 'arcade',
    icon: '🪶',
    badge: 'HOT',
    badgeClass: 'hot',
    scoreUnit: 'pipes',
    desc: 'Avoid pipes, navigate tight gaps, collect coins, and beat your personal best.',
    gameClass: FlappyChallengeGame
  },
  {
    id: 'escape_maze',
    title: 'Escape the Maze',
    category: 'arcade',
    icon: '🌀',
    badge: 'SKILL',
    badgeClass: 'puzzle',
    scoreUnit: 'stages',
    desc: 'Procedural labyrinth speedrun! Collect gems for time extensions and escape.',
    gameClass: EscapeMazeGame
  },
  {
    id: 'impossible_quiz',
    title: 'The Impossible Quiz',
    category: 'brain',
    icon: '💡',
    badge: 'TROLL',
    badgeClass: 'hot',
    scoreUnit: 'solved',
    desc: 'Answer hilarious tricky questions with logic traps and hidden clickable secrets.',
    gameClass: ImpossibleQuizGame
  },
  {
    id: 'emoji_memory',
    title: 'Emoji Memory Blitz',
    category: 'brain',
    icon: '🃏',
    badge: 'BRAIN',
    badgeClass: 'brain',
    scoreUnit: 'sec',
    desc: 'Flip 3D cards and pair identical emojis with speed and combo multipliers.',
    gameClass: EmojiMemoryGame
  },
  {
    id: 'reflex_challenge',
    title: 'Reflex Challenge',
    category: 'reflex',
    icon: '⚡',
    badge: 'REFLEX',
    badgeClass: 'reflex',
    scoreUnit: 'ms',
    desc: 'Measure reaction speed down to the millisecond. Are your reflexes superhuman?',
    gameClass: ReflexChallengeGame
  }
];

class ArcadeApp {
  constructor() {
    this.currentGameInstance = null;
    this.currentGameDef = null;
    this.lastGameOverData = null;
    this.currentCategory = 'all';
    this.searchQuery = '';

    // Cache DOM elements
    this.dom = {
      coinsVal: document.getElementById('player-coins-val'),
      streakVal: document.getElementById('player-streak-val'),
      audioToggleBtn: document.getElementById('audio-toggle-btn'),
      profileBtn: document.getElementById('profile-btn'),
      gamesGrid: document.getElementById('games-grid'),
      categoryTabs: document.getElementById('category-tabs'),
      searchInput: document.getElementById('search-input'),
      dailyBanner: document.getElementById('daily-banner'),
      dailyTitle: document.getElementById('daily-game-title'),
      dailyDesc: document.getElementById('daily-game-desc'),
      dailyPlayBtn: document.getElementById('daily-play-btn'),
      gameModal: document.getElementById('game-modal'),
      gameArena: document.getElementById('game-arena'),
      activeGameHeaderTitle: document.getElementById('active-game-header-title'),
      activeGameExitBtn: document.getElementById('active-game-exit-btn'),
      activeGameAudioBtn: document.getElementById('active-game-audio-btn'),
      gameOverModal: document.getElementById('game-over-modal'),
      gameOverScore: document.getElementById('game-over-score'),
      gameOverUnit: document.getElementById('game-over-unit'),
      gameOverRecordBadge: document.getElementById('game-over-record-badge'),
      gameOverRoast: document.getElementById('game-over-roast'),
      gameOverSub: document.getElementById('game-over-sub'),
      gameOverRetryBtn: document.getElementById('game-over-retry-btn'),
      gameOverShareBtn: document.getElementById('game-over-share-btn'),
      gameOverChallengeBtn: document.getElementById('game-over-challenge-btn'),
      gameOverLobbyBtn: document.getElementById('game-over-lobby-btn'),
      gameOverCloseBtn: document.getElementById('game-over-close-btn'),
      shareCardModal: document.getElementById('share-card-modal'),
      shareCardCloseBtn: document.getElementById('share-card-close-btn'),
      shareCardPreview: document.getElementById('share-card-preview-container'),
      shareCardNativeBtn: document.getElementById('share-card-native-btn'),
      shareCardDownloadBtn: document.getElementById('share-card-download-btn'),
      leaderboardModal: document.getElementById('leaderboard-modal'),
      leaderboardCloseBtn: document.getElementById('leaderboard-close-btn'),
      leaderboardSelect: document.getElementById('leaderboard-game-select'),
      leaderboardContainer: document.getElementById('leaderboard-list-container'),
      shopModal: document.getElementById('shop-modal'),
      shopCloseBtn: document.getElementById('shop-close-btn'),
      shopCoinsDisplay: document.getElementById('shop-coins-display'),
      shopFreeCoinsBtn: document.getElementById('shop-free-coins-btn'),
      themesListContainer: document.getElementById('themes-list-container'),
      achievementsModal: document.getElementById('achievements-modal'),
      achievementsCloseBtn: document.getElementById('achievements-close-btn'),
      achievementsListContainer: document.getElementById('achievements-list-container'),
      profileModal: document.getElementById('profile-modal'),
      profileCloseBtn: document.getElementById('profile-close-btn'),
      profileNameInput: document.getElementById('profile-name-input'),
      profileSaveBtn: document.getElementById('profile-save-btn'),
      vipModal: document.getElementById('vip-modal'),
      vipCloseBtn: document.getElementById('vip-close-btn'),
      vipToggleBtn: document.getElementById('vip-toggle-btn'),
      dbConfigModal: document.getElementById('db-config-modal'),
      dbConfigCloseBtn: document.getElementById('db-config-close-btn'),
      dbConfigOpenBtn: document.getElementById('db-config-open-btn'),
      dbProviderSelect: document.getElementById('db-provider-select'),
      supabaseFields: document.getElementById('supabase-fields'),
      supabaseUrlInput: document.getElementById('supabase-url-input'),
      supabaseKeyInput: document.getElementById('supabase-key-input'),
      dbSaveBtn: document.getElementById('db-save-btn'),
      challengeModal: document.getElementById('challenge-received-modal'),
      challengeCloseBtn: document.getElementById('challenge-modal-close-btn'),
      challengerNameText: document.getElementById('challenger-name-text'),
      challengerScoreText: document.getElementById('challenger-score-text'),
      challengerGameName: document.getElementById('challenger-game-name'),
      acceptChallengeBtn: document.getElementById('accept-challenge-btn'),
      toastContainer: document.getElementById('toast-container')
    };

    this.init();
  }

  init() {
    // Apply saved theme
    storage.setActiveTheme(storage.getActiveTheme());

    // Update UI Stats
    this.updateStatsUI();

    // Render Mini-Games Gallery Grid
    this.renderGallery();

    // Setup Daily Challenge of the Day
    this.setupDailyChallenge();

    // Bind Event Listeners
    this.bindEvents();

    // Initialize Monetization (Ads, VIP, rewarded ad triggers)
    monetization.init();

    // Check for incoming friend challenge URL
    this.checkIncomingChallenge();

    // Achievement check for first launch
    window.addEventListener('achievement-unlocked', (e) => {
      this.showToast(`🏆 Achievement Unlocked: ${e.detail.title}! (+${e.detail.reward} 🪙)`);
      sound.playFanfare();
      this.updateStatsUI();
    });
  }

  updateStatsUI() {
    if (this.dom.coinsVal) this.dom.coinsVal.textContent = storage.getCoins();
    if (this.dom.streakVal) this.dom.streakVal.textContent = storage.getStreakInfo().streak;
    if (this.dom.shopCoinsDisplay) this.dom.shopCoinsDisplay.textContent = `🪙 ${storage.getCoins()}`;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- Daily Challenge Logic ---

  setupDailyChallenge() {
    // Daily game seeded by day of the year
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const dailyIndex = dayOfYear % GAMES_CATALOG.length;
    this.dailyGame = GAMES_CATALOG[dailyIndex];

    this.dom.dailyTitle.textContent = `${this.dailyGame.icon} ${this.dailyGame.title}`;
    this.dom.dailyDesc.textContent = `Today's Daily Challenge! Beat high scores for a 2X Arcade Coins Bonus!`;

    this.dom.dailyPlayBtn.onclick = () => {
      this.launchGame(this.dailyGame.id, { isDaily: true });
    };
  }

  // --- Incoming Challenge Logic ---

  checkIncomingChallenge() {
    const challenge = viral.getIncomingChallenge();
    if (challenge) {
      const gameDef = GAMES_CATALOG.find(g => g.id === challenge.gameId) || GAMES_CATALOG[0];
      this.dom.challengerNameText.textContent = `${challenge.challengerName} Challenged You!`;
      this.dom.challengerScoreText.textContent = `${challenge.targetScore} ${gameDef.scoreUnit}`;
      this.dom.challengerGameName.textContent = gameDef.title;

      this.openModal(this.dom.challengeModal);

      this.dom.acceptChallengeBtn.onclick = () => {
        this.closeModal(this.dom.challengeModal);
        this.launchGame(gameDef.id, { challengeTarget: challenge.targetScore });
      };
    }
  }

  // --- Mini-Games Gallery Rendering & Search ---

  renderGallery() {
    const query = this.searchQuery.toLowerCase().trim();
    const filtered = GAMES_CATALOG.filter(game => {
      const matchesCategory = (this.currentCategory === 'all' || game.category === this.currentCategory);
      const matchesSearch = (!query || game.title.toLowerCase().includes(query) || game.desc.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });

    this.dom.gamesGrid.innerHTML = '';

    if (filtered.length === 0) {
      this.dom.gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
          <div style="font-size: 1.2rem; font-weight: 800;">No mini-games found</div>
          <div style="font-size: 0.85rem;">Try adjusting your search query or category filters.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(game => {
      const bestScore = storage.getHighScore(game.id);
      let bestDisplay = `${bestScore} ${game.scoreUnit}`;
      if (bestScore === 999 || bestScore === 0) bestDisplay = '--';

      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="game-card-top">
          <div class="game-icon-bubble">${game.icon}</div>
          <span class="game-badge ${game.badgeClass}">${game.badge}</span>
        </div>
        <div class="game-info">
          <h3 class="game-title">${game.title}</h3>
          <p class="game-desc">${game.desc}</p>
        </div>
        <div class="game-card-bottom">
          <div class="game-best">
            <span class="best-label">YOUR BEST</span>
            <span class="best-val">${bestDisplay}</span>
          </div>
          <button class="play-action-btn">
            <span>PLAY</span> ➔
          </button>
        </div>
      `;

      card.addEventListener('click', () => {
        sound.playTap(1.1);
        this.launchGame(game.id);
      });

      this.dom.gamesGrid.appendChild(card);
    });
  }

  // --- Game Lifecycle Manager ---

  launchGame(gameId, options = {}) {
    const gameDef = GAMES_CATALOG.find(g => g.id === gameId);
    if (!gameDef) return;

    this.currentGameDef = gameDef;

    // Clean up any running game
    if (this.currentGameInstance && typeof this.currentGameInstance.destroy === 'function') {
      this.currentGameInstance.destroy();
    }

    this.dom.activeGameHeaderTitle.textContent = `${gameDef.icon} ${gameDef.title}`;
    this.openModal(this.dom.gameModal);

    // Instantiate and mount game
    const GameClass = gameDef.gameClass;
    this.currentGameInstance = new GameClass(this.dom.gameArena, (result) => {
      this.handleGameOver(result, options);
    });

    this.currentGameInstance.mount();
  }

  closeActiveGame() {
    if (this.currentGameInstance && typeof this.currentGameInstance.destroy === 'function') {
      this.currentGameInstance.destroy();
      this.currentGameInstance = null;
    }
    this.closeModal(this.dom.gameModal);
    this.renderGallery();
    this.updateStatsUI();
  }

  // --- Game Over & Viral Orchestration ---

  handleGameOver(result, options = {}) {
    this.lastGameOverData = result;
    this.closeModal(this.dom.gameModal);

    // If Daily Challenge, apply 2x coins
    if (options.isDaily) {
      storage.addCoins(Math.floor(result.score * 1.5));
      this.showToast('🔥 2X Daily Bonus applied to your coins!');
    }

    // Submit score to leaderboards
    leaderboard.submitScore(result.gameId, result.score);

    // Populate Game Over Modal
    this.dom.gameOverScore.textContent = result.score;
    this.dom.gameOverUnit.textContent = result.scoreUnit.toUpperCase();
    this.dom.gameOverSub.textContent = result.subtitle || '';

    const roast = viral.getRoast(result.score, result.gameId);
    this.dom.gameOverRoast.textContent = `"${roast}"`;

    if (result.isNewBest) {
      this.dom.gameOverRecordBadge.style.display = 'inline-block';
      confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 80);
    } else {
      this.dom.gameOverRecordBadge.style.display = 'none';
    }

    this.updateStatsUI();
    this.openModal(this.dom.gameOverModal);

    // Check interstitial ad counter
    monetization.showInterstitialAd();
  }

  // --- Share Card Canvas View ---

  async showShareCardModal() {
    if (!this.lastGameOverData) return;

    this.dom.shareCardPreview.innerHTML = '<div style="padding: 2rem; color: #fff;">Generating High-Res Card...</div>';
    this.openModal(this.dom.shareCardModal);

    const canvas = await viral.generateScoreCardCanvas(this.lastGameOverData);
    this.currentShareCanvas = canvas;

    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.display = 'block';

    this.dom.shareCardPreview.innerHTML = '';
    this.dom.shareCardPreview.appendChild(canvas);

    // Download PNG Action
    this.dom.shareCardDownloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = `arcade-blitz-${this.lastGameOverData.gameId}-${this.lastGameOverData.score}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('📸 Score card downloaded!');
    };

    // Native Share / Copy Link Action
    this.dom.shareCardNativeBtn.onclick = async () => {
      const res = await viral.shareScore(this.lastGameOverData);
      if (res.method === 'clipboard') {
        this.showToast('📋 Challenge link copied to clipboard!');
      } else if (res.success) {
        this.showToast('🚀 Challenge shared!');
      }
    };
  }

  // --- Leaderboard View ---

  async openLeaderboardView(selectedGameId) {
    const gameId = selectedGameId || this.lastGameOverData?.gameId || 'tap_speed';

    // Populate dropdown
    this.dom.leaderboardSelect.innerHTML = '';
    GAMES_CATALOG.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.icon} ${g.title}`;
      if (g.id === gameId) opt.selected = true;
      this.dom.leaderboardSelect.appendChild(opt);
    });

    this.dom.leaderboardSelect.onchange = (e) => {
      this.loadLeaderboardData(e.target.value);
    };

    this.openModal(this.dom.leaderboardModal);
    await this.loadLeaderboardData(gameId);
  }

  async loadLeaderboardData(gameId) {
    this.dom.leaderboardContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading community scores...</div>';

    const scores = await leaderboard.getLeaderboard(gameId);
    const gameDef = GAMES_CATALOG.find(g => g.id === gameId);

    this.dom.leaderboardContainer.innerHTML = '';

    scores.forEach((entry, index) => {
      const rank = index + 1;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '0.75rem 1rem';
      row.style.borderRadius = '12px';
      row.style.background = entry.isCurrentPlayer ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)';
      row.style.border = entry.isCurrentPlayer ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.06)';

      let medal = `#${rank}`;
      if (rank === 1) medal = '🥇 1st';
      else if (rank === 2) medal = '🥈 2nd';
      else if (rank === 3) medal = '🥉 3rd';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-weight: 900; font-size: 0.95rem; width: 55px; color: ${rank <= 3 ? 'var(--accent-yellow)' : 'var(--text-muted)'};">${medal}</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem;">
              <span>${entry.country || '🌐'}</span>
              <span>${entry.name}</span>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${entry.badge || 'Arcade Gamer'}</div>
          </div>
        </div>
        <div style="font-size: 1.15rem; font-weight: 900; color: var(--accent-cyan);">
          ${entry.score} <span style="font-size: 0.7rem; color: var(--text-muted);">${gameDef.scoreUnit}</span>
        </div>
      `;

      this.dom.leaderboardContainer.appendChild(row);
    });
  }

  // --- Shop & Themes View ---

  openShopView() {
    this.updateStatsUI();
    const themes = storage.getThemesList();
    const unlocked = storage.getUnlockedThemes();
    const active = storage.getActiveTheme();

    this.dom.themesListContainer.innerHTML = '';

    themes.forEach(theme => {
      const isUnlocked = unlocked.includes(theme.id);
      const isActive = active === theme.id;

      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.style.padding = '0.85rem';
      item.style.borderRadius = '14px';
      item.style.background = 'rgba(255, 255, 255, 0.04)';
      item.style.border = isActive ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: ${theme.preview}; border: 2px solid ${theme.accent};"></div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">${theme.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${theme.price === 0 ? 'Default Free' : `🪙 ${theme.price} Coins`}</div>
          </div>
        </div>
        <div>
          ${isActive ? `
            <button class="tab-btn active" style="cursor: default;">Equipped ✓</button>
          ` : isUnlocked ? `
            <button class="tab-btn" data-action="equip" data-theme="${theme.id}">Equip</button>
          ` : `
            <button class="primary-btn" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;" data-action="buy" data-theme="${theme.id}">
              Unlock 🪙 ${theme.price}
            </button>
          `}
        </div>
      `;

      const buyBtn = item.querySelector('[data-action="buy"]');
      if (buyBtn) {
        buyBtn.onclick = () => {
          if (storage.unlockTheme(theme.id)) {
            sound.playSuccess();
            this.showToast(`🎨 Unlocked & equipped ${theme.name}!`);
            this.openShopView();
          } else {
            sound.playError();
            this.showToast('⚠️ Not enough coins! Play more games or watch a reward ad.');
          }
        };
      }

      const equipBtn = item.querySelector('[data-action="equip"]');
      if (equipBtn) {
        equipBtn.onclick = () => {
          storage.setActiveTheme(theme.id);
          sound.playTap(1.2);
          this.showToast(`🎨 Equipped ${theme.name}!`);
          this.openShopView();
        };
      }

      this.dom.themesListContainer.appendChild(item);
    });

    this.openModal(this.dom.shopModal);
  }

  // --- Achievements View ---

  openAchievementsView() {
    const list = storage.getAchievements();
    this.dom.achievementsListContainer.innerHTML = '';

    list.forEach(ach => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '0.85rem';
      row.style.borderRadius = '14px';
      row.style.background = ach.unlocked ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)';
      row.style.border = ach.unlocked ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)';
      row.style.opacity = ach.unlocked ? '1' : '0.65';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 2rem;">${ach.icon}</div>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: ${ach.unlocked ? 'var(--accent-cyan)' : 'var(--text-primary)'};">${ach.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">${ach.desc}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 900; font-size: 0.9rem; color: var(--accent-yellow);">+${ach.reward} 🪙</div>
          <div style="font-size: 0.7rem; font-weight: 700; color: ${ach.unlocked ? '#00e676' : 'var(--text-muted)'};">
            ${ach.unlocked ? 'COMPLETED ✓' : 'LOCKED 🔒'}
          </div>
        </div>
      `;

      this.dom.achievementsListContainer.appendChild(row);
    });

    this.openModal(this.dom.achievementsModal);
  }

  // --- Profile Editor ---

  openProfileView() {
    this.dom.profileNameInput.value = storage.getPlayerName();
    this.openModal(this.dom.profileModal);
  }

  saveProfileName() {
    const newName = this.dom.profileNameInput.value.trim();
    if (newName) {
      storage.setPlayerName(newName);
      this.closeModal(this.dom.profileModal);
      this.showToast(`👤 Player name set to: ${newName}`);
      sound.playSuccess();
    }
  }

  // --- Modal Helpers ---

  openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  // --- Event Bindings ---

  bindEvents() {
    // Brand Click -> Lobby
    document.getElementById('brand-home-btn').onclick = () => {
      this.closeActiveGame();
    };

    // Audio Toggle
    const updateAudioIcon = () => {
      const isMuted = sound.muted;
      this.dom.audioToggleBtn.textContent = isMuted ? '🔇' : '🔊';
      this.dom.activeGameAudioBtn.textContent = isMuted ? '🔇' : '🔊';
    };
    updateAudioIcon();

    this.dom.audioToggleBtn.onclick = () => {
      sound.toggleMute();
      updateAudioIcon();
      this.showToast(sound.muted ? '🔇 Sound Muted' : '🔊 Sound Enabled');
    };
    this.dom.activeGameAudioBtn.onclick = () => {
      sound.toggleMute();
      updateAudioIcon();
    };

    // Profile Modal
    this.dom.profileBtn.onclick = () => this.openProfileView();
    this.dom.profileCloseBtn.onclick = () => this.closeModal(this.dom.profileModal);
    this.dom.profileSaveBtn.onclick = () => this.saveProfileName();

    // Streak / Daily Bonus Claim
    this.dom.streakVal.parentElement.onclick = () => {
      const res = storage.claimDailyBonus();
      if (res.success) {
        sound.playFanfare();
        confetti.burst();
        this.showToast(`🔥 Claimed Day ${res.streak} Daily Reward: +${res.coins} 🪙!`);
        this.updateStatsUI();
      } else {
        this.showToast('📅 Daily reward already claimed for today! Return tomorrow.');
      }
    };

    // Search and Tabs
    this.dom.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.dom.categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.category;
        this.renderGallery();
      };
    });

    this.dom.searchInput.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.renderGallery();
    };

    // Active Game Modal Controls
    this.dom.activeGameExitBtn.onclick = () => this.closeActiveGame();

    // Game Over Actions
    this.dom.gameOverCloseBtn.onclick = () => this.closeModal(this.dom.gameOverModal);
    this.dom.gameOverLobbyBtn.onclick = () => {
      this.closeModal(this.dom.gameOverModal);
      this.renderGallery();
    };
    this.dom.gameOverRetryBtn.onclick = () => {
      this.closeModal(this.dom.gameOverModal);
      if (this.lastGameOverData) {
        this.launchGame(this.lastGameOverData.gameId);
      }
    };
    this.dom.gameOverShareBtn.onclick = () => {
      this.showShareCardModal();
    };
    this.dom.gameOverChallengeBtn.onclick = async () => {
      const res = await viral.shareScore(this.lastGameOverData);
      if (res.method === 'clipboard') {
        this.showToast('📋 Challenge link copied! Send it to your friend!');
      } else {
        this.showToast('🚀 Challenge link ready to send!');
      }
    };

    // Share Card Modal Close
    this.dom.shareCardCloseBtn.onclick = () => this.closeModal(this.dom.shareCardModal);

    // Friend Challenge Modal Close
    this.dom.challengeCloseBtn.onclick = () => this.closeModal(this.dom.challengeModal);

    // Leaderboard Modal
    this.dom.leaderboardCloseBtn.onclick = () => this.closeModal(this.dom.leaderboardModal);
    document.getElementById('nav-leaderboard-btn').onclick = () => this.openLeaderboardView();

    // Shop & Themes Modal
    this.dom.openShopPill.onclick = () => this.openShopView();
    this.dom.shopCloseBtn.onclick = () => this.closeModal(this.dom.shopModal);
    document.getElementById('nav-shop-btn').onclick = () => this.openShopView();

    // Rewarded Ad Triggers
    const triggerRewardedAd = () => {
      monetization.showRewardedAd({
        rewardDescription: 'Watch 5 seconds to earn +100 Free Arcade Coins!',
        onReward: () => {
          storage.addCoins(100);
          confetti.burst();
          this.showToast('🎁 +100 Free Coins claimed!');
          this.updateStatsUI();
        }
      });
    };
    this.dom.shopFreeCoinsBtn.onclick = triggerRewardedAd;
    document.getElementById('bottom-ad-reward-cta').onclick = triggerRewardedAd;

    // Achievements Modal
    document.getElementById('nav-achievements-btn').onclick = () => this.openAchievementsView();
    this.dom.achievementsCloseBtn.onclick = () => this.closeModal(this.dom.achievementsModal);

    // VIP Pass Modal
    const openVipModal = () => {
      this.updateVipBtn();
      this.openModal(this.dom.vipModal);
    };
    document.getElementById('nav-vip-btn').onclick = openVipModal;
    document.getElementById('top-ad-vip-cta').onclick = openVipModal;
    this.dom.vipCloseBtn.onclick = () => this.closeModal(this.dom.vipModal);

    this.dom.vipToggleBtn.onclick = () => {
      const current = storage.isVipMember();
      storage.setVipMember(!current);
      sound.playSuccess();
      this.updateVipBtn();
      this.showToast(!current ? '👑 VIP Pass Activated! Ads removed + 2X Coins!' : 'VIP Pass Deactivated.');
    };

    // Remote Database Config Modal
    this.dom.dbConfigOpenBtn.onclick = () => {
      const cfg = leaderboard.getRemoteConfig();
      this.dom.dbProviderSelect.value = cfg.provider || 'mock';
      this.dom.supabaseUrlInput.value = cfg.supabaseUrl || '';
      this.dom.supabaseKeyInput.value = cfg.supabaseKey || '';
      this.dom.supabaseFields.style.display = cfg.provider === 'supabase' ? 'block' : 'none';
      this.openModal(this.dom.dbConfigModal);
    };
    this.dom.dbConfigCloseBtn.onclick = () => this.closeModal(this.dom.dbConfigModal);
    this.dom.dbProviderSelect.onchange = (e) => {
      this.dom.supabaseFields.style.display = e.target.value === 'supabase' ? 'block' : 'none';
    };
    this.dom.dbSaveBtn.onclick = () => {
      leaderboard.setRemoteConfig({
        provider: this.dom.dbProviderSelect.value,
        supabaseUrl: this.dom.supabaseUrlInput.value.trim(),
        supabaseKey: this.dom.supabaseKeyInput.value.trim()
      });
      this.closeModal(this.dom.dbConfigModal);
      this.showToast('⚙️ Database configuration saved!');
      this.loadLeaderboardData(this.dom.leaderboardSelect.value);
    };
  }

  updateVipBtn() {
    const isVip = storage.isVipMember();
    this.dom.vipToggleBtn.textContent = isVip ? 'Deactivate VIP Pass' : 'Activate VIP Pass (Free Test / 500 Coins)';
    this.dom.vipToggleBtn.style.background = isVip ? '#ff0055' : 'linear-gradient(90deg, #ffd700, #ffae19)';
  }
}

// Start Arcade on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new ArcadeApp();
});
