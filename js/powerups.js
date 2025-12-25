// Power-ups System
// Quản lý power-ups trong game

(function() {
  'use strict';

  window.PowerUpManager = {
    activePowerUps: {},
    powerUpTypes: {
      SHIELD: 'shield',
      SPEED_BOOST: 'speedBoost',
      SCORE_MULTIPLIER: 'scoreMultiplier',
      SLOW_MOTION: 'slowMotion',
      MAGNET: 'magnet'
    },

    // Activate a power-up
    activate: function(type, duration = 10000) {
      this.activePowerUps[type] = {
        startTime: Date.now(),
        duration: duration,
        active: true
      };

      // Trigger audio
      if (window.AudioManager) {
        window.AudioManager.playSFX('powerup', 1);
      }
    },

    // Deactivate a power-up
    deactivate: function(type) {
      delete this.activePowerUps[type];
    },

    // Check if a power-up is active
    isActive: function(type) {
      const powerUp = this.activePowerUps[type];
      if (!powerUp) return false;

      // Check if expired
      const elapsed = Date.now() - powerUp.startTime;
      if (elapsed >= powerUp.duration) {
        this.deactivate(type);
        return false;
      }

      return true;
    },

    // Get remaining time for a power-up (0-1)
    getRemainingTime: function(type) {
      const powerUp = this.activePowerUps[type];
      if (!powerUp) return 0;

      const elapsed = Date.now() - powerUp.startTime;
      const remaining = Math.max(0, 1 - (elapsed / powerUp.duration));
      
      if (remaining <= 0) {
        this.deactivate(type);
        return 0;
      }

      return remaining;
    },

    // Get active power-ups list
    getActiveList: function() {
      const active = [];
      for (let type in this.activePowerUps) {
        if (this.isActive(type)) {
          active.push(type);
        }
      }
      return active;
    },

    // Update all power-ups (check expiration)
    update: function() {
      for (let type in this.activePowerUps) {
        this.isActive(type); // This will auto-deactivate expired ones
      }
    },

    // Clear all power-ups
    clear: function() {
      this.activePowerUps = {};
    },

    // Get power-up effects
    getEffects: function() {
      return {
        hasShield: this.isActive(this.powerUpTypes.SHIELD),
        speedMultiplier: this.isActive(this.powerUpTypes.SPEED_BOOST) ? 1.5 : 1,
        scoreMultiplier: this.isActive(this.powerUpTypes.SCORE_MULTIPLIER) ? 2 : 1,
        timeScale: this.isActive(this.powerUpTypes.SLOW_MOTION) ? 0.6 : 1,
        hasMagnet: this.isActive(this.powerUpTypes.MAGNET)
      };
    }
  };

})();

