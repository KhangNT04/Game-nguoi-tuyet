// Game Main Logic
// Complete game implementation with all systems integrated

(function() {
  'use strict';

  // Game Constants
  const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
  };

  const OBSTACLE_TYPES = {
    TREE: 'tree',
    ROCK: 'rock',
    SNOWMAN: 'snowman'
  };

  // Game Variables - will be initialized after DOM loads
  let canvas = null;
  let ctx = null;
  
  // Set canvas size - optimized for both desktop and mobile
  function resizeCanvas() {
    if (!canvas) return;
    const maxWidth = 500;
    const maxHeight = 800;
    const aspectRatio = maxWidth / maxHeight;
    
    // Use proper viewport dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Use visual viewport for mobile if available (handles keyboard)
    if (window.visualViewport) {
      width = window.visualViewport.width;
      height = window.visualViewport.height;
    }
    
    // For mobile, use full screen
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: full screen
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    } else {
      // Desktop: maintain aspect ratio
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
      
      canvas.width = Math.min(width, maxWidth);
      canvas.height = Math.min(height, maxHeight);
      canvas.style.width = canvas.width + 'px';
      canvas.style.height = canvas.height + 'px';
    }
    
    // Reinitialize player position after resize
    if (player.x === 0 && player.y === 0) {
      initPlayer();
    } else {
      // Adjust player position proportionally
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      // This will be set on next frame, but we can adjust here if needed
    }
  }
  
  // Initialize canvas after DOM is ready
  function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Canvas element not found!');
      return false;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context!');
      return false;
    }
    
    resizeCanvas();
    
    // Debounced resize handler for better performance
    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 100);
    }
    
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        resizeCanvas();
      }, 100);
    });
    
    return true;
  }

  let gameState = GAME_STATES.PLAYING;
  let lastTime = 0;
  let deltaTime = 0;
  
  // Shop integration
  let currentSkin = 'default-snowman';
  let currentTheme = 'default-winter';
  
  // Player
  let player = {
    x: 0,
    y: 0,
    width: 40,
    height: 50,
    targetX: 0,
    speed: 0.15,
    lives: 1,
    // Animation states
    animationTime: 0,
    tilt: 0, // Tilt when moving
    bounce: 0, // Bounce animation
    idleBlink: 0, // Eye blink animation
    isMoving: false,
    lastMoveDirection: 0, // -1 left, 1 right, 0 none
    shake: 0 // Shake when hit
  };

  // Game Stats
  let gameStats = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    level: 1,
    gameTime: 0,
    perfectRunTime: 0,
    lastObstacleTime: 0,
    hasPlayed: true,
    maxSpeed: 0,
    totalCoins: 0
  };

  // Obstacles
let obstacles = [];
  let obstacleSpawnTimer = 0;
  let obstacleSpawnInterval = 2500; // milliseconds (increased for lower density)
  let lastObstacleX = -1; // Track last obstacle position to avoid clustering
  let minObstacleGap = 100; // Minimum gap between obstacles (increased for more space)

  // Collectibles
  let collectibleSpawnTimer = 0;
  let collectibleSpawnInterval = 1200; // milliseconds (continuous spawn)
  let lastCollectibleX = -1; // Track last collectible position (for reference only)
  let lastCollectibleTime = 0; // Track last collectible spawn time

  // Particles
  let particles = [];
  
  // Click indicator
  let clickIndicator = null;

  // Input
  let keys = {};
  let touchStartX = 0;
  let touchStartY = 0;
  let touchSensitivity = 1.2;

  // Initialize player position
  function initPlayer() {
    if (!canvas) return;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.targetX = player.x;
  }

  // Initialize game
  function init() {
    // Load selected skin and theme from shop
    if (window.ShopManager) {
      currentSkin = window.ShopManager.getSelectedSkin();
      currentTheme = window.ShopManager.getSelectedTheme();
    }
    
    initPlayer();
    initBackground();
    obstacles = [];
    particles = [];
    clickIndicator = null;
    gameStats.score = 0;
    gameStats.combo = 0;
    gameStats.level = 1;
    gameStats.gameTime = 0;
    gameStats.perfectRunTime = 0;
    gameStats.lastObstacleTime = 0;
    gameStats.maxCombo = 0;
    gameStats.maxSpeed = 0;
    obstacleSpawnTimer = 0;
    obstacleSpawnInterval = 2500;
    
    // Clear managers
    if (window.CollectibleManager) {
      window.CollectibleManager.clear();
    }
    if (window.PowerUpManager) {
      window.PowerUpManager.clear();
    }
    
    // Reset collectible spawn timer
    collectibleSpawnTimer = 0;
    collectibleSpawnInterval = 1800; // Start with 1800ms for balanced density
    lastObstacleX = -1;
    lastCollectibleX = -1;
    lastCollectibleTime = 0;
    
    // Initialize audio
    if (window.AudioManager) {
      window.AudioManager.resume();
    }
    
    // Initialize background music based on settings
    initBackgroundMusic();
    
    gameState = GAME_STATES.PLAYING;
    updateUI();
  }
  
  // Initialize background music
  function initBackgroundMusic() {
    const bgMusic = document.getElementById('bgMusic');
    if (!bgMusic) return;
    
    // Load music setting from localStorage (from welcome screen)
    // Default to 'on' if no setting exists
    const musicSetting = localStorage.getItem('music');
    const musicEnabled = musicSetting === null || musicSetting === 'on';
    
    // Set volume from AudioManager if available
    if (window.AudioManager) {
      bgMusic.volume = window.AudioManager.musicVolume || 0.5;
    } else {
      bgMusic.volume = 0.5;
    }
    
    // Play or pause based on setting (default: play)
    if (musicEnabled) {
      // Try to play immediately
      bgMusic.play().catch(e => {
        console.log('Background music play failed (may need user interaction):', e);
        // If autoplay is blocked, play on first user interaction
        const playOnInteraction = () => {
          if (musicEnabled && bgMusic.paused) {
            bgMusic.play().catch(() => {});
          }
          // Remove listeners after first play
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
          document.removeEventListener('keydown', playOnInteraction);
        };
        
        // Add listeners for user interaction
        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
      });
    } else {
      bgMusic.pause();
    }
  }

  // Input Handling
  function setupInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    });

    document.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // Click/Touch to move - Player moves to clicked/touched position
    if (!canvas) return;
    
    function handleCanvasClick(e) {
      if (gameState !== GAME_STATES.PLAYING) return;
      
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      // Get coordinates from touch or mouse event
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Convert screen coordinates to canvas coordinates
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;
      
      // Only move horizontally (X axis)
      // Clamp to valid player position
      const minX = player.width / 2;
      const maxX = canvas.width - player.width / 2;
      const targetX = Math.max(minX, Math.min(maxX, canvasX));
      player.targetX = targetX;
      
      // Create visual feedback at click position
      clickIndicator = {
        x: targetX,
        y: canvasY,
        life: 20,
        maxLife: 20
      };
      
      // Create particles at click position
      createParticles(targetX, canvasY, 8, '#4CAF50');
      
      // Play sound if available
      if (window.AudioManager) {
        window.AudioManager.playSFX('collect', 0.3);
      }
    }
    
    // Mouse click
    canvas.addEventListener('click', handleCanvasClick);
    
    // Touch tap (single touch, no movement)
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let touchActive = false;
    let lastTouchX = 0;
    let touchSensitivity = 1.2; // Higher = more sensitive
    
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchStartPos.x = touch.clientX - rect.left;
      touchStartPos.y = touch.clientY - rect.top;
      touchStartTime = Date.now();
      touchActive = true;
      lastTouchX = touchStartPos.x;
      touchStartX = lastTouchX;
      touchStartY = touchStartPos.y;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!touchActive || gameState !== GAME_STATES.PLAYING) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const currentX = touch.clientX - rect.left;
      const deltaX = currentX - lastTouchX;
      
      // Convert screen coordinates to canvas coordinates
      const scaleX = canvas.width / rect.width;
      const scaledDeltaX = deltaX * scaleX;
      
      // Update player position based on touch movement
      player.targetX += scaledDeltaX * touchSensitivity;
      lastTouchX = currentX;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if it was a tap (quick touch without much movement)
      const touchEndTime = Date.now();
      const timeDiff = touchEndTime - touchStartTime;
      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const touchEndX = touch.clientX - rect.left;
      const touchEndY = touch.clientY - rect.top;
      const moveDistance = Math.sqrt(
        Math.pow(touchEndX - touchStartPos.x, 2) + 
        Math.pow(touchEndY - touchStartPos.y, 2)
      );
      
      // If it's a quick tap (less than 300ms and less than 10px movement), move to position
      if (timeDiff < 300 && moveDistance < 10) {
        handleCanvasClick(e);
      }
      
      touchActive = false;
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      touchActive = false;
    }, { passive: false });

    // Mobile control buttons - optimized touch handling
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    function addTouchHandlers(btn, keyLeft, keyRight) {
      if (!btn) return;
      
      const handleStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys[keyLeft] = true;
        keys[keyRight] = true;
        btn.classList.add('touching');
      };
      
      const handleEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys[keyLeft] = false;
        keys[keyRight] = false;
        btn.classList.remove('touching');
      };
      
      btn.addEventListener('touchstart', handleStart, { passive: false });
      btn.addEventListener('touchend', handleEnd, { passive: false });
      btn.addEventListener('touchcancel', handleEnd, { passive: false });
      
      // Also support mouse for testing on desktop
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys[keyLeft] = true;
        keys[keyRight] = true;
        btn.classList.add('touching');
      });
      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys[keyLeft] = false;
        keys[keyRight] = false;
        btn.classList.remove('touching');
      });
      btn.addEventListener('mouseleave', () => {
        keys[keyLeft] = false;
        keys[keyRight] = false;
        btn.classList.remove('touching');
      });
    }
    
    addTouchHandlers(leftBtn, 'arrowleft', 'a');
    addTouchHandlers(rightBtn, 'arrowright', 'd');

    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', togglePause);
    }

    // Menu buttons
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    const quitBtn = document.getElementById('quitBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const menuBtn = document.getElementById('menuBtn');

    if (resumeBtn) {
      resumeBtn.addEventListener('click', togglePause);
    }
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        init();
        hidePauseMenu();
      });
    }
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        init();
        hideGameOver();
      });
    }
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  // Update player
  function updatePlayer(delta) {
    const moveSpeed = 300 * delta; // pixels per second
    
    // Update animation time
    player.animationTime += delta;
    
    // Check movement
    const wasMoving = player.isMoving;
    let movingLeft = false;
    let movingRight = false;
    
    if (keys['arrowleft'] || keys['a']) {
      player.targetX -= moveSpeed;
      movingLeft = true;
      player.lastMoveDirection = -1;
    }
    if (keys['arrowright'] || keys['d']) {
      player.targetX += moveSpeed;
      movingRight = true;
      player.lastMoveDirection = 1;
    }
    
    player.isMoving = movingLeft || movingRight;
    
    // If stopped moving, reset direction
    if (!player.isMoving) {
      player.lastMoveDirection = 0;
    }

    // Clamp player position
    if (canvas && window.GameUtils) {
      player.targetX = GameUtils.clamp(player.targetX, player.width / 2, canvas.width - player.width / 2);
    } else if (canvas) {
      // Fallback if GameUtils not loaded
      player.targetX = Math.max(player.width / 2, Math.min(player.targetX, canvas.width - player.width / 2));
    }
    
    // Smooth movement
    const oldX = player.x;
    player.x += (player.targetX - player.x) * player.speed;
    
    // Animation: Tilt when moving
    if (player.isMoving) {
      const targetTilt = player.lastMoveDirection * 0.15; // Tilt angle in radians
      player.tilt += (targetTilt - player.tilt) * 0.3;
      // Bounce animation
      player.bounce = Math.sin(player.animationTime * 8) * 2;
    } else {
      player.tilt *= 0.9; // Return to center
      player.bounce = 0;
    }
    
    // Idle blink animation
    player.idleBlink = Math.sin(player.animationTime * 0.5) > 0.95 ? 1 : 0;
    
    // Shake animation decay
    if (player.shake > 0) {
      player.shake *= 0.9;
      if (player.shake < 0.1) player.shake = 0;
    }
  }

  // Spawn obstacle with improved logic
  function spawnObstacle() {
    if (!canvas) return;
    
    // Calculate base speed based on level (increases with each level)
    // Level 1: 1.5, Level 2: 1.7, Level 3: 1.9, ..., Level 15: 4.3 (max at level 15)
    // Formula: 1.5 + (level - 1) * 0.2, maximum 4.3 at level 15
    const baseSpeed = Math.min(4.3, 1.5 + (gameStats.level - 1) * 0.2);
    
    // Determine obstacle type with weighted probability
    // Higher levels have more variety
    const rand = Math.random();
    let type;
    if (gameStats.level <= 3) {
      // Early levels: mostly trees and rocks
      type = rand < 0.6 ? OBSTACLE_TYPES.TREE : OBSTACLE_TYPES.ROCK;
    } else if (gameStats.level <= 7) {
      // Mid levels: mix of all types
      if (rand < 0.4) type = OBSTACLE_TYPES.TREE;
      else if (rand < 0.7) type = OBSTACLE_TYPES.ROCK;
      else type = OBSTACLE_TYPES.SNOWMAN;
    } else {
      // High levels: more snowmen (harder to see)
      if (rand < 0.3) type = OBSTACLE_TYPES.TREE;
      else if (rand < 0.5) type = OBSTACLE_TYPES.ROCK;
      else type = OBSTACLE_TYPES.SNOWMAN;
    }
    
    let width, height, speedMultiplier = 1;
    switch(type) {
      case OBSTACLE_TYPES.TREE:
        width = 35;
        height = 50;
        speedMultiplier = 1.0; // Normal speed
        break;
      case OBSTACLE_TYPES.ROCK:
        width = 30;
        height = 30;
        speedMultiplier = 1.1; // Slightly faster (smaller, harder to see)
        break;
      case OBSTACLE_TYPES.SNOWMAN:
        width = 35;
        height = 40;
        speedMultiplier = 0.9; // Slightly slower (harder to avoid)
        break;
      default:
        width = 30;
        height = 40;
    }

    // Find a good spawn position (avoid clustering)
    let attempts = 0;
    let x;
    do {
      x = Math.random() * (canvas.width - width);
      attempts++;
      // If we can't find a good position after 5 attempts, just use random
      if (attempts > 5) break;
    } while (lastObstacleX >= 0 && Math.abs(x - lastObstacleX) < minObstacleGap);
    
    lastObstacleX = x;

    obstacles.push({
      x: x,
      y: -height,
      width: width,
      height: height,
      type: type,
      speed: baseSpeed * speedMultiplier,
      spawnTime: gameStats.gameTime,
      // Animation states - realistic physics
      rotation: (Math.random() - 0.5) * 0.3, // Small initial tilt (-15 to +15 degrees)
      rotationSpeed: 0, // Will be calculated based on fall speed and type
      rotationAccel: (Math.random() - 0.5) * 0.02, // Small random acceleration
      animationTime: 0,
      wobble: 0, // Natural wobble from rotation
      fallDistance: 0 // Track how far it has fallen
    });
  }

  // Update obstacles with improved physics
  function updateObstacles(delta) {
    if (!canvas) return;
    
    const effects = window.PowerUpManager ? window.PowerUpManager.getEffects() : { timeScale: 1 };
    const timeScale = effects.timeScale || 1;
    
    // Limit max obstacles on screen to prevent overload (increases with each level)
    // Level 1: 3, Level 2: 3, Level 3: 4, Level 4: 4, ..., Level 15: 6 (max)
    // Formula: 3 + Math.floor((level - 1) / 2), maximum 6
    const maxObstacles = Math.min(6, 3 + Math.floor((gameStats.level - 1) / 2));
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      
      // Update fall distance
      const fallDelta = obstacle.speed * delta * 60 * timeScale;
      obstacle.fallDistance += fallDelta;
      
      // Update animation with realistic physics
      if (obstacle.animationTime !== undefined) {
        obstacle.animationTime += delta;
        
        // Realistic rotation: depends on fall speed and obstacle type
        // Heavier/rounder objects rotate slower, lighter/flatter rotate faster
        let baseRotationRate = 0.03; // Base rotation rate (radians per second)
        
        switch(obstacle.type) {
          case OBSTACLE_TYPES.TREE:
            // Tree rotates slowly (top heavy, air resistance)
            baseRotationRate = 0.02;
            break;
          case OBSTACLE_TYPES.ROCK:
            // Rock rotates faster (compact, less air resistance)
            baseRotationRate = 0.04;
            break;
          case OBSTACLE_TYPES.SNOWMAN:
            // Snowman rotates slowly (round, balanced)
            baseRotationRate = 0.015;
            break;
        }
        
        // Rotation speed increases slightly with fall speed (more air resistance at higher speeds)
        const speedFactor = Math.min(obstacle.speed / 3.0, 1.5); // Cap at 1.5x
        obstacle.rotationSpeed += obstacle.rotationAccel * delta * timeScale;
        
        // Apply damping to rotation (air resistance slows rotation)
        obstacle.rotationSpeed *= (1 - 0.1 * delta); // Damping factor
        
        // Clamp rotation speed to realistic values
        const maxRotationSpeed = baseRotationRate * speedFactor;
        obstacle.rotationSpeed = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, obstacle.rotationSpeed));
        
        // Update rotation
        obstacle.rotation += obstacle.rotationSpeed * delta * timeScale;
        
        // Natural wobble from rotation (small horizontal movement due to rotation)
        // Only wobble if rotating significantly
        if (Math.abs(obstacle.rotationSpeed) > 0.01) {
          obstacle.wobble = Math.sin(obstacle.rotation * 2) * Math.abs(obstacle.rotationSpeed) * 3;
        } else {
          obstacle.wobble *= 0.95; // Decay wobble when not rotating
        }
      }
      
      // Constant speed (no acceleration) for predictable gameplay
      obstacle.y += fallDelta;
      
      // Remove if off screen
      if (obstacle.y > canvas.height + 50) {
        obstacles.splice(i, 1);
        // Reset last obstacle position if this was the last one
        if (obstacles.length === 0) {
          lastObstacleX = -1;
        }
        // Increase combo when obstacle passes (tránh thành công)
        gameStats.combo++;
        // Ensure combo is always an integer
        gameStats.combo = Math.floor(gameStats.combo);
        if (gameStats.combo > gameStats.maxCombo) {
          gameStats.maxCombo = gameStats.combo;
        }
        gameStats.lastObstacleTime = gameStats.gameTime; // Update time when obstacle passes
        
        const scoreMultiplier = effects.scoreMultiplier || 1;
        // Score increases with combo and level (more balanced formula)
        // Base: 10 points, Combo bonus: combo * 3, Level bonus: level * 2
        const baseScore = 10;
        const comboBonus = gameStats.combo * 3;
        const levelBonus = gameStats.level * 2;
        const totalScore = (baseScore + comboBonus + levelBonus) * scoreMultiplier;
        gameStats.score += Math.floor(totalScore);
        
        // Update UI immediately when combo changes
        updateUI();
      }
    }
    
    // Prevent too many obstacles on screen
    if (obstacles.length > maxObstacles) {
      // Remove oldest obstacles
      obstacles.sort((a, b) => (a.spawnTime || 0) - (b.spawnTime || 0));
      obstacles.splice(0, obstacles.length - maxObstacles);
    }
  }

  // Spawn collectible with improved distribution - more scattered
  function spawnCollectible() {
    if (!window.CollectibleManager || !canvas) return;
    
    const rand = Math.random();
    let type = 'coin';
    
    // Random probabilities - consistent throughout game
    // Coins: 75-80% (most common)
    // Stars: 10-12% (rare)
    // Power-ups: 10-13% (rare)
    // These ratios stay consistent for random distribution
    const starChance = 0.11; // 11% chance for stars
    const powerUpChance = 0.12; // 12% chance for power-ups
    // Remaining ~77% is coins
    
    if (rand < starChance) {
      // Star spawn
      type = 'star';
    } else if (rand < starChance + powerUpChance) {
      // Power-up spawn - completely random type
      const powerUpTypes = ['shield', 'speedBoost', 'scoreMultiplier', 'slowMotion', 'magnet'];
      const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      type = 'powerup-' + randomPowerUp;
    }
    // Otherwise type remains 'coin' (~77% chance)
    
    // Spawn at completely random positions - fully random distribution
    // No restrictions, completely random for natural distribution
    const x = Math.random() * (canvas.width - 40) + 20;
    
    lastCollectibleX = x;
    lastCollectibleTime = gameStats.gameTime;
    window.CollectibleManager.create(x, -30, type);
  }

  // Update collectibles
  function updateCollectibles(delta, baseSpeed = null, timeScale = 1) {
    if (!window.CollectibleManager) return;
    
    const effects = window.PowerUpManager ? window.PowerUpManager.getEffects() : { hasMagnet: false, scoreMultiplier: 1 };
    const playerPos = { x: player.x, y: player.y };
    
    // Store items that were just collected before they get removed
    const newlyCollected = [];
    
    // Check for collection before updating (to catch items that will be collected)
    const collectibles = window.CollectibleManager.collectibles;
    for (let item of collectibles) {
      if (!item.collected && playerPos) {
        const dx = playerPos.x - item.x;
        const dy = playerPos.y - item.y;
        const distSq = dx * dx + dy * dy;
        const collectRadiusSq = 25 * 25; // Same as in collectibles.js
        
        if (distSq < collectRadiusSq) {
          // Item is being collected - mark it and process
          item.collected = true;
          newlyCollected.push(item);
        }
      }
    }
    
    // Update collectibles (this will remove collected items)
    window.CollectibleManager.update(delta, playerPos, effects.hasMagnet, baseSpeed, timeScale);
    
    // Process newly collected items for scoring and effects
    for (let item of newlyCollected) {
      if (item.type === 'coin') {
        const scoreMultiplier = effects.scoreMultiplier || 1;
        const coinScore = Math.floor(50 * scoreMultiplier);
        gameStats.score += coinScore;
        createParticles(item.x, item.y, 10, '#FFD700');
        if (window.AudioManager) {
          window.AudioManager.playSFX('collect', 0.8);
        }
      } else if (item.type === 'star') {
        const scoreMultiplier = effects.scoreMultiplier || 1;
        const starScore = Math.floor(200 * scoreMultiplier);
        gameStats.score += starScore;
        createParticles(item.x, item.y, 15, '#FFD700');
        if (window.AudioManager) {
          window.AudioManager.playSFX('collect', 1);
        }
      } else if (item.type.startsWith('powerup-')) {
        activatePowerUp(item.powerUpType);
        createParticles(item.x, item.y, 20, '#9C27B0');
        if (window.AudioManager) {
          window.AudioManager.playSFX('powerup', 1);
        }
      }
    }
  }

  // Activate power-up
  function activatePowerUp(type) {
    if (!window.PowerUpManager) return;
    
    const duration = 10000; // 10 seconds
    window.PowerUpManager.activate(type, duration);
    
    // Apply immediate effects
    const effects = window.PowerUpManager.getEffects();
    if (type === 'speedBoost' && effects.speedMultiplier > 1) {
      player.speed = 0.25; // Faster movement
    }
  }

  // Collision detection
  function checkCollisions() {
    const effects = window.PowerUpManager ? window.PowerUpManager.getEffects() : { hasShield: false };
    
    for (let obstacle of obstacles) {
      let collision = false;
      if (window.GameUtils) {
        collision = GameUtils.checkCollision(
          { x: player.x - player.width / 2, y: player.y - player.height / 2, width: player.width, height: player.height },
          { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height }
        );
      } else {
        // Fallback collision detection
        collision = player.x - player.width / 2 < obstacle.x + obstacle.width &&
                    player.x + player.width / 2 > obstacle.x &&
                    player.y - player.height / 2 < obstacle.y + obstacle.height &&
                    player.y + player.height / 2 > obstacle.y;
      }
      
      if (collision) {
        if (effects.hasShield) {
          // Use shield
          if (window.PowerUpManager) {
            window.PowerUpManager.deactivate(window.PowerUpManager.powerUpTypes.SHIELD);
          }
          if (window.AudioManager) {
            window.AudioManager.playSFX('shield', 1);
          }
          // Create particles
          createParticles(player.x, player.y, 20, '#2196F3');
          return;
        } else {
          // Game over
          gameOver();
          return;
        }
      }
    }
  }

  // Create particles
  function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = window.GameUtils ? GameUtils.random(2, 5) : (Math.random() * 3 + 2);
      const size = window.GameUtils ? GameUtils.random(2, 5) : (Math.random() * 3 + 2);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        life: 30,
        maxLife: 30,
        color: color || '#ffffff',
        alpha: 1
      });
    }
  }

  // Update particles
  function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx * delta * 60;
      particle.y += particle.vy * delta * 60;
      particle.vy += 0.3 * delta * 60; // gravity
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // Render functions - optimized for performance
  function render() {
    if (!canvas || !ctx) return;
    
    // Clear canvas - use clearRect for better performance
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient based on theme
    let gradient;
    switch(currentTheme) {
      case 'night-sky':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a3a');
        gradient.addColorStop(1, '#2a2a4a');
        break;
      case 'aurora':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a1a0a');
        gradient.addColorStop(0.3, '#1a3a2a');
        gradient.addColorStop(0.6, '#2a5a3a');
        gradient.addColorStop(1, '#1a2a1a');
        break;
      case 'sunset':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ff6b35');
        gradient.addColorStop(0.3, '#f7931e');
        gradient.addColorStop(0.6, '#ffcc02');
        gradient.addColorStop(1, '#ff6b35');
        break;
      case 'storm':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2a2a3a');
        gradient.addColorStop(0.5, '#1a1a2a');
        gradient.addColorStop(1, '#0a0a1a');
        break;
      case 'christmas-village':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a237e');
        gradient.addColorStop(0.3, '#283593');
        gradient.addColorStop(0.6, '#3949ab');
        gradient.addColorStop(1, '#5c6bc0');
        break;
      case 'northern-lights':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0d4f3c');
        gradient.addColorStop(0.3, '#1b7a5e');
        gradient.addColorStop(0.6, '#2ecc71');
        gradient.addColorStop(1, '#1a5f3f');
        break;
      case 'snowy-forest':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1b5e20');
        gradient.addColorStop(0.3, '#2e7d32');
        gradient.addColorStop(0.6, '#388e3c');
        gradient.addColorStop(1, '#4caf50');
        break;
      case 'starry-night':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(0.5, '#000066');
        gradient.addColorStop(1, '#000099');
        break;
      case 'tet-festival':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#b71c1c');
        gradient.addColorStop(0.3, '#c62828');
        gradient.addColorStop(0.6, '#f57c00');
        gradient.addColorStop(1, '#ffd700');
        break;
      case 'spring-garden':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#f8bbd0');
        gradient.addColorStop(0.3, '#f48fb1');
        gradient.addColorStop(0.6, '#81c784');
        gradient.addColorStop(1, '#66bb6a');
        break;
      case 'lucky-red':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#c62828');
        gradient.addColorStop(0.5, '#d32f2f');
        gradient.addColorStop(1, '#ffd700');
        break;
      case 'dragon-dance':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#b71c1c');
        gradient.addColorStop(0.3, '#f57c00');
        gradient.addColorStop(0.6, '#ffd700');
        gradient.addColorStop(1, '#4caf50');
        break;
      case 'peach-blossom-sky':
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#fce4ec');
        gradient.addColorStop(0.3, '#f8bbd0');
        gradient.addColorStop(0.6, '#81c784');
        gradient.addColorStop(1, '#66bb6a');
        break;
      default: // default-winter
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#E0F6FF');
        gradient.addColorStop(1, '#FFFFFF');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw theme-specific elements
    drawThemeElements();
    
    // Draw clouds (parallax background)
    drawClouds();
    
    // Draw snowflakes (simple background effect) - reduced on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile || gameStats.level < 5) {
      drawSnowflakes();
    }
    
    // Draw collectibles
    if (window.CollectibleManager) {
      window.CollectibleManager.draw(ctx);
    }
    
    // Draw obstacles
    drawObstacles();
    
    // Draw player
    drawPlayer();
    
    // Draw particles
    drawParticles();
    
    // Draw shield effect if active
    const effects = window.PowerUpManager ? window.PowerUpManager.getEffects() : { hasShield: false };
    if (effects.hasShield) {
      drawShield();
    }
    
    // Draw click indicator
    if (clickIndicator) {
      drawClickIndicator();
    }
  }
  
  function drawClickIndicator() {
    if (!ctx || !clickIndicator) return;
    
    const indicator = clickIndicator;
    const alpha = indicator.life / indicator.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Draw circle
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(indicator.x, indicator.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner circle
    ctx.strokeStyle = '#8BC34A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(indicator.x, indicator.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw center dot
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(indicator.x, indicator.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    
    // Update life
    indicator.life--;
    if (indicator.life <= 0) {
      clickIndicator = null;
    }
  }

  // Background animation state
  let backgroundTime = 0;
  let clouds = [];
  
  function initBackground() {
    if (!canvas) return;
    // Initialize clouds
    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.3,
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: 10 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.2
      });
    }
  }
  
  function drawThemeElements() {
    if (!ctx || !canvas) return;
    
    switch(currentTheme) {
      case 'starry-night':
        drawStars();
        drawMoon();
        break;
      case 'tet-festival':
        drawFireworks();
        drawLanterns();
        break;
      case 'spring-garden':
      case 'peach-blossom-sky':
        drawPeachBlossoms();
        break;
      case 'christmas-village':
        drawChristmasLights();
        break;
      case 'northern-lights':
        drawAuroraEffect();
        break;
      case 'dragon-dance':
        drawDragonElements();
        break;
    }
  }
  
  // Theme-specific drawing functions
  function drawStars() {
    if (!ctx || !canvas) return;
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = (i * 199.3) % canvas.height;
      const size = 1 + Math.sin(backgroundTime + i) * 0.5;
      const brightness = 0.5 + Math.sin(backgroundTime * 2 + i) * 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  function drawMoon() {
    if (!ctx || !canvas) return;
    const moonX = canvas.width * 0.8;
    const moonY = canvas.height * 0.2;
    const moonSize = 40;
    
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(200, 200, 150, 0.6)';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 5, moonSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawFireworks() {
    if (!ctx || !canvas) return;
    const fireworkCount = 5;
    for (let i = 0; i < fireworkCount; i++) {
      const x = (i * 200 + backgroundTime * 10) % canvas.width;
      const y = canvas.height * 0.3 + Math.sin(backgroundTime + i) * 20;
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      
      for (let j = 0; j < 8; j++) {
        const angle = (j * Math.PI * 2) / 8 + backgroundTime;
        const distance = 15 + Math.sin(backgroundTime * 2 + j) * 5;
        ctx.fillStyle = colors[j % colors.length];
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  function drawLanterns() {
    if (!ctx || !canvas) return;
    const lanternCount = 6;
    for (let i = 0; i < lanternCount; i++) {
      const x = (i * (canvas.width / lanternCount) + backgroundTime * 5) % canvas.width;
      const y = canvas.height * 0.2 + Math.sin(backgroundTime + i) * 10;
      
      // Lantern body
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x - 15, y, 30, 40);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x - 12, y + 5, 24, 3);
      ctx.fillRect(x - 12, y + 20, 24, 3);
      ctx.fillRect(x - 12, y + 35, 24, 3);
      
      // Lantern glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#FFD700';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(x - 15, y, 30, 40);
      ctx.shadowBlur = 0;
      
      // Lantern handle
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 15, y);
      ctx.lineTo(x - 20, y - 5);
      ctx.lineTo(x + 20, y - 5);
      ctx.lineTo(x + 15, y);
      ctx.stroke();
    }
  }
  
  function drawPeachBlossoms() {
    if (!ctx || !canvas) return;
    const blossomCount = 20;
    for (let i = 0; i < blossomCount; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = (i * 199.3 + backgroundTime * 20) % canvas.height;
      const size = 3 + Math.sin(backgroundTime + i) * 1;
      
      ctx.fillStyle = '#F8BBD0';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Petals
      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5;
        ctx.fillStyle = '#F48FB1';
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * size, y + Math.sin(angle) * size, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  function drawChristmasLights() {
    if (!ctx || !canvas) return;
    const lightCount = 10;
    for (let i = 0; i < lightCount; i++) {
      const x = (i * (canvas.width / lightCount) + backgroundTime * 5) % canvas.width;
      const y = canvas.height * 0.15;
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      const color = colors[i % colors.length];
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Wire
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - (canvas.width / lightCount), y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  
  function drawAuroraEffect() {
    if (!ctx || !canvas) return;
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const y = canvas.height * (0.2 + i * 0.25);
      const waveOffset = Math.sin(backgroundTime + i) * 20;
      
      ctx.strokeStyle = `rgba(46, 204, 113, ${0.3 + i * 0.2})`;
      ctx.lineWidth = 30;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 5) {
        const waveY = y + Math.sin((x + backgroundTime * 50) / 50) * 10 + waveOffset;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  }
  
  function drawDragonElements() {
    if (!ctx || !canvas) return;
    // Draw dragon silhouette
    const dragonX = canvas.width * 0.5 + Math.sin(backgroundTime) * 50;
    const dragonY = canvas.height * 0.3;
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(dragonX, dragonY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Dragon body segments
    for (let i = 0; i < 5; i++) {
      const segmentX = dragonX + Math.cos(backgroundTime + i) * 20;
      const segmentY = dragonY + Math.sin(backgroundTime + i) * 10;
      ctx.fillStyle = `rgba(${255 - i * 20}, ${215 - i * 10}, 0, 0.4)`;
      ctx.beginPath();
      ctx.arc(segmentX, segmentY, 15 - i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  function drawSnowflakes() {
    if (!canvas || !ctx) return;
    
    // Improved snowflake rendering with multiple sizes
    const time = backgroundTime;
    const snowflakeCount = Math.min(30, Math.floor(canvas.width / 20));
    
    // Draw different sizes of snowflakes
    for (let size = 1; size <= 3; size++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + size * 0.1})`;
      ctx.beginPath();
      for (let i = 0; i < snowflakeCount / 3; i++) {
        const index = size * snowflakeCount / 3 + i;
        const x = (index * 37 + time * 10 * size) % (canvas.width + 20) - 10;
        const y = (time * (20 + size * 10) + i * 60) % (canvas.height + 50);
        ctx.moveTo(x + size, y);
        ctx.arc(x, y, size, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }
  
  function drawClouds() {
    if (!canvas || !ctx || clouds.length === 0) return;
    
    // Update and draw clouds
    for (let cloud of clouds) {
      cloud.x += cloud.speed * 0.01;
      if (cloud.x > canvas.width + cloud.width) {
        cloud.x = -cloud.width;
        cloud.y = Math.random() * canvas.height * 0.3;
      }
      
      // Draw cloud
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.3, cloud.y, cloud.height / 2, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.height / 2, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width, cloud.y, cloud.height / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer() {
    if (!ctx) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Apply shake animation
    if (player.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * player.shake * 3,
        (Math.random() - 0.5) * player.shake * 3
      );
    }
    
    // Apply bounce animation
    ctx.translate(0, player.bounce);
    
    // Apply tilt animation
    ctx.rotate(player.tilt);
    
    // Draw player based on selected skin
    drawPlayerBySkin(currentSkin);
    
    ctx.restore();
  }
  
  function drawPlayerBySkin(skinId) {
    if (!ctx) return;
    
    // Common elements: Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Arms (sticks) with animation - common for all skins
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    const armSwing = player.isMoving ? Math.sin(player.animationTime * 6) * 3 : 0;
    const armOffset = player.lastMoveDirection * 2;
    ctx.beginPath();
    ctx.moveTo(-15, -2);
    ctx.lineTo(-25 + armOffset + armSwing, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15, -2);
    ctx.lineTo(25 - armOffset - armSwing, 5);
    ctx.stroke();
    
    // Draw based on skin type
    switch(skinId) {
      case 'santa-snowman':
        drawSantaSnowman();
        break;
      case 'elf-snowman':
        drawElfSnowman();
        break;
      case 'golden-snowman':
        drawGoldenSnowman();
        break;
      case 'ice-snowman':
        drawIceSnowman();
        break;
      case 'reindeer-snowman':
        drawReindeerSnowman();
        break;
      case 'gingerbread-snowman':
        drawGingerbreadSnowman();
        break;
      case 'christmas-tree-snowman':
        drawChristmasTreeSnowman();
        break;
      case 'snowflake-snowman':
        drawSnowflakeSnowman();
        break;
      case 'candy-cane-snowman':
        drawCandyCaneSnowman();
        break;
      case 'lucky-snowman':
        drawLuckySnowman();
        break;
      case 'dragon-snowman':
        drawDragonSnowman();
        break;
      case 'lantern-snowman':
        drawLanternSnowman();
        break;
      case 'firework-snowman':
        drawFireworkSnowman();
        break;
      case 'peach-blossom-snowman':
        drawPeachBlossomSnowman();
        break;
      default: // default-snowman
        drawDefaultSnowman();
    }
  }
  
  function drawDefaultSnowman() {
    // Body (bottom circle) with gradient
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FFFFFF');
    bottomGradient.addColorStop(0.8, '#F5F5F5');
    bottomGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0D0D0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Buttons
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (middle circle) with gradient
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FFFFFF');
    middleGradient.addColorStop(0.8, '#F5F5F5');
    middleGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0D0D0';
    ctx.stroke();
    
    // Head (top circle) with gradient
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FFFFFF');
    headGradient.addColorStop(0.8, '#F5F5F5');
    headGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0D0D0';
    ctx.stroke();
    
    // Eyes with shine and blink animation
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-3.5, -28.5, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4.5, -28.5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Nose (carrot) with gradient
    const noseGradient = ctx.createLinearGradient(-3, -22, 3, -22);
    noseGradient.addColorStop(0, '#FF6B00');
    noseGradient.addColorStop(0.5, '#FF9800');
    noseGradient.addColorStop(1, '#FF6B00');
    ctx.fillStyle = noseGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Hat with gradient
    const hatGradient = ctx.createLinearGradient(0, -40, 0, -30);
    hatGradient.addColorStop(0, '#654321');
    hatGradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = hatGradient;
    ctx.fillRect(-12, -30, 24, 4);
    ctx.beginPath();
    ctx.arc(0, -35, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-8, -32, 16, 3);
  }
  
  function drawSantaSnowman() {
    // Red body with white trim
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FF0000');
    bottomGradient.addColorStop(0.8, '#CC0000');
    bottomGradient.addColorStop(1, '#990000');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // White belt
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-18, -2, 36, 8);
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FF0000');
    middleGradient.addColorStop(0.8, '#CC0000');
    middleGradient.addColorStop(1, '#990000');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FFFFFF');
    headGradient.addColorStop(0.8, '#F5F5F5');
    headGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D0D0D0';
    ctx.stroke();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Nose
    const noseGradient = ctx.createLinearGradient(-3, -22, 3, -22);
    noseGradient.addColorStop(0, '#FF6B00');
    noseGradient.addColorStop(0.5, '#FF9800');
    noseGradient.addColorStop(1, '#FF6B00');
    ctx.fillStyle = noseGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Santa hat
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(12, -30);
    ctx.lineTo(0, -45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-12, -30, 24, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -45, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawElfSnowman() {
    // Green body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#4CAF50');
    bottomGradient.addColorStop(0.8, '#388E3C');
    bottomGradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#4CAF50');
    middleGradient.addColorStop(0.8, '#388E3C');
    middleGradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FFFFFF');
    headGradient.addColorStop(0.8, '#F5F5F5');
    headGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Nose
    const noseGradient = ctx.createLinearGradient(-3, -22, 3, -22);
    noseGradient.addColorStop(0, '#FF6B00');
    noseGradient.addColorStop(0.5, '#FF9800');
    noseGradient.addColorStop(1, '#FF6B00');
    ctx.fillStyle = noseGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Pointed elf hat
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(10, -30);
    ctx.lineTo(0, -42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -42, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawGoldenSnowman() {
    // Golden body with glow
    const glowIntensity = 0.3 + Math.sin(player.animationTime * 4) * 0.2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFD700';
    
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FFD700');
    bottomGradient.addColorStop(0.5, '#FFA000');
    bottomGradient.addColorStop(1, '#FF8F00');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FFD700');
    middleGradient.addColorStop(0.5, '#FFA000');
    middleGradient.addColorStop(1, '#FF8F00');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FFD700');
    headGradient.addColorStop(0.5, '#FFA000');
    headGradient.addColorStop(1, '#FF8F00');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Nose
    const noseGradient = ctx.createLinearGradient(-3, -22, 3, -22);
    noseGradient.addColorStop(0, '#FF6B00');
    noseGradient.addColorStop(0.5, '#FF9800');
    noseGradient.addColorStop(1, '#FF6B00');
    ctx.fillStyle = noseGradient;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Golden crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    ctx.lineTo(-6, -35);
    ctx.lineTo(-3, -30);
    ctx.lineTo(0, -35);
    ctx.lineTo(3, -30);
    ctx.lineTo(6, -35);
    ctx.lineTo(8, -30);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawIceSnowman() {
    // Icy transparent body
    ctx.globalAlpha = 0.7;
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#E0F7FA');
    bottomGradient.addColorStop(0.5, '#B2EBF2');
    bottomGradient.addColorStop(1, '#80DEEA');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Middle circle
    ctx.globalAlpha = 0.7;
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#E0F7FA');
    middleGradient.addColorStop(0.5, '#B2EBF2');
    middleGradient.addColorStop(1, '#80DEEA');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Head
    ctx.globalAlpha = 0.7;
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#E0F7FA');
    headGradient.addColorStop(0.5, '#B2EBF2');
    headGradient.addColorStop(1, '#80DEEA');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#01579B';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#01579B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#01579B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Blue nose
    ctx.fillStyle = '#0277BD';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Ice crystal hat
    ctx.fillStyle = '#B2EBF2';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-8, -35);
    ctx.lineTo(0, -40);
    ctx.lineTo(8, -35);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawReindeerSnowman() {
    // Brown body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#8D6E63');
    bottomGradient.addColorStop(0.8, '#6D4C41');
    bottomGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#8D6E63');
    middleGradient.addColorStop(0.8, '#6D4C41');
    middleGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FFFFFF');
    headGradient.addColorStop(0.8, '#F5F5F5');
    headGradient.addColorStop(1, '#E0E0E0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Red nose
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, -24, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Red hat with antlers
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(12, -30);
    ctx.lineTo(0, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-12, -30, 24, 4);
    
    // Antlers
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -35);
    ctx.lineTo(-12, -42);
    ctx.lineTo(-10, -40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -35);
    ctx.lineTo(12, -42);
    ctx.lineTo(10, -40);
    ctx.stroke();
  }
  
  function drawGingerbreadSnowman() {
    // Brown gingerbread body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#8D6E63');
    bottomGradient.addColorStop(0.8, '#6D4C41');
    bottomGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Candy buttons
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#8D6E63');
    middleGradient.addColorStop(0.8, '#6D4C41');
    middleGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#8D6E63');
    headGradient.addColorStop(0.8, '#6D4C41');
    headGradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Candy nose
    ctx.fillStyle = '#FF6B00';
    ctx.beginPath();
    ctx.arc(0, -24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  function drawChristmasTreeSnowman() {
    // Green body like tree
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#4CAF50');
    bottomGradient.addColorStop(0.8, '#2E7D32');
    bottomGradient.addColorStop(1, '#1B5E20');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Ornaments
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#4CAF50');
    middleGradient.addColorStop(0.8, '#2E7D32');
    middleGradient.addColorStop(1, '#1B5E20');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#4CAF50');
    headGradient.addColorStop(0.8, '#2E7D32');
    headGradient.addColorStop(1, '#1B5E20');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Star nose
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const x = Math.cos(angle) * 3;
      const y = Math.sin(angle) * 3;
      if (i === 0) ctx.moveTo(x, -24 + y);
      else ctx.lineTo(x, -24 + y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Star on top
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const x = Math.cos(angle) * 5;
      const y = Math.sin(angle) * 5;
      if (i === 0) ctx.moveTo(x, -35 + y);
      else ctx.lineTo(x, -35 + y);
    }
    ctx.closePath();
    ctx.fill();
  }
  
  function drawSnowflakeSnowman() {
    // Icy blue body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#B3E5FC');
    bottomGradient.addColorStop(0.8, '#81D4FA');
    bottomGradient.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#B3E5FC');
    middleGradient.addColorStop(0.8, '#81D4FA');
    middleGradient.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#B3E5FC');
    headGradient.addColorStop(0.8, '#81D4FA');
    headGradient.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#01579B';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#01579B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#01579B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Blue nose
    ctx.fillStyle = '#0277BD';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Snowflake decoration
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(Math.cos(angle) * 5, -5 + Math.sin(angle) * 5);
      ctx.stroke();
    }
    
    // Snowflake hat
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(Math.cos(angle) * 8, -35 + Math.sin(angle) * 8);
      ctx.stroke();
    }
  }
  
  function drawCandyCaneSnowman() {
    // Red and white striped body
    const stripeWidth = 4;
    for (let i = -18; i < 18; i += stripeWidth * 2) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(i, -8, stripeWidth, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(i + stripeWidth, -8, stripeWidth, 36);
    }
    
    // Middle circle with stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.clip();
    for (let i = -15; i < 15; i += stripeWidth * 2) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(i, -20, stripeWidth, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(i + stripeWidth, -20, stripeWidth, 30);
    }
    ctx.restore();
    
    // Head with stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.clip();
    for (let i = -12; i < 12; i += stripeWidth * 2) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(i, -37, stripeWidth, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(i + stripeWidth, -37, stripeWidth, 24);
    }
    ctx.restore();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Candy cane nose
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-2, -23);
    ctx.lineTo(2, -23);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  function drawLuckySnowman() {
    // Red and gold body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FF0000');
    bottomGradient.addColorStop(0.5, '#FF6B00');
    bottomGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Gold coins as buttons
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FF0000');
    middleGradient.addColorStop(0.5, '#FF6B00');
    middleGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FF0000');
    headGradient.addColorStop(0.5, '#FF6B00');
    headGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Gold nose
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Red envelope hat
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-10, -30, 20, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-8, -28, 16, 2);
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('福', 0, -22);
  }
  
  function drawDragonSnowman() {
    // Red and gold dragon body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FF0000');
    bottomGradient.addColorStop(0.5, '#FF6B00');
    bottomGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FF0000');
    middleGradient.addColorStop(0.5, '#FF6B00');
    middleGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FF0000');
    headGradient.addColorStop(0.5, '#FF6B00');
    headGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Dragon eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(-4, -28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Dragon smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Dragon nose
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Dragon whiskers
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -25);
    ctx.lineTo(-15, -23);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -23);
    ctx.lineTo(-15, -21);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -25);
    ctx.lineTo(15, -23);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -23);
    ctx.lineTo(15, -21);
    ctx.stroke();
    
    // Dragon crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    ctx.lineTo(-6, -38);
    ctx.lineTo(-3, -30);
    ctx.lineTo(0, -38);
    ctx.lineTo(3, -30);
    ctx.lineTo(6, -38);
    ctx.lineTo(8, -30);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawLanternSnowman() {
    // Red body with glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
    
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#FF0000');
    bottomGradient.addColorStop(0.8, '#CC0000');
    bottomGradient.addColorStop(1, '#990000');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#FF0000');
    middleGradient.addColorStop(0.8, '#CC0000');
    middleGradient.addColorStop(1, '#990000');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#FF0000');
    headGradient.addColorStop(0.8, '#CC0000');
    headGradient.addColorStop(1, '#990000');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Gold trim
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Gold nose
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Lantern hat
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-8, -30, 16, 12);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-6, -28, 12, 2);
    ctx.fillRect(-6, -24, 12, 2);
    ctx.fillRect(-6, -20, 12, 2);
    
    // Lantern handle
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    ctx.lineTo(-10, -32);
    ctx.lineTo(10, -32);
    ctx.lineTo(8, -30);
    ctx.stroke();
  }
  
  function drawFireworkSnowman() {
    // Multi-colored body with sparkles
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const colorIndex = Math.floor(player.animationTime * 2) % colors.length;
    
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, colors[colorIndex]);
    bottomGradient.addColorStop(0.5, colors[(colorIndex + 1) % colors.length]);
    bottomGradient.addColorStop(1, colors[(colorIndex + 2) % colors.length]);
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, colors[(colorIndex + 1) % colors.length]);
    middleGradient.addColorStop(0.5, colors[(colorIndex + 2) % colors.length]);
    middleGradient.addColorStop(1, colors[(colorIndex + 3) % colors.length]);
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, colors[(colorIndex + 2) % colors.length]);
    headGradient.addColorStop(0.5, colors[(colorIndex + 3) % colors.length]);
    headGradient.addColorStop(1, colors[(colorIndex + 4) % colors.length]);
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Sparkles
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + player.animationTime;
      const distance = 20 + Math.sin(player.animationTime * 3) * 5;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Colorful nose
    ctx.fillStyle = colors[colorIndex];
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
  }
  
  function drawPeachBlossomSnowman() {
    // Pink body
    const bottomGradient = ctx.createRadialGradient(0, 5, 0, 0, 5, 18);
    bottomGradient.addColorStop(0, '#F8BBD0');
    bottomGradient.addColorStop(0.8, '#F48FB1');
    bottomGradient.addColorStop(1, '#EC407A');
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(0, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle circle
    const middleGradient = ctx.createRadialGradient(0, -8, 0, 0, -8, 15);
    middleGradient.addColorStop(0, '#F8BBD0');
    middleGradient.addColorStop(0.8, '#F48FB1');
    middleGradient.addColorStop(1, '#EC407A');
    ctx.fillStyle = middleGradient;
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headGradient = ctx.createRadialGradient(0, -28, 0, 0, -28, 12);
    headGradient.addColorStop(0, '#F8BBD0');
    headGradient.addColorStop(0.8, '#F48FB1');
    headGradient.addColorStop(1, '#EC407A');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Peach blossom petals
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + player.animationTime * 0.5;
      const distance = 15;
      ctx.fillStyle = '#F8BBD0';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Eyes
    if (player.idleBlink === 0 || !player.isMoving) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -28, 2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -28, 2, 0, Math.PI);
      ctx.stroke();
    }
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Pink nose
    ctx.fillStyle = '#EC407A';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-3, -22);
    ctx.lineTo(3, -22);
    ctx.closePath();
    ctx.fill();
    
    // Peach blossom hat
    ctx.fillStyle = '#F8BBD0';
    ctx.beginPath();
    ctx.arc(0, -35, 8, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.fillStyle = '#F48FB1';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 6, -35 + Math.sin(angle) * 6, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawObstacles() {
    if (!ctx) return;
    
    for (let obstacle of obstacles) {
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      
      // Apply realistic rotation animation (around center)
      ctx.rotate(obstacle.rotation || 0);
      
      // Apply natural wobble from rotation (subtle horizontal movement)
      ctx.translate((obstacle.wobble || 0), 0);
      
      switch(obstacle.type) {
        case OBSTACLE_TYPES.TREE:
          // Draw tree with better graphics
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, obstacle.height / 2 + 5, obstacle.width / 2, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Trunk
          const trunkGradient = ctx.createLinearGradient(-5, 0, 5, 0);
          trunkGradient.addColorStop(0, '#6D4C41');
          trunkGradient.addColorStop(0.5, '#5D4037');
          trunkGradient.addColorStop(1, '#6D4C41');
          ctx.fillStyle = trunkGradient;
          ctx.fillRect(-5, obstacle.height / 2 - 10, 10, 10);
          ctx.strokeStyle = '#4E342E';
          ctx.lineWidth = 1;
          ctx.strokeRect(-5, obstacle.height / 2 - 10, 10, 10);
          
          // Tree top (triangle) with gradient
          const treeGradient = ctx.createLinearGradient(0, -obstacle.height / 2, 0, obstacle.height / 2);
          treeGradient.addColorStop(0, '#4CAF50');
          treeGradient.addColorStop(0.5, '#2E7D32');
          treeGradient.addColorStop(1, '#1B5E20');
          ctx.fillStyle = treeGradient;
          ctx.beginPath();
          ctx.moveTo(0, -obstacle.height / 2);
          ctx.lineTo(-obstacle.width / 2, obstacle.height / 2 - 10);
          ctx.lineTo(obstacle.width / 2, obstacle.height / 2 - 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1B5E20';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Decorations (ornaments)
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(-8, -10, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(8, -5, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#F44336';
          ctx.beginPath();
          ctx.arc(0, -15, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case OBSTACLE_TYPES.ROCK:
          // Draw rock with better graphics
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, obstacle.height / 2 + 3, obstacle.width / 2, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Rock with gradient
          const rockGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, obstacle.width / 2);
          rockGradient.addColorStop(0, '#9E9E9E');
          rockGradient.addColorStop(0.5, '#757575');
          rockGradient.addColorStop(1, '#616161');
          ctx.fillStyle = rockGradient;
          ctx.beginPath();
          ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#424242';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Rock details
          ctx.strokeStyle = '#424242';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-obstacle.width / 4, -obstacle.height / 4);
          ctx.lineTo(obstacle.width / 4, obstacle.height / 4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(obstacle.width / 4, -obstacle.height / 4);
          ctx.lineTo(-obstacle.width / 4, obstacle.height / 4);
          ctx.stroke();
          break;
          
        case OBSTACLE_TYPES.SNOWMAN:
          // Draw enemy snowman (smaller) with better graphics
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Body (bottom)
          const enemyBottomGradient = ctx.createRadialGradient(0, 3, 0, 0, 3, 8);
          enemyBottomGradient.addColorStop(0, '#E0E0E0');
          enemyBottomGradient.addColorStop(0.8, '#BDBDBD');
          enemyBottomGradient.addColorStop(1, '#9E9E9E');
          ctx.fillStyle = enemyBottomGradient;
          ctx.beginPath();
          ctx.arc(0, 5, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#9E9E9E';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Body (top)
          const enemyTopGradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 6);
          enemyTopGradient.addColorStop(0, '#E0E0E0');
          enemyTopGradient.addColorStop(0.8, '#BDBDBD');
          enemyTopGradient.addColorStop(1, '#9E9E9E');
          ctx.fillStyle = enemyTopGradient;
          ctx.beginPath();
          ctx.arc(0, -3, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#9E9E9E';
          ctx.stroke();
          
          // Eyes (angry)
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(-2.5, -4, 1.5, 0, Math.PI * 2);
          ctx.fill();
    ctx.beginPath();
          ctx.arc(2.5, -4, 1.5, 0, Math.PI * 2);
    ctx.fill();

          // Angry eyebrows
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, -6);
          ctx.lineTo(-1, -5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(4, -6);
          ctx.lineTo(1, -5);
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    }
  }

  function drawParticles() {
    // Optimized particle rendering
    if (particles.length === 0 || !ctx) return;
    
    // Group particles by color and alpha for batch rendering
    const particlesByColor = {};
    for (let particle of particles) {
      const key = particle.color + '_' + Math.floor(particle.alpha * 10);
      if (!particlesByColor[key]) {
        particlesByColor[key] = [];
      }
      particlesByColor[key].push(particle);
    }
    
    // Draw each color/alpha group
    for (let key in particlesByColor) {
      const colorParticles = particlesByColor[key];
      if (colorParticles.length === 0) continue;
      
      const firstParticle = colorParticles[0];
      ctx.fillStyle = firstParticle.color;
      ctx.globalAlpha = firstParticle.alpha;
      
      ctx.beginPath();
      for (let particle of colorParticles) {
        ctx.moveTo(particle.x + particle.size, particle.y);
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    
    ctx.globalAlpha = 1; // Reset alpha
  }

  function drawShield() {
    if (!ctx) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2 + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Game loop
  function gameLoop(currentTime) {
    if (!canvas || !ctx) {
      requestAnimationFrame(gameLoop);
      return;
    }
    
    if (!lastTime) lastTime = currentTime;
    deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    if (gameState === GAME_STATES.PLAYING) {
      // Update game time
      gameStats.gameTime += deltaTime;
      gameStats.perfectRunTime += deltaTime;
      
      // Update background time for theme animations
      backgroundTime += deltaTime;
      
      // Update level with improved difficulty curve
      // Level increases every 500 points, maximum level is 15
      const newLevel = Math.min(15, Math.floor(gameStats.score / 500) + 1);
      if (newLevel > gameStats.level) {
        const oldLevel = gameStats.level;
        gameStats.level = newLevel;
        
        // Spawn interval decreases with each level (density increases)
        // Level 1: 2500ms, Level 2: 2400ms, Level 3: 2300ms, ..., Level 15: 1100ms (min)
        // Formula: 2500 - (level - 1) * 100, minimum 1100ms
        obstacleSpawnInterval = Math.max(1100, 2500 - (gameStats.level - 1) * 100);
        
        // Collectible spawn interval (balanced density)
        // Level 1: 1800ms, Level 2: 1700ms, Level 3: 1600ms, ..., Level 15: 500ms (min)
        // Formula: 1800 - (level - 1) * 90, minimum 500ms
        collectibleSpawnInterval = Math.max(500, 1800 - (gameStats.level - 1) * 90);
        
        // Adjust minimum gap between obstacles based on level (decreases with level)
        // Level 1: 100px, Level 2: 95px, Level 3: 90px, ..., Level 15: 30px (min)
        // Formula: 100 - (level - 1) * 5, minimum 30px
        minObstacleGap = Math.max(30, 100 - (gameStats.level - 1) * 5);
        
        if (window.AudioManager) {
          window.AudioManager.playSFX('levelup', 1);
        }
        
        // Visual feedback for level up
        if (canvas) {
          createParticles(canvas.width / 2, canvas.height / 2, 30, '#FFD700');
        }
      }
      
      // Update power-up effects
      if (window.PowerUpManager) {
        window.PowerUpManager.update();
        const effects = window.PowerUpManager.getEffects();
        
        // Reset speed if speed boost expired
        if (!effects.speedMultiplier || effects.speedMultiplier <= 1) {
          player.speed = 0.15;
        } else {
          player.speed = 0.25;
        }
      }
      
      // Update player
      updatePlayer(deltaTime);
      
      // Spawn obstacles
      obstacleSpawnTimer += deltaTime * 1000;
      if (obstacleSpawnTimer >= obstacleSpawnInterval) {
        spawnObstacle();
        obstacleSpawnTimer = 0;
      }
      
      // Update obstacles
      updateObstacles(deltaTime);
      
      // Spawn collectibles - one at a time, continuously
      collectibleSpawnTimer += deltaTime * 1000;
      if (collectibleSpawnTimer >= collectibleSpawnInterval) {
        // Always spawn only 1 item at a time for individual, random distribution
        spawnCollectible();
        collectibleSpawnTimer = 0;
      }
      
      // Update collectibles with synchronized speed
      // Calculate current base speed for collectibles
      const currentBaseSpeed = Math.min(4.5, 1.5 + (gameStats.level - 1) * 0.2);
      const effects = window.PowerUpManager ? window.PowerUpManager.getEffects() : { timeScale: 1 };
      const timeScale = effects.timeScale || 1;
      updateCollectibles(deltaTime, currentBaseSpeed, timeScale);
      
      // Update particles
      updateParticles(deltaTime);
      
      // Check collisions
      checkCollisions();
      
      // Update combo decay - more forgiving
      // Combo decays if no obstacles passed for a while
      const comboDecayTime = 3; // 3 seconds
      if (gameStats.lastObstacleTime > 0 && gameStats.gameTime - gameStats.lastObstacleTime > comboDecayTime) {
        // Decay gradually, not instantly
        const decayRate = 3; // Decay 3 per second
        const oldCombo = Math.floor(gameStats.combo);
        gameStats.combo = Math.max(0, gameStats.combo - deltaTime * decayRate);
        // Ensure combo is always an integer
        const newCombo = Math.floor(gameStats.combo);
        gameStats.combo = newCombo;
        // If combo changed, update UI immediately
        if (oldCombo !== newCombo) {
          updateUI();
        }
      }
      
      // Bonus score for maintaining combo (only if combo > 0)
      // More balanced: 1 point per second base, +0.5 per combo level per second
      if (gameStats.combo > 0) {
        const scoreMultiplier = window.PowerUpManager ? 
          (window.PowerUpManager.getEffects().scoreMultiplier || 1) : 1;
        // Balanced continuous bonus: 1 base + 0.5 per combo per second
        const bonusPerSecond = 1 + (gameStats.combo * 0.5);
        gameStats.score += Math.floor(deltaTime * bonusPerSecond * scoreMultiplier);
      }
      
      // Update UI
      updateUI();
    }
    
    // Always render
    render();
    
    requestAnimationFrame(gameLoop);
  }

  // Format number with commas for large numbers
  function formatNumber(num) {
    return Math.floor(num).toLocaleString('vi-VN');
  }
  
  // UI Updates
  function updateUI() {
    const scoreEl = document.getElementById('scoreDisplay');
    const comboEl = document.getElementById('comboDisplay');
    const levelEl = document.getElementById('levelDisplay');
    const coinsEl = document.getElementById('coinsDisplay');
    const starsEl = document.getElementById('starsDisplay');
    
    // Ensure combo is always an integer
    const comboValue = Math.floor(gameStats.combo);
    gameStats.combo = comboValue;
    
    // Update score with formatted number
    if (scoreEl) scoreEl.textContent = formatNumber(gameStats.score);
    
    // Update combo with formatted number and visual feedback
    if (comboEl) {
      comboEl.textContent = formatNumber(comboValue);
      // Visual feedback: highlight combo when it's high
      if (comboValue > 0) {
        comboEl.style.color = comboValue >= 10 ? '#ffd700' : comboValue >= 5 ? '#ff9800' : '#ffffff';
        comboEl.style.fontWeight = comboValue >= 10 ? 'bold' : 'normal';
      } else {
        comboEl.style.color = '#ffffff';
        comboEl.style.fontWeight = 'normal';
      }
    }
    
    // Update level
    if (levelEl) levelEl.textContent = gameStats.level;
    
    // Update coins and stars with formatted numbers
    if (coinsEl && window.CollectibleManager) {
      coinsEl.textContent = formatNumber(window.CollectibleManager.totalCoins || 0);
    }
    if (starsEl && window.CollectibleManager) {
      starsEl.textContent = formatNumber(window.CollectibleManager.totalStars || 0);
    }
    
    // Update power-ups UI
    updatePowerUpsUI();
  }

  function updatePowerUpsUI() {
    if (!window.PowerUpManager) return;
    
    const container = document.getElementById('powerUpsDisplay');
    if (!container) return;
    
    const activePowerUps = window.PowerUpManager.getActiveList();
    const effects = window.PowerUpManager.getEffects();
    
    let html = '';
    const powerUpNames = {
      'shield': '🛡️ Shield',
      'speedBoost': '⚡ Speed Boost',
      'scoreMultiplier': '⭐ Score x2',
      'slowMotion': '⏱️ Slow Motion',
      'magnet': '🧲 Magnet'
    };
    
    for (let type of activePowerUps) {
      const remaining = window.PowerUpManager.getRemainingTime(type);
      html += `
        <div class="powerup-indicator" data-type="${type}">
          <div class="powerup-icon">${powerUpNames[type] ? powerUpNames[type].split(' ')[0] : '✨'}</div>
          <div class="powerup-info">
            <div class="powerup-name">${powerUpNames[type] ? powerUpNames[type].substring(2) : type}</div>
            <div class="powerup-timer">
              <div class="powerup-timer-bar" style="width: ${remaining * 100}%"></div>
            </div>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
  }

  // Pause/Resume
  function togglePause() {
    if (gameState === GAME_STATES.PLAYING) {
      gameState = GAME_STATES.PAUSED;
      showPauseMenu();
      // Pause background music when game is paused
      const bgMusic = document.getElementById('bgMusic');
      if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
      }
    } else if (gameState === GAME_STATES.PAUSED) {
      gameState = GAME_STATES.PLAYING;
      hidePauseMenu();
      // Resume background music when game resumes
      const bgMusic = document.getElementById('bgMusic');
      if (bgMusic) {
        // Default to 'on' if no setting exists
        const musicSetting = localStorage.getItem('music');
        const musicEnabled = musicSetting === null || musicSetting === 'on';
        if (musicEnabled) {
          bgMusic.play().catch(e => {
            console.log('Background music resume failed:', e);
          });
        }
      }
    }
  }

  function showPauseMenu() {
    const menu = document.getElementById('pauseMenu');
    if (menu) menu.classList.remove('hidden');
  }

  function hidePauseMenu() {
    const menu = document.getElementById('pauseMenu');
    if (menu) menu.classList.add('hidden');
  }

  // Game Over
  function gameOver() {
    gameState = GAME_STATES.GAME_OVER;
    
    // Pause background music when game over
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
    }
    
    // Reset combo when game over (va chạm = mất combo)
    gameStats.combo = 0;
    updateUI(); // Update UI to show combo reset
    
    // Play collision sound
    if (window.AudioManager) {
      window.AudioManager.playSFX('collision', 1);
    }
    
    // Create explosion particles
    createParticles(player.x, player.y, 30, '#FF0000');
    
    // Update statistics
    gameStats.maxSpeed = Math.max(gameStats.maxSpeed, 2 + gameStats.level * 0.3);
    if (window.CollectibleManager) {
      gameStats.totalCoins = window.CollectibleManager.totalCoins;
    }
    
    // Check achievements
    if (window.AchievementManager) {
      window.AchievementManager.checkAchievements(gameStats);
    }
    
    // Save to leaderboard
    if (window.LeaderboardManager) {
      window.LeaderboardManager.addEntry(
        Math.floor(gameStats.score),
        gameStats.gameTime,
        gameStats.totalCoins
      );
      window.LeaderboardManager.updateStats(gameStats.gameTime, gameStats.totalCoins);
    }
    
    // Show game over screen
    showGameOver();
  }

  function showGameOver() {
    const overlay = document.getElementById('gameOverScreen');
    if (!overlay) {
      console.warn('Game over screen element not found');
      return;
    }
    
    // Hide pause menu if open
    hidePauseMenu();
    
    // Show game over screen
    overlay.classList.remove('hidden');
    
    // Update stats to match HTML elements
    const finalScore = document.getElementById('finalScore');
    const finalCombo = document.getElementById('finalCombo');
    const finalLevel = document.getElementById('finalLevel');
    const finalTime = document.getElementById('finalTime');
    
    if (finalScore) finalScore.textContent = formatNumber(gameStats.score);
    if (finalCombo) finalCombo.textContent = formatNumber(gameStats.maxCombo);
    if (finalLevel) finalLevel.textContent = gameStats.level;
    if (finalTime) {
      const mins = Math.floor(gameStats.gameTime / 60);
      const secs = Math.floor(gameStats.gameTime % 60);
      finalTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  function hideGameOver() {
    const overlay = document.getElementById('gameOverScreen');
    if (overlay) overlay.classList.add('hidden');
  }

  // Detect mobile and setup accordingly
  function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileControls = document.getElementById('mobileControls');
    
    if (mobileControls && (isMobile || isTouchDevice)) {
      mobileControls.classList.add('active');
    }
    
    // Adjust touch sensitivity based on device
    if (isMobile) {
      touchSensitivity = 1.5; // More sensitive on mobile
    }
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  // Start game
  function start() {
    // Initialize managers first
    if (window.AudioManager && typeof window.AudioManager.init === 'function') {
      window.AudioManager.init();
    }
    if (window.CollectibleManager && typeof window.CollectibleManager.init === 'function') {
      window.CollectibleManager.init();
    }
    if (window.ShopManager && typeof window.ShopManager.init === 'function') {
      window.ShopManager.init();
    }
    
    // Initialize canvas first
    if (!initCanvas()) {
      console.error('Failed to initialize canvas. Retrying...');
      setTimeout(start, 100);
      return;
    }
    
    setupInput();
    detectMobile();
    init();
    
    // Ensure music plays after user interaction (clicking start button)
    // This is called after setupInput which sets up event listeners
    setTimeout(() => {
      const bgMusic = document.getElementById('bgMusic');
      if (bgMusic) {
        const musicSetting = localStorage.getItem('music');
        const musicEnabled = musicSetting === null || musicSetting === 'on';
        if (musicEnabled && bgMusic.paused) {
          bgMusic.play().catch(() => {});
        }
      }
    }, 100);
    
    requestAnimationFrame(gameLoop);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    // DOM already loaded, but wait a bit to ensure all scripts are loaded
    setTimeout(start, 50);
  }

})();
