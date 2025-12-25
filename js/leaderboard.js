// Leaderboard System
// Quản lý leaderboard và statistics

(function() {
  'use strict';

  window.LeaderboardManager = {
    maxEntries: 10,
    entries: [],

    // Initialize - load leaderboard
    init: function() {
      const saved = localStorage.getItem('leaderboard');
      if (saved) {
        try {
          this.entries = JSON.parse(saved);
        } catch (e) {
          console.log('Error loading leaderboard:', e);
          this.entries = [];
        }
      }
    },

    // Add a new score entry
    addEntry: function(score, gameTime = 0, coins = 0, date = null) {
      const entry = {
        score: score,
        gameTime: gameTime,
        coins: coins,
        date: date || new Date().toISOString(),
        timestamp: Date.now()
      };

      this.entries.push(entry);
      this.entries.sort((a, b) => b.score - a.score);
      
      // Keep only top entries
      if (this.entries.length > this.maxEntries) {
        this.entries = this.entries.slice(0, this.maxEntries);
      }

      this.save();
    },

    // Get top scores
    getTopScores: function(limit = 10) {
      return this.entries.slice(0, limit);
    },

    // Get best score
    getBestScore: function() {
      if (this.entries.length === 0) return 0;
      return this.entries[0].score;
    },

    // Get statistics
    getStats: function() {
      const stats = {
        bestScore: this.getBestScore(),
        totalGames: parseInt(localStorage.getItem('totalGames') || '0', 10),
        totalPlayTime: parseInt(localStorage.getItem('totalPlayTime') || '0', 10),
        totalCoins: parseInt(localStorage.getItem('totalCoins') || '0', 10)
      };

      return stats;
    },

    // Update statistics
    updateStats: function(gameTime, coins) {
      try {
        // Validate inputs
        gameTime = isFinite(gameTime) ? Math.max(0, gameTime) : 0;
        
        const totalGames = parseInt(localStorage.getItem('totalGames') || '0', 10);
        const totalPlayTime = parseInt(localStorage.getItem('totalPlayTime') || '0', 10);
        
        const newTotalGames = isFinite(totalGames) ? totalGames + 1 : 1;
        const newTotalPlayTime = isFinite(totalPlayTime) ? totalPlayTime + gameTime : gameTime;

        localStorage.setItem('totalGames', newTotalGames.toString());
        localStorage.setItem('totalPlayTime', Math.floor(newTotalPlayTime).toString());
      } catch (e) {
        console.warn('Failed to update statistics:', e);
      }
    },

    // Save leaderboard to localStorage
    save: function() {
      try {
        localStorage.setItem('leaderboard', JSON.stringify(this.entries));
      } catch (e) {
        // Handle quota exceeded or other storage errors
        console.warn('Failed to save leaderboard:', e);
        // Optionally try to clear old entries and retry
        if (this.entries.length > 5) {
          this.entries = this.entries.slice(0, 5);
          try {
            localStorage.setItem('leaderboard', JSON.stringify(this.entries));
          } catch (e2) {
            console.warn('Retry save also failed:', e2);
          }
        }
      }
    },

    // Format date for display
    formatDate: function(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    },

    // Render leaderboard HTML
    render: function(container) {
      if (!container) return;

      const topScores = this.getTopScores(10);
      const stats = this.getStats();

      let html = `
        <div class="leaderboard-header">
          <h3>🏆 Bảng Xếp Hạng</h3>
        </div>
        <div class="leaderboard-stats">
          <div class="stat-item">
            <span class="stat-label">Điểm cao nhất:</span>
            <span class="stat-value">${this.formatNumber(stats.bestScore)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tổng số game:</span>
            <span class="stat-value">${this.formatNumber(stats.totalGames)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Tổng thời gian:</span>
            <span class="stat-value">${this.formatTime(stats.totalPlayTime)}</span>
          </div>
        </div>
        <div class="leaderboard-list">
      `;

      if (topScores.length === 0) {
        html += '<div class="leaderboard-empty">Chưa có điểm số nào</div>';
      } else {
        topScores.forEach((entry, index) => {
          html += `
            <div class="leaderboard-entry">
              <div class="entry-rank">#${index + 1}</div>
              <div class="entry-details">
                <div class="entry-score">${this.formatNumber(entry.score)} điểm</div>
                <div class="entry-meta">
                  ${this.formatTime(entry.gameTime)} • ${entry.coins} 🪙 • ${this.formatDate(entry.date)}
                </div>
              </div>
            </div>
          `;
        });
      }

      html += '</div>';
      container.innerHTML = html;
    },

    // Format number
    formatNumber: function(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Format time
    formatTime: function(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    // Clear leaderboard
    clear: function() {
      this.entries = [];
      this.save();
    }
  };

  // Initialize on load
  LeaderboardManager.init();

})();

