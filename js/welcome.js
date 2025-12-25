// Welcome Screen Logic
// Handles all buttons and modals on the welcome screen

(function() {
  'use strict';

  // Wait for DOM to be ready
  function init() {
    console.log('Initializing welcome screen...');
    
    // Music toggle
    const music = document.getElementById("bgMusic");
    const toggle = document.getElementById("musicToggle");
    const state = document.getElementById("musicState");

    if (music && toggle && state) {
      // Default to 'on' if no setting exists
      const musicSetting = localStorage.getItem("music");
      let enabled = musicSetting === null || musicSetting === "on";

      function update() {
        if (state) {
          state.textContent = enabled ? "Bật" : "Tắt";
        }
      }

      // Remove any existing listeners
      toggle.onclick = null;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        enabled = !enabled;
        localStorage.setItem("music", enabled ? "on" : "off");
        if (enabled) {
          music.play().catch(() => {});
        } else {
          music.pause();
        }
        update();
      });

      // Try to play music, but it may fail due to browser autoplay policy
      // Will be played on first user interaction
      if (enabled) {
        music.play().catch(() => {
          console.log('Initial music play blocked by browser. Will play on user interaction.');
        });
      }
      update();
      console.log('Music toggle initialized');
      
      // Play music on any user interaction (click anywhere on page)
      const playMusicOnInteraction = () => {
        if (enabled && music.paused) {
          music.play().catch(() => {});
        }
        // Remove listener after first successful play
        document.removeEventListener('click', playMusicOnInteraction);
        document.removeEventListener('touchstart', playMusicOnInteraction);
      };
      
      // Add listeners for user interaction
      document.addEventListener('click', playMusicOnInteraction, { once: true });
      document.addEventListener('touchstart', playMusicOnInteraction, { once: true });
    } else {
      console.warn('Music elements not found');
    }

    // Leaderboard button
    const leaderboardBtn = document.getElementById("leaderboardBtn");
    const leaderboardModal = document.getElementById("leaderboardModal");
    
    if (leaderboardBtn && leaderboardModal) {
      // Remove any existing listeners
      leaderboardBtn.onclick = null;
      leaderboardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Leaderboard button clicked');
        showModal(leaderboardModal);
        loadLeaderboard();
      });
      console.log('Leaderboard button initialized');
    } else {
      console.warn('Leaderboard elements not found');
    }

    // Achievements button
    const achievementsBtn = document.getElementById("achievementsBtn");
    const achievementsModal = document.getElementById("achievementsModal");
    
    if (achievementsBtn && achievementsModal) {
      // Remove any existing listeners
      achievementsBtn.onclick = null;
      achievementsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Achievements button clicked');
        showModal(achievementsModal);
        loadAchievements();
      });
      console.log('Achievements button initialized');
    } else {
      console.warn('Achievements elements not found');
    }

    // Help button
    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    
    if (helpBtn && helpModal) {
      // Remove any existing listeners
      helpBtn.onclick = null;
      helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Help button clicked');
        showModal(helpModal);
      });
      console.log('Help button initialized');
    } else {
      console.warn('Help elements not found');
    }

    // Shop button
    const shopBtn = document.getElementById("shopBtn");
    const shopModal = document.getElementById("shopModal");
    
    if (shopBtn && shopModal) {
      // Remove any existing listeners
      shopBtn.onclick = null;
      shopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Shop button clicked');
        console.log('ShopManager available:', !!window.ShopManager);
        if (window.ShopManager) {
          console.log('ShopManager items count:', window.ShopManager.items ? window.ShopManager.items.length : 0);
          console.log('ShopManager items:', window.ShopManager.items);
        }
        showModal(shopModal);
        loadShop();
      });
      console.log('Shop button initialized');
    } else {
      console.warn('Shop elements not found');
    }

    // Close buttons for all modals
    const closeButtons = document.querySelectorAll(".close");
    closeButtons.forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modal = btn.closest(".modal");
        if (modal) {
          hideModal(modal);
        }
      });
    });

    // Close modal when clicking outside
    document.addEventListener('click', (event) => {
      const modals = document.querySelectorAll(".modal");
      modals.forEach(modal => {
        if (event.target === modal && !modal.classList.contains('hidden')) {
          hideModal(modal);
        }
      });
    });

    console.log('Welcome screen initialized successfully');
  }

  // Show modal
  function showModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  // Hide modal
  function hideModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // Load leaderboard
  function loadLeaderboard() {
    const content = document.getElementById("leaderboardContent");
    if (!content) return;

    if (window.LeaderboardManager) {
      window.LeaderboardManager.render(content);
    } else {
      content.innerHTML = "<p>Đang tải bảng xếp hạng...</p>";
      // Retry after a short delay
      setTimeout(() => {
        if (window.LeaderboardManager) {
          window.LeaderboardManager.render(content);
        } else {
          content.innerHTML = "<p>Không thể tải bảng xếp hạng. Vui lòng thử lại sau.</p>";
        }
      }, 500);
    }
  }

  // Load achievements
  function loadAchievements() {
    const content = document.getElementById("achievementsContent");
    if (!content) return;

    if (window.AchievementManager) {
      const achievements = window.AchievementManager.getAll();
      const unlockedCount = window.AchievementManager.getUnlockedCount();
      const totalCount = Object.keys(achievements).length;

      let html = `
        <div class="achievements-stats">
          <p>Thành tích đã mở khóa: <strong>${unlockedCount}/${totalCount}</strong></p>
        </div>
        <div class="achievements-list">
      `;

      for (let key in achievements) {
        const achievement = achievements[key];
        html += `
          <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
              <div class="achievement-name">${achievement.name}</div>
              <div class="achievement-desc">${achievement.description}</div>
            </div>
            <div class="achievement-status">
              ${achievement.unlocked ? '✓' : '🔒'}
            </div>
          </div>
        `;
      }

      html += '</div>';
      content.innerHTML = html;
    } else {
      content.innerHTML = "<p>Đang tải thành tích...</p>";
      // Retry after a short delay
      setTimeout(() => {
        if (window.AchievementManager) {
          loadAchievements();
        } else {
          content.innerHTML = "<p>Không thể tải thành tích. Vui lòng thử lại sau.</p>";
        }
      }, 500);
    }
  }

  // Load shop
  function loadShop() {
    const content = document.getElementById("shopContent");
    const coinsEl = document.getElementById("shopCoins");
    const starsEl = document.getElementById("shopStars");
    
    if (!content) {
      console.warn('Shop content element not found');
      return;
    }

    // Update balance
    if (window.ShopManager) {
      const balance = window.ShopManager.getBalance();
      if (coinsEl) coinsEl.textContent = balance.coins || 0;
      if (starsEl) starsEl.textContent = balance.stars || 0;
    } else {
      console.warn('ShopManager not available');
      if (coinsEl) coinsEl.textContent = '0';
      if (starsEl) starsEl.textContent = '0';
    }

    // Tab switching - remove old listeners first to avoid duplicates
    const tabs = document.querySelectorAll(".shop-tab");
    // Re-query after potential DOM changes
    const allTabs = document.querySelectorAll(".shop-tab");
    allTabs.forEach((tab, index) => {
      // Remove old listeners by cloning
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
      
      newTab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Re-query tabs to get updated list
        const currentTabs = document.querySelectorAll(".shop-tab");
        currentTabs.forEach(t => {
          if (t !== newTab) t.classList.remove('active');
        });
        newTab.classList.add('active');
        const tabType = newTab.getAttribute('data-tab');
        if (tabType) {
          renderShopItems(tabType);
        }
      });
    });

    // Initial render - ensure ShopManager is ready
    if (window.ShopManager) {
      renderShopItems('skins');
    } else {
      content.innerHTML = '<p>Đang tải cửa hàng...</p>';
      setTimeout(() => {
        if (window.ShopManager) {
          renderShopItems('skins');
        } else {
          content.innerHTML = '<p>Không thể tải cửa hàng. Vui lòng tải lại trang.</p>';
        }
      }, 500);
    }
  }

  function renderShopItems(tabType) {
    const content = document.getElementById("shopContent");
    if (!content || !window.ShopManager) {
      console.warn('Shop content or ShopManager not found');
      if (content) {
        content.innerHTML = '<p>Đang tải cửa hàng...</p>';
      }
      // Retry after a short delay
      setTimeout(() => {
        if (window.ShopManager) {
          renderShopItems(tabType);
        } else {
          if (content) {
            content.innerHTML = '<p>Không thể tải cửa hàng. Vui lòng thử lại sau.</p>';
          }
        }
      }, 500);
      return;
    }

    // Convert tab type to item type (skins -> skin, themes -> theme)
    const itemType = tabType === 'skins' ? 'skin' : (tabType === 'themes' ? 'theme' : tabType);
    console.log('Rendering shop items for type:', itemType, 'tabType:', tabType);
    
    const items = window.ShopManager.getItemsByType(itemType);
    console.log('Found items:', items ? items.length : 0, items);
    
    const balance = window.ShopManager.getBalance();
    const selectedSkin = window.ShopManager.getSelectedSkin();
    const selectedTheme = window.ShopManager.getSelectedTheme();

    if (!items || items.length === 0) {
      console.warn('No items found for type:', itemType);
      content.innerHTML = `<p>Không có item nào trong danh mục này (${itemType}).</p>`;
      return;
    }

    let html = '<div class="shop-items-grid">';
    
    for (let item of items) {
      const canAfford = window.ShopManager.canAfford(item);
      const isSelected = (itemType === 'skin' && item.id === selectedSkin) || 
                        (itemType === 'theme' && item.id === selectedTheme);
      const priceText = item.price.coins > 0 
        ? `${item.price.coins} 🪙` 
        : item.price.stars > 0 
        ? `${item.price.stars} ⭐` 
        : 'Miễn phí';

      html += `
        <div class="shop-item ${item.unlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          <div class="shop-item-price">${priceText}</div>
          ${item.unlocked 
            ? `<button class="shop-btn select-btn" data-item-id="${item.id}">${isSelected ? '✓ Đã chọn' : 'Chọn'}</button>`
            : `<button class="shop-btn buy-btn ${canAfford ? '' : 'disabled'}" data-item-id="${item.id}">${canAfford ? 'Mua' : 'Không đủ'}</button>`
          }
        </div>
      `;
    }

    html += '</div>';
    content.innerHTML = html;

    // Add event listeners
    const buyButtons = content.querySelectorAll('.buy-btn');
    buyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = btn.getAttribute('data-item-id');
        if (window.ShopManager) {
          const result = window.ShopManager.buyItem(itemId);
          if (result.success) {
            alert(result.message);
            loadShop(); // Reload shop
            // Update balance display
            const balance = window.ShopManager.getBalance();
            const coinsEl = document.getElementById("shopCoins");
            const starsEl = document.getElementById("shopStars");
            if (coinsEl) coinsEl.textContent = balance.coins;
            if (starsEl) starsEl.textContent = balance.stars;
          } else {
            alert(result.message);
          }
        }
      });
    });

    const selectButtons = content.querySelectorAll('.select-btn');
    selectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = btn.getAttribute('data-item-id');
        if (window.ShopManager) {
          if (window.ShopManager.selectItem(itemId)) {
            loadShop(); // Reload to update selected state
          }
        }
      });
    });
  }

  // Initialize when DOM is ready
  function startInit() {
    try {
      init();
    } catch (error) {
      console.error('Error initializing welcome screen:', error);
      // Retry after a delay
      setTimeout(startInit, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    // DOM already loaded, but wait a bit for other scripts
    setTimeout(startInit, 100);
  }

  // Also try to initialize after a longer delay as fallback
  setTimeout(() => {
    const leaderboardBtn = document.getElementById("leaderboardBtn");
    const achievementsBtn = document.getElementById("achievementsBtn");
    const helpBtn = document.getElementById("helpBtn");
    const musicToggle = document.getElementById("musicToggle");
    
    // Check if buttons exist but don't have handlers
    if (leaderboardBtn && !leaderboardBtn.onclick) {
      console.log('Re-initializing welcome screen...');
      startInit();
    }
  }, 500);

})();
