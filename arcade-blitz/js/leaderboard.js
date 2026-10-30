/**
 * Leaderboard Engine
 * Provides simulated global community competition, local player ranking,
 * and seamless integration hooks for Supabase & Firebase remote backends.
 */

import { storage } from './storage.js';

// Realistic simulated live global players across all games
const MOCK_GLOBAL_DATA = {
  tap_speed: [
    { name: 'HyperSonic_99', score: 114, country: '🇺🇸', badge: '👑 Grandmaster' },
    { name: 'KiraGodFinger', score: 108, country: '🇯🇵', badge: '⚡ Godlike' },
    { name: 'ViperStrike', score: 99, country: '🇰🇷', badge: '🔥 Legend' },
    { name: 'TurboPixel', score: 94, country: '🇬🇧', badge: '🚀 Elite' },
    { name: 'CyberWolf', score: 88, country: '🇩🇪', badge: '💎 Pro' },
    { name: 'NeonSamurai', score: 82, country: '🇧🇷', badge: '⭐ Diamond' },
    { name: 'ShadowGamer', score: 76, country: '🇨🇦', badge: '🥇 Gold' }
  ],
  color_reaction: [
    { name: 'BrainMatrix', score: 38, country: '🇸🇬', badge: '👑 Grandmaster' },
    { name: 'ChromaMaster', score: 34, country: '🇫🇷', badge: '⚡ Godlike' },
    { name: 'PrismQueen', score: 31, country: '🇺🇸', badge: '🔥 Legend' },
    { name: 'SpectraNova', score: 28, country: '🇦🇺', badge: '🚀 Elite' },
    { name: 'QuantumMind', score: 25, country: '🇯🇵', badge: '💎 Pro' }
  ],
  brain_puzzle: [
    { name: 'Einstein9000', score: 26, country: '🇩🇪', badge: '👑 Grandmaster' },
    { name: 'LogicBeast', score: 23, country: '🇮🇳', badge: '⚡ Godlike' },
    { name: 'MathWizard', score: 20, country: '🇺🇸', badge: '🔥 Legend' },
    { name: 'SynapseOverload', score: 18, country: '🇨🇦', badge: '🚀 Elite' },
    { name: 'NeuralNet_AI', score: 16, country: '🇬🇧', badge: '💎 Pro' }
  ],
  stack_tower: [
    { name: 'ZenArchitect', score: 54, country: '🇯🇵', badge: '👑 Grandmaster' },
    { name: 'Skyscraper99', score: 48, country: '🇺🇸', badge: '⚡ Godlike' },
    { name: 'TowerLord', score: 42, country: '🇰🇷', badge: '🔥 Legend' },
    { name: 'PixelMason', score: 36, country: '🇩🇪', badge: '🚀 Elite' },
    { name: 'SteadyHands', score: 31, country: '🇸🇪', badge: '💎 Pro' }
  ],
  number_memory: [
    { name: 'ChimpMind_God', score: 16, country: '🇯🇵', badge: '👑 Grandmaster' },
    { name: 'MemoryPalace', score: 14, country: '🇺🇸', badge: '⚡ Godlike' },
    { name: 'DigitViper', score: 13, country: '🇨🇳', badge: '🔥 Legend' },
    { name: 'TotalRecall', score: 11, country: '🇬🇧', badge: '🚀 Elite' },
    { name: 'BrainWave_X', score: 10, country: '🇫🇷', badge: '💎 Pro' }
  ],
  flappy_challenge: [
    { name: 'WingCommander', score: 68, country: '🇺🇸', badge: '👑 Grandmaster' },
    { name: 'FlapMasterX', score: 57, country: '🇧🇷', badge: '⚡ Godlike' },
    { name: 'CloudDodger', score: 46, country: '🇯🇵', badge: '🔥 Legend' },
    { name: 'FeatherFury', score: 38, country: '🇩🇪', badge: '🚀 Elite' },
    { name: 'AeroKing', score: 30, country: '🇮🇳', badge: '💎 Pro' }
  ],
  escape_maze: [
    { name: 'MinotaurBane', score: 9, country: '🇬🇷', badge: '👑 Grandmaster' },
    { name: 'MazeRunner_01', score: 8, country: '🇺🇸', badge: '⚡ Godlike' },
    { name: 'PathFinderPro', score: 7, country: '🇦🇺', badge: '🔥 Legend' },
    { name: 'SpeedyCompass', score: 6, country: '🇨🇦', badge: '🚀 Elite' },
    { name: 'LabyrinthAce', score: 5, country: '🇯🇵', badge: '💎 Pro' }
  ],
  impossible_quiz: [
    { name: 'SherlockHolmes', score: 12, country: '🇬🇧', badge: '👑 Grandmaster' },
    { name: 'UnTrollable', score: 12, country: '🇺🇸', badge: '⚡ Godlike' },
    { name: 'TrickProof', score: 11, country: '🇩🇪', badge: '🔥 Legend' },
    { name: 'RiddleMaster', score: 10, country: '🇫🇷', badge: '🚀 Elite' },
    { name: 'IQ_Over9000', score: 9, country: '🇯🇵', badge: '💎 Pro' }
  ],
  emoji_memory: [
    { name: 'MatchFlash', score: 14, country: '🇺🇸', badge: '👑 Grandmaster' },
    { name: 'TwinFinder', score: 17, country: '🇰🇷', badge: '⚡ Godlike' },
    { name: 'CardNinja', score: 19, country: '🇩🇪', badge: '🔥 Legend' },
    { name: 'MemoryQueen', score: 22, country: '🇯🇵', badge: '🚀 Elite' },
    { name: 'QuickEye', score: 25, country: '🇨🇦', badge: '💎 Pro' }
  ],
  reflex_challenge: [
    { name: 'MachOneReflex', score: 154, country: '🇺🇸', badge: '👑 Grandmaster' },
    { name: 'LightningBolt', score: 168, country: '🇯🇵', badge: '⚡ Godlike' },
    { name: 'NeuralApex', score: 182, country: '🇰🇷', badge: '🔥 Legend' },
    { name: 'FighterJetPilot', score: 195, country: '🇩🇪', badge: '🚀 Elite' },
    { name: 'TwitchReflex', score: 210, country: '🇬🇧', badge: '💎 Pro' }
  ]
};

export class LeaderboardManager {
  constructor() {
    this.remoteConfig = storage.load('arcade_remote_db_config', {
      provider: 'mock', // 'mock', 'supabase', or 'firebase'
      supabaseUrl: '',
      supabaseKey: '',
      firebaseConfig: null
    });
  }

  isRemoteEnabled() {
    return this.remoteConfig.provider !== 'mock' && !!(this.remoteConfig.supabaseUrl || this.remoteConfig.firebaseConfig);
  }

  getRemoteConfig() {
    return this.remoteConfig;
  }

  setRemoteConfig(config) {
    this.remoteConfig = { ...this.remoteConfig, ...config };
    storage.save('arcade_remote_db_config', this.remoteConfig);
  }

  async getLeaderboard(gameId) {
    // If remote DB (e.g. Supabase) is active, fetch from remote table
    if (this.remoteConfig.provider === 'supabase' && this.remoteConfig.supabaseUrl && this.remoteConfig.supabaseKey) {
      try {
        const orderCol = (gameId === 'reflex_challenge' || gameId === 'emoji_memory') ? 'score.asc' : 'score.desc';
        const res = await fetch(`${this.remoteConfig.supabaseUrl}/rest/v1/leaderboard?game_id=eq.${gameId}&order=${orderCol}&limit=20`, {
          headers: {
            'apikey': this.remoteConfig.supabaseKey,
            'Authorization': `Bearer ${this.remoteConfig.supabaseKey}`
          }
        });
        if (res.ok) {
          const remoteData = await res.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            return remoteData;
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to mock community:', e);
      }
    }

    // Default: Combined global community + player personal record
    const baseList = [...(MOCK_GLOBAL_DATA[gameId] || [])];
    const playerScore = storage.getHighScore(gameId);
    const playerName = storage.getPlayerName();

    if (playerScore > 0 && playerScore !== 999) {
      baseList.push({
        name: `${playerName} (YOU)`,
        score: playerScore,
        country: '📍 Local',
        badge: '⭐ You',
        isCurrentPlayer: true
      });
    }

    // Sort accordingly
    if (gameId === 'reflex_challenge' || gameId === 'emoji_memory') {
      baseList.sort((a, b) => a.score - b.score);
    } else {
      baseList.sort((a, b) => b.score - a.score);
    }

    return baseList.slice(0, 15);
  }

  async submitScore(gameId, score) {
    if (score <= 0 && gameId !== 'reflex_challenge') return;

    if (this.remoteConfig.provider === 'supabase' && this.remoteConfig.supabaseUrl && this.remoteConfig.supabaseKey) {
      try {
        await fetch(`${this.remoteConfig.supabaseUrl}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.remoteConfig.supabaseKey,
            'Authorization': `Bearer ${this.remoteConfig.supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            game_id: gameId,
            player_name: storage.getPlayerName(),
            score: score,
            created_at: new Date().toISOString()
          })
        });
      } catch (e) {
        console.warn('Supabase score submit failed:', e);
      }
    }
  }
}

export const leaderboard = new LeaderboardManager();
