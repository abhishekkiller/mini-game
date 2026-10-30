/**
 * Monetization Manager
 * Google AdSense integration, Rewarded Ads simulation, Interstitials, and VIP ad-removal pass.
 */

import { storage } from './storage.js';
import { sound } from './audio.js';

export class MonetizationManager {
  constructor() {
    this.adSenseClientId = 'ca-pub-YOUR_ADSENSE_ID'; // Replace with real AdSense ID in production
    this.adsInitialized = false;
    this.rewardCallback = null;
  }

  init() {
    this.updateAdContainers();
    window.addEventListener('vip-status-changed', () => this.updateAdContainers());
  }

  isAdFree() {
    return storage.isVipMember();
  }

  updateAdContainers() {
    const banners = document.querySelectorAll('.ad-banner-slot');
    const isVip = this.isAdFree();

    banners.forEach(slot => {
      if (isVip) {
        slot.style.display = 'none';
      } else {
        slot.style.display = 'flex';
      }
    });
  }

  // --- Rewarded Video Ad Modal Simulator ---

  showRewardedAd({ rewardDescription, onReward, onDismiss }) {
    if (this.isAdFree()) {
      // VIP users get instant reward without watching!
      sound.playSuccess();
      if (onReward) onReward();
      return;
    }

    const modal = document.getElementById('rewarded-ad-modal');
    const timerElem = document.getElementById('reward-ad-timer');
    const progressBar = document.getElementById('reward-ad-progress');
    const closeBtn = document.getElementById('reward-ad-close');
    const descElem = document.getElementById('reward-ad-desc');

    if (!modal) {
      if (onReward) onReward();
      return;
    }

    descElem.textContent = rewardDescription || 'Watch 5 seconds to claim your reward!';
    modal.classList.add('active');
    closeBtn.disabled = true;
    closeBtn.textContent = 'Reward in 5s...';

    let timeLeft = 5;
    progressBar.style.width = '0%';

    const interval = setInterval(() => {
      timeLeft--;
      const progress = ((5 - timeLeft) / 5) * 100;
      progressBar.style.width = `${progress}%`;

      if (timeLeft > 0) {
        closeBtn.textContent = `Reward in ${timeLeft}s...`;
      } else {
        clearInterval(interval);
        closeBtn.disabled = false;
        closeBtn.textContent = 'Claim Reward & Close 🎁';
        closeBtn.classList.add('pulse');
        sound.playSuccess();
      }
    }, 1000);

    const handleClose = () => {
      clearInterval(interval);
      modal.classList.remove('active');
      closeBtn.removeEventListener('click', handleClose);

      if (timeLeft <= 0) {
        if (onReward) onReward();
      } else {
        if (onDismiss) onDismiss();
      }
    };

    closeBtn.addEventListener('click', handleClose);
  }

  // --- Interstitial Ad Simulator (between game sessions) ---

  showInterstitialAd(onComplete) {
    if (this.isAdFree()) {
      if (onComplete) onComplete();
      return;
    }

    // Only show interstitial every 3rd game over to avoid annoying users
    const playCount = (storage.load('arcade_interstitial_counter', 0) + 1);
    storage.save('arcade_interstitial_counter', playCount);

    if (playCount % 3 !== 0) {
      if (onComplete) onComplete();
      return;
    }

    const modal = document.getElementById('interstitial-ad-modal');
    const timerElem = document.getElementById('interstitial-skip-btn');
    if (!modal) {
      if (onComplete) onComplete();
      return;
    }

    modal.classList.add('active');
    let timeLeft = 3;
    timerElem.disabled = true;
    timerElem.textContent = `Skip in ${timeLeft}s`;

    const timer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        timerElem.textContent = `Skip in ${timeLeft}s`;
      } else {
        clearInterval(timer);
        timerElem.disabled = false;
        timerElem.textContent = 'Skip Ad ✕';
      }
    }, 1000);

    const handleSkip = () => {
      clearInterval(timer);
      modal.classList.remove('active');
      timerElem.removeEventListener('click', handleSkip);
      if (onComplete) onComplete();
    };

    timerElem.addEventListener('click', handleSkip);
  }
}

export const monetization = new MonetizationManager();
