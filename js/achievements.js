// Achievements System
// Quản lý achievements và thông báo

(function() {
  'use strict';

  window.AchievementManager = {
    achievements: {
      FIRST_STEPS: {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Chơi game đầu tiên',
        icon: '🎮',
        unlocked: false
      },
      SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Đạt tốc độ tối đa',
        icon: '⚡',
        unlocked: false
      },
      COIN_COLLECTOR: {
        id: 'coin_collector',
        name: 'Coin Collector',
        description: 'Thu thập 100 coins',
        icon: '🪙',
        unlocked: false
      },
      COMBO_MASTER: {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Đạt combo 10+',
        icon: '🔥',
        unlocked: false
      },
      SURVIVOR: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Sống sót 2 phút',
        icon: '⏱️',
        unlocked: false
      },
      PERFECT_RUN: {
        id: 'perfect_run',
        name: 'Perfect Run',
        description: 'Tránh tất cả chướng ngại vật trong 1 phút',
        icon: '⭐',
        unlocked: false
      }
    },

    // Initialize - load unlocked achievements
    init: function() {
      const saved = localStorage.getItem('achievements');
      if (saved) {
        try {
          const unlocked = JSON.parse(saved);
          for (let id in unlocked) {
            if (this.achievements[id] && unlocked[id]) {
              this.achievements[id].unlocked = true;
            }
          }
        } catch (e) {
          console.log('Error loading achievements:', e);
        }
      }
    },

    // Unlock an achievement
    unlock: function(achievementId) {
      const achievement = this.achievements[achievementId];
      if (!achievement || achievement.unlocked) return false;

      achievement.unlocked = true;
      this.save();
      this.showNotification(achievement);
      
      if (window.AudioManager) {
        window.AudioManager.playSFX('levelup', 1);
      }

      return true;
    },

    // Show achievement notification
    showNotification: function(achievement) {
      const notification = document.createElement('div');
      notification.className = 'achievement-notification';
      notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
          <div class="achievement-title">Achievement Unlocked!</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-desc">${achievement.description}</div>
        </div>
      `;

      document.body.appendChild(notification);

      // Trigger animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);

      // Remove after animation
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }, 3000);
    },

    // Check and unlock achievements based on game stats
    checkAchievements: function(stats) {
      // First Steps - always check if playing
      if (stats.hasPlayed && !this.achievements.FIRST_STEPS.unlocked) {
        this.unlock('FIRST_STEPS');
      }

      // Speed Demon - max speed reached
      if (stats.maxSpeed >= 4 && !this.achievements.SPEED_DEMON.unlocked) {
        this.unlock('SPEED_DEMON');
      }

      // Coin Collector - 100 coins
      if (stats.totalCoins >= 100 && !this.achievements.COIN_COLLECTOR.unlocked) {
        this.unlock('COIN_COLLECTOR');
      }

      // Combo Master - combo 10+
      if (stats.maxCombo >= 10 && !this.achievements.COMBO_MASTER.unlocked) {
        this.unlock('COMBO_MASTER');
      }

      // Survivor - survive 2 minutes
      if (stats.gameTime >= 120 && !this.achievements.SURVIVOR.unlocked) {
        this.unlock('SURVIVOR');
      }

      // Perfect Run - no collisions for 1 minute
      if (stats.perfectRunTime >= 60 && !this.achievements.PERFECT_RUN.unlocked) {
        this.unlock('PERFECT_RUN');
      }
    },

    // Save achievements to localStorage
    save: function() {
      const unlocked = {};
      for (let id in this.achievements) {
        unlocked[id] = this.achievements[id].unlocked;
      }
      localStorage.setItem('achievements', JSON.stringify(unlocked));
    },

    // Get all achievements
    getAll: function() {
      return this.achievements;
    },

    // Get unlocked count
    getUnlockedCount: function() {
      let count = 0;
      for (let id in this.achievements) {
        if (this.achievements[id].unlocked) count++;
      }
      return count;
    }
  };

  // Initialize on load
  AchievementManager.init();

})();


