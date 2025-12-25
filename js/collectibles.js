// Collectibles System
// Quản lý coins, stars và collectibles khác

(function() {
  'use strict';

  window.CollectibleManager = {
    collectibles: [],
    totalCoins: 0,
    totalStars: 0,
    pendingSave: false,
    saveTimeout: null,

    // Initialize
    init: function() {
      // Load saved stats with validation
      try {
        const savedCoins = localStorage.getItem('totalCoins');
        const savedStars = localStorage.getItem('totalStars');
        
        if (savedCoins) {
          const coins = parseInt(savedCoins, 10);
          this.totalCoins = isFinite(coins) && coins >= 0 ? coins : 0;
        }
        if (savedStars) {
          const stars = parseInt(savedStars, 10);
          this.totalStars = isFinite(stars) && stars >= 0 ? stars : 0;
        }
      } catch (e) {
        console.warn('Error loading collectibles stats:', e);
        this.totalCoins = 0;
        this.totalStars = 0;
      }
    },
    
    // Debounced save to reduce localStorage writes
    debouncedSave: function() {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        if (this.pendingSave) {
          try {
            // Validate values before saving
            const coins = isFinite(this.totalCoins) && this.totalCoins >= 0 ? this.totalCoins : 0;
            const stars = isFinite(this.totalStars) && this.totalStars >= 0 ? this.totalStars : 0;
            localStorage.setItem('totalCoins', coins.toString());
            localStorage.setItem('totalStars', stars.toString());
            this.pendingSave = false;
          } catch (e) {
            console.warn('Failed to save collectibles stats:', e);
            this.pendingSave = false; // Clear flag even on error
          }
        }
      }, 500); // Save after 500ms of inactivity
    },

    // Create a collectible
    create: function(x, y, type = 'coin') {
      const collectible = {
        x: x,
        y: y,
        type: type, // 'coin', 'star', 'powerup-shield', etc.
        width: type === 'star' ? 25 : type.startsWith('powerup') ? 30 : 20,
        height: type === 'star' ? 25 : type.startsWith('powerup') ? 30 : 20,
        rotation: 0,
        collected: false,
        animationOffset: Math.random() * Math.PI * 2,
        bobSpeed: 0.05,
        bobAmount: 5,
        powerUpType: type.startsWith('powerup-') ? type.replace('powerup-', '') : null,
        // Animation states
        animationTime: 0,
        pulse: 0,
        glowIntensity: 0
      };

      this.collectibles.push(collectible);
      return collectible;
    },

    // Update collectibles
    update: function(deltaTime, player, hasMagnet = false, baseSpeed = null, timeScale = 1) {
      const magnetRadius = 150; // Magnet power-up radius
      const collectRadius = 25; // Collection radius
      const collectRadiusSq = collectRadius * collectRadius;
      const magnetRadiusSq = magnetRadius * magnetRadius;
      
      // Calculate fall speed based on obstacle speed (same as obstacles)
      // Synchronized speed with obstacles for consistent gameplay
      // If baseSpeed is provided, use it; otherwise use default
      let FALL_SPEED;
      if (baseSpeed !== null) {
        FALL_SPEED = baseSpeed * 1.0; // 100% of obstacle speed - same as obstacles
      } else {
        // Fallback: calculate based on level if available
        // This is a rough estimate, better to pass baseSpeed from game.js
        FALL_SPEED = 1.5; // Default speed matching obstacles
      }
      
      const MAGNET_PULL_SPEED = 8; // Magnet pull speed multiplier

      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const item = this.collectibles[i];

        if (item.collected) {
          this.collectibles.splice(i, 1);
          continue;
        }

        // Update animation
        item.animationTime += deltaTime;
        item.rotation += deltaTime * 0.05;
        // Pulse animation
        item.pulse = Math.sin(item.animationTime * 4) * 0.1 + 1; // Pulse between 0.9 and 1.1
        // Glow intensity animation
        item.glowIntensity = (Math.sin(item.animationTime * 3) + 1) / 2; // 0 to 1
        // Fall at same speed as obstacles (synchronized, with timeScale for slow motion)
        item.y += FALL_SPEED * deltaTime * 60 * timeScale; // Fall down (multiply by 60 to match obstacle speed calculation)

        // Magnet effect
        if (hasMagnet && player) {
          const dx = player.x - item.x;
          const dy = player.y - item.y;
          const distSq = dx * dx + dy * dy;

          // Use squared distance comparison to avoid Math.sqrt
          if (distSq < magnetRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const pullStrength = (magnetRadius - dist) / magnetRadius;
            item.x += (dx / dist) * pullStrength * MAGNET_PULL_SPEED * deltaTime;
            item.y += (dy / dist) * pullStrength * MAGNET_PULL_SPEED * deltaTime;
          }
        }

        // Collection is now handled in game.js before this update
        // This prevents double collection and ensures proper score calculation
        // Just mark as collected if not already marked
        if (player && !item.collected) {
          const dx = player.x - item.x;
          const dy = player.y - item.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < collectRadiusSq) {
            // Mark as collected - game.js will handle scoring
            this.collect(item);
            item.collected = true;
          }
        }

        // Remove if off screen (use a reasonable off-screen threshold)
        if (item.y > 800) { // Canvas height + buffer
          this.collectibles.splice(i, 1);
        }
      }
    },

    // Collect an item
    collect: function(item) {
      if (window.AudioManager) {
        window.AudioManager.playSFX('collect', 0.8);
      }

      if (item.type === 'coin') {
        this.totalCoins++;
        this.pendingSave = true;
        this.debouncedSave();
      } else if (item.type === 'star') {
        this.totalStars++;
        this.pendingSave = true;
        this.debouncedSave();
      }
      // Power-ups are handled in game.js activatePowerUp function
    },

    // Draw collectibles
    draw: function(ctx) {
      for (let item of this.collectibles) {
        if (item.collected) continue;

        ctx.save();
        ctx.translate(item.x, item.y);
        
        // Bob animation
        const bobY = Math.sin(item.rotation * item.bobSpeed + item.animationOffset) * item.bobAmount;
        ctx.translate(0, bobY);
        
        ctx.rotate(item.rotation);

        if (item.type === 'coin') {
          this.drawCoin(ctx, item);
        } else if (item.type === 'star') {
          this.drawStar(ctx, item);
        } else if (item.type.startsWith('powerup')) {
          this.drawPowerUp(ctx, item);
        }

        ctx.restore();
      }
    },

    // Draw coin
    drawCoin: function(ctx, item) {
      const size = item.width / 2 * (item.pulse || 1);
      
      // Glow effect
      const glowAlpha = (item.glowIntensity || 0) * 0.3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`;
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(0.8, '#ffb700');
      gradient.addColorStop(1, '#ff9500');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff9500';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner shine with animation
      const shineAlpha = 0.5 + (item.glowIntensity || 0) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${shineAlpha})`;
      ctx.beginPath();
      ctx.arc(-size / 3, -size / 3, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle particles
      if (item.animationTime && Math.random() < 0.1) {
        const sparkleAngle = Math.random() * Math.PI * 2;
        const sparkleDist = size * 0.8;
        const sparkleX = Math.cos(sparkleAngle) * sparkleDist;
        const sparkleY = Math.sin(sparkleAngle) * sparkleDist;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // Draw star
    drawStar: function(ctx, item) {
      const spikes = 5;
      const baseOuterRadius = item.width / 2;
      const baseInnerRadius = baseOuterRadius * 0.4;
      const pulse = item.pulse || 1;
      const outerRadius = baseOuterRadius * pulse;
      const innerRadius = baseInnerRadius * pulse;

      // Glow effect
      const glowAlpha = (item.glowIntensity || 0) * 0.4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`;
      
      // Rotating glow ring
      const glowRadius = outerRadius * 1.3;
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha * 0.5})`);
      glowGradient.addColorStop(0.7, `rgba(255, 215, 0, ${glowAlpha * 0.2})`);
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Twinkle effect - small sparkles
      if (item.animationTime && Math.random() < 0.15) {
        for (let i = 0; i < 3; i++) {
          const sparkleAngle = Math.random() * Math.PI * 2;
          const sparkleDist = outerRadius * (0.5 + Math.random() * 0.5);
          const sparkleX = Math.cos(sparkleAngle) * sparkleDist;
          const sparkleY = Math.sin(sparkleAngle) * sparkleDist;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },

    // Draw power-up
    drawPowerUp: function(ctx, item) {
      const powerUpIcons = {
        'shield': '🛡️',
        'speedBoost': '⚡',
        'scoreMultiplier': '⭐',
        'slowMotion': '⏱️',
        'magnet': '🧲'
      };
      
      const powerUpColors = {
        'shield': '#2196F3',
        'speedBoost': '#FF9800',
        'scoreMultiplier': '#9C27B0',
        'slowMotion': '#00BCD4',
        'magnet': '#F44336'
      };
      
      const icon = powerUpIcons[item.powerUpType] || '✨';
      const color = powerUpColors[item.powerUpType] || '#ffffff';
      const pulse = item.pulse || 1;
      const size = item.width / 2 * pulse;
      
      // Pulsing glow ring
      const glowAlpha = (item.glowIntensity || 0) * 0.5;
      const ringRadius = size * 1.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = glowAlpha;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Background circle with gradient
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.8, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow effect
      ctx.shadowBlur = 15 + (item.glowIntensity || 0) * 10;
      ctx.shadowColor = color;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + glowAlpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, size - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Icon (text) with rotation
      ctx.save();
      ctx.rotate(item.rotation * 0.5); // Slow rotation
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 0);
      ctx.restore();
    },

    // Clear all collectibles
    clear: function() {
      this.collectibles = [];
      // Save any pending changes before clearing
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      if (this.pendingSave) {
        localStorage.setItem('totalCoins', this.totalCoins.toString());
        localStorage.setItem('totalStars', this.totalStars.toString());
        this.pendingSave = false;
      }
    },

    // Get stats
    getStats: function() {
      return {
        totalCoins: this.totalCoins,
        totalStars: this.totalStars
      };
    }
  };

  // Initialize on load
  CollectibleManager.init();

})();

