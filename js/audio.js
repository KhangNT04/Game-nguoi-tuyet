// Audio Manager
// Quản lý sound effects và background music

(function() {
  'use strict';

  window.AudioManager = {
    sounds: {},
    musicVolume: 0.5,
    sfxVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true,

    // Initialize audio system
    init: function() {
      // Load saved settings
      const savedMusicVol = localStorage.getItem('musicVolume');
      const savedSfxVol = localStorage.getItem('sfxVolume');
      const savedMusicEnabled = localStorage.getItem('musicEnabled');
      const savedSfxEnabled = localStorage.getItem('sfxEnabled');

      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedMusicEnabled !== null) this.musicEnabled = savedMusicEnabled === 'true';
      if (savedSfxEnabled !== null) this.sfxEnabled = savedSfxEnabled === 'true';

      // Create audio context for sound effects (using Web Audio API if available)
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio API not supported, using HTML5 Audio');
        this.audioContext = null;
      }

      // Pre-create sound objects (can be expanded with actual sound files)
      this.preloadSounds();
    },

    // Preload sound definitions
    preloadSounds: function() {
      // Sound effects sẽ được tạo động bằng Web Audio API
      // Hoặc có thể load từ files nếu có
      this.sounds = {
        collect: null,
        powerup: null,
        collision: null,
        levelup: null,
        shield: null
      };
    },

    // Play sound effect
    playSFX: function(soundName, volume = 1) {
      if (!this.sfxEnabled) return;

      // Create simple beep sound using Web Audio API
      if (this.audioContext && this.audioContext.state !== 'suspended') {
        try {
          this.playTone(soundName, volume);
        } catch (e) {
          console.log('Error playing sound:', e);
        }
      }
    },

    // Generate tones for sound effects
    playTone: function(type, volume = 1) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different frequencies for different sounds
      const frequencies = {
        collect: { freq: 800, duration: 0.1 },
        powerup: { freq: 600, duration: 0.2 },
        collision: { freq: 200, duration: 0.3 },
        levelup: { freq: 1000, duration: 0.15 },
        shield: { freq: 400, duration: 0.25 }
      };

      const sound = frequencies[type] || frequencies.collect;

      oscillator.frequency.value = sound.freq;
      oscillator.type = type === 'collision' ? 'sawtooth' : 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + sound.duration);
    },

    // Set music volume
    setMusicVolume: function(volume) {
      this.musicVolume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('musicVolume', this.musicVolume.toString());
      
      // Update background music if it exists (check both IDs for compatibility)
      const bgMusic = document.getElementById('bgMusic') || document.getElementById('backgroundMusic');
      if (bgMusic) {
        bgMusic.volume = this.musicVolume;
      }
    },

    // Set SFX volume
    setSFXVolume: function(volume) {
      this.sfxVolume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('sfxVolume', this.sfxVolume.toString());
    },

    // Toggle music
    toggleMusic: function() {
      this.musicEnabled = !this.musicEnabled;
      localStorage.setItem('musicEnabled', this.musicEnabled.toString());
      // Also update the 'music' key used by welcome screen
      localStorage.setItem('music', this.musicEnabled ? 'on' : 'off');
      
      const bgMusic = document.getElementById('bgMusic') || document.getElementById('backgroundMusic');
      if (bgMusic) {
        if (this.musicEnabled) {
          bgMusic.play().catch(e => console.log('Music play failed:', e));
        } else {
          bgMusic.pause();
        }
      }
    },

    // Toggle SFX
    toggleSFX: function() {
      this.sfxEnabled = !this.sfxEnabled;
      localStorage.setItem('sfxEnabled', this.sfxEnabled.toString());
    },

    // Resume audio context (required for some browsers)
    resume: function() {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      AudioManager.init();
    });
  } else {
    AudioManager.init();
  }

  // Resume audio context on user interaction
  document.addEventListener('click', function() {
    AudioManager.resume();
  }, { once: true });

})();

