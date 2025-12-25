// Shop System
// Quản lý shop để mua skins và themes bằng coins/stars

(function() {
  'use strict';

  window.ShopManager = {
    // Selected skin and theme
    selectedSkin: 'default-snowman',
    selectedTheme: 'default-winter',
    
    // Shop items definition
    items: [
      // Skins
      {
        id: 'default-snowman',
        name: 'Snowman Mặc Định',
        type: 'skin',
        price: { coins: 0, stars: 0 },
        unlocked: true, // Default is free
        description: 'Snowman cổ điển',
        icon: '⛄'
      },
      {
        id: 'santa-snowman',
        name: 'Santa Snowman',
        type: 'skin',
        price: { coins: 100, stars: 0 },
        unlocked: false,
        description: 'Snowman với áo Santa đỏ',
        icon: '🎅'
      },
      {
        id: 'elf-snowman',
        name: 'Elf Snowman',
        type: 'skin',
        price: { coins: 150, stars: 0 },
        unlocked: false,
        description: 'Snowman với mũ xanh và tai nhọn',
        icon: '🧝'
      },
      {
        id: 'golden-snowman',
        name: 'Golden Snowman',
        type: 'skin',
        price: { coins: 0, stars: 50 },
        unlocked: false,
        description: 'Snowman vàng phát sáng',
        icon: '✨'
      },
      {
        id: 'ice-snowman',
        name: 'Ice Snowman',
        type: 'skin',
        price: { coins: 0, stars: 30 },
        unlocked: false,
        description: 'Snowman trong suốt với hiệu ứng băng',
        icon: '🧊'
      },
      {
        id: 'reindeer-snowman',
        name: 'Reindeer Snowman',
        type: 'skin',
        price: { coins: 120, stars: 0 },
        unlocked: false,
        description: 'Snowman với sừng nai và mũ đỏ',
        icon: '🦌'
      },
      {
        id: 'gingerbread-snowman',
        name: 'Gingerbread Snowman',
        type: 'skin',
        price: { coins: 80, stars: 0 },
        unlocked: false,
        description: 'Snowman bánh gừng với trang trí kẹo',
        icon: '🍪'
      },
      {
        id: 'christmas-tree-snowman',
        name: 'Christmas Tree Snowman',
        type: 'skin',
        price: { coins: 200, stars: 0 },
        unlocked: false,
        description: 'Snowman trang trí như cây thông Giáng Sinh',
        icon: '🎄'
      },
      {
        id: 'snowflake-snowman',
        name: 'Snowflake Snowman',
        type: 'skin',
        price: { coins: 0, stars: 40 },
        unlocked: false,
        description: 'Snowman màu xanh băng với hoa tuyết',
        icon: '❄️'
      },
      {
        id: 'candy-cane-snowman',
        name: 'Candy Cane Snowman',
        type: 'skin',
        price: { coins: 0, stars: 60 },
        unlocked: false,
        description: 'Snowman sọc đỏ trắng như kẹo gậy',
        icon: '🍭'
      },
      {
        id: 'lucky-snowman',
        name: 'Lucky Snowman',
        type: 'skin',
        price: { coins: 150, stars: 0 },
        unlocked: false,
        description: 'Snowman may mắn với màu đỏ vàng và bao lì xì',
        icon: '🧧'
      },
      {
        id: 'dragon-snowman',
        name: 'Dragon Snowman',
        type: 'skin',
        price: { coins: 0, stars: 100 },
        unlocked: false,
        description: 'Snowman rồng với màu đỏ vàng và râu rồng',
        icon: '🐉'
      },
      {
        id: 'lantern-snowman',
        name: 'Lantern Snowman',
        type: 'skin',
        price: { coins: 90, stars: 0 },
        unlocked: false,
        description: 'Snowman với đèn lồng đỏ và ánh sáng vàng',
        icon: '🏮'
      },
      {
        id: 'firework-snowman',
        name: 'Firework Snowman',
        type: 'skin',
        price: { coins: 0, stars: 70 },
        unlocked: false,
        description: 'Snowman pháo hoa với nhiều màu sắc sáng chói',
        icon: '🎆'
      },
      {
        id: 'peach-blossom-snowman',
        name: 'Peach Blossom Snowman',
        type: 'skin',
        price: { coins: 50, stars: 0 },
        unlocked: false,
        description: 'Snowman hoa đào với màu hồng và cánh hoa',
        icon: '🌸'
      },
      // Themes
      {
        id: 'default-winter',
        name: 'Mùa Đông Mặc Định',
        type: 'theme',
        price: { coins: 0, stars: 0 },
        unlocked: true, // Default is free
        description: 'Nền mùa đông cổ điển',
        icon: '❄️'
      },
      {
        id: 'night-sky',
        name: 'Bầu Trời Đêm',
        type: 'theme',
        price: { coins: 80, stars: 0 },
        unlocked: false,
        description: 'Nền đêm với sao',
        icon: '🌃'
      },
      {
        id: 'aurora',
        name: 'Cực Quang',
        type: 'theme',
        price: { coins: 0, stars: 100 },
        unlocked: false,
        description: 'Cực quang màu xanh lá',
        icon: '🌌'
      },
      {
        id: 'sunset',
        name: 'Hoàng Hôn',
        type: 'theme',
        price: { coins: 60, stars: 0 },
        unlocked: false,
        description: 'Hoàng hôn màu cam đỏ',
        icon: '🌅'
      },
      {
        id: 'storm',
        name: 'Bão Tuyết',
        type: 'theme',
        price: { coins: 0, stars: 40 },
        unlocked: false,
        description: 'Bão tuyết tối',
        icon: '🌨️'
      },
      {
        id: 'christmas-village',
        name: 'Làng Giáng Sinh',
        type: 'theme',
        price: { coins: 120, stars: 0 },
        unlocked: false,
        description: 'Làng Giáng Sinh với nhà tuyết và đèn',
        icon: '🏘️'
      },
      {
        id: 'northern-lights',
        name: 'Cực Quang Bắc Cực',
        type: 'theme',
        price: { coins: 0, stars: 80 },
        unlocked: false,
        description: 'Cực quang xanh lá với hiệu ứng động',
        icon: '🌌'
      },
      {
        id: 'snowy-forest',
        name: 'Rừng Tuyết',
        type: 'theme',
        price: { coins: 100, stars: 0 },
        unlocked: false,
        description: 'Rừng tuyết với cây thông và tuyết rơi dày',
        icon: '🌲'
      },
      {
        id: 'starry-night',
        name: 'Đêm Sao',
        type: 'theme',
        price: { coins: 0, stars: 60 },
        unlocked: false,
        description: 'Đêm sao với trăng và sao lấp lánh',
        icon: '🌙'
      },
      {
        id: 'tet-festival',
        name: 'Lễ Hội Tết',
        type: 'theme',
        price: { coins: 150, stars: 0 },
        unlocked: false,
        description: 'Lễ hội Tết với pháo hoa, đèn lồng, màu đỏ vàng',
        icon: '🎊'
      },
      {
        id: 'spring-garden',
        name: 'Vườn Xuân',
        type: 'theme',
        price: { coins: 90, stars: 0 },
        unlocked: false,
        description: 'Vườn xuân với hoa đào và màu hồng xanh lá',
        icon: '🌺'
      },
      {
        id: 'lucky-red',
        name: 'Đỏ May Mắn',
        type: 'theme',
        price: { coins: 0, stars: 70 },
        unlocked: false,
        description: 'Nền đỏ may mắn với vàng và chữ phúc',
        icon: '🔴'
      },
      {
        id: 'dragon-dance',
        name: 'Múa Rồng',
        type: 'theme',
        price: { coins: 0, stars: 100 },
        unlocked: false,
        description: 'Múa rồng với nhiều màu sắc động và rồng',
        icon: '🐲'
      },
      {
        id: 'peach-blossom-sky',
        name: 'Bầu Trời Hoa Đào',
        type: 'theme',
        price: { coins: 80, stars: 0 },
        unlocked: false,
        description: 'Bầu trời hoa đào với màu hồng nhạt và xanh lá',
        icon: '🌸'
      }
    ],

    // Initialize shop
    init: function() {
      // Load unlock status from localStorage
      try {
        const savedUnlocks = localStorage.getItem('shopUnlocks');
        if (savedUnlocks) {
          const unlocks = JSON.parse(savedUnlocks);
          // Apply unlocks to items
          for (let item of this.items) {
            if (unlocks[item.id]) {
              item.unlocked = true;
            }
          }
        }
        
        // Load selected skin/theme
        const selectedSkin = localStorage.getItem('selectedSkin');
        const selectedTheme = localStorage.getItem('selectedTheme');
        if (selectedSkin) {
          this.selectedSkin = selectedSkin;
        }
        if (selectedTheme) {
          this.selectedTheme = selectedTheme;
        }
      } catch (e) {
        console.warn('Error loading shop data:', e);
      }
    },

    // Get balance from CollectibleManager
    getBalance: function() {
      if (!window.CollectibleManager) {
        return { coins: 0, stars: 0 };
      }
      return {
        coins: window.CollectibleManager.totalCoins || 0,
        stars: window.CollectibleManager.totalStars || 0
      };
    },

    // Check if can afford item
    canAfford: function(item) {
      const balance = this.getBalance();
      if (item.price.coins > 0) {
        return balance.coins >= item.price.coins;
      }
      if (item.price.stars > 0) {
        return balance.stars >= item.price.stars;
      }
      return true; // Free item
    },

    // Buy item
    buyItem: function(itemId) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        return { success: false, message: 'Item không tồn tại' };
      }
      
      if (item.unlocked) {
        return { success: false, message: 'Item đã được mở khóa' };
      }
      
      if (!this.canAfford(item)) {
        return { success: false, message: 'Không đủ coins/stars' };
      }
      
      // Deduct price
      if (item.price.coins > 0 && window.CollectibleManager) {
        window.CollectibleManager.totalCoins -= item.price.coins;
        window.CollectibleManager.pendingSave = true;
        window.CollectibleManager.debouncedSave();
      }
      if (item.price.stars > 0 && window.CollectibleManager) {
        window.CollectibleManager.totalStars -= item.price.stars;
        window.CollectibleManager.pendingSave = true;
        window.CollectibleManager.debouncedSave();
      }
      
      // Unlock item
      item.unlocked = true;
      this.saveUnlocks();
      
      return { success: true, message: 'Mua thành công!' };
    },

    // Select skin/theme
    selectItem: function(itemId) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        return false;
      }
      
      if (!item.unlocked) {
        return false;
      }
      
      if (item.type === 'skin') {
        this.selectedSkin = itemId;
        localStorage.setItem('selectedSkin', itemId);
      } else if (item.type === 'theme') {
        this.selectedTheme = itemId;
        localStorage.setItem('selectedTheme', itemId);
      }
      
      return true;
    },

    // Get selected skin/theme
    getSelectedSkin: function() {
      return this.selectedSkin || 'default-snowman';
    },

    getSelectedTheme: function() {
      return this.selectedTheme || 'default-winter';
    },

    // Get items by type
    getItemsByType: function(type) {
      if (!this.items || !Array.isArray(this.items)) {
        console.warn('ShopManager.items is not an array:', this.items);
        return [];
      }
      const filtered = this.items.filter(item => item && item.type === type);
      console.log(`getItemsByType(${type}): found ${filtered.length} items out of ${this.items.length} total`);
      return filtered;
    },
    
    // Get all items (for debugging)
    getAllItems: function() {
      return this.items || [];
    },

    // Save unlocks to localStorage
    saveUnlocks: function() {
      try {
        const unlocks = {};
        for (let item of this.items) {
          if (item.unlocked) {
            unlocks[item.id] = true;
          }
        }
        localStorage.setItem('shopUnlocks', JSON.stringify(unlocks));
      } catch (e) {
        console.warn('Error saving shop unlocks:', e);
      }
    },

    // Get item by id
    getItem: function(itemId) {
      return this.items.find(item => item.id === itemId);
    }
  };

  // Initialize on load
  ShopManager.init();

})();

