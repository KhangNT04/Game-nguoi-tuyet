// Utility Functions
// Helper functions cho game

(function() {
  'use strict';

  window.GameUtils = {
    // Random number between min and max
    random: function(min, max) {
      return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Clamp value between min and max
    clamp: function(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    // Linear interpolation
    lerp: function(start, end, t) {
      return start + (end - start) * t;
    },

    // Distance between two points
    distance: function(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    // AABB Collision Detection
    checkCollision: function(rect1, rect2) {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
    },

    // Circle collision detection (optimized: compare squared distances)
    checkCircleCollision: function(circle1, circle2) {
      const dx = circle2.x - circle1.x;
      const dy = circle2.y - circle1.y;
      const distSq = dx * dx + dy * dy;
      const radiusSum = circle1.radius + circle2.radius;
      return distSq < (radiusSum * radiusSum);
    },

    // Format time in seconds to MM:SS
    formatTime: function(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Format number with commas
    formatNumber: function(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Create particle effect
    createParticles: function(x, y, count, color, particleSystem, life = 30) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = this.random(2, 5);
        particleSystem.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: this.random(2, 4),
          life: life,
          maxLife: life,
          color: color || '#ffffff',
          alpha: 1
        });
      }
    },

    // Object pool for reusing objects
    createObjectPool: function(createFn, resetFn, initialSize = 10) {
      const pool = [];
      
      for (let i = 0; i < initialSize; i++) {
        pool.push(createFn());
      }

      return {
        get: function() {
          if (pool.length > 0) {
            return pool.pop();
          }
          return createFn();
        },
        release: function(obj) {
          resetFn(obj);
          pool.push(obj);
        },
        size: function() {
          return pool.length;
        }
      };
    },

    // Ease functions for animations
    easeInOutQuad: function(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeOutBounce: function(t) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    }
  };

})();

